using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/ventas")]
public class VentasController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public VentasController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int limit = 50)
    {
        var ventas = await _db.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
            .Include(v => v.Pagos)
            .OrderByDescending(v => v.FechaHora)
            .Take(limit)
            .ToListAsync();

        return Ok(ventas);
    }

    [HttpPost]
    public async Task<IActionResult> RegistrarVenta([FromBody] RegistrarVentaRequestDto req)
    {
        if (req.Items == null || !req.Items.Any())
        {
            return BadRequest(new { message = "La venta debe incluir al menos un producto" });
        }

        // Buscar cliente por Id o Código
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Codigo == req.ClienteId || c.Id.ToString() == req.ClienteId);

        if (cliente == null)
        {
            return NotFound(new { message = $"Cliente '{req.ClienteId}' no encontrado" });
        }

        // Buscar vendedor/usuario
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower());

        if (usuario == null)
        {
            // Default al primer usuario activo
            usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo) 
                      ?? new Usuario { Id = 1, Nombre = "Miguel", Rol = "Administrador" };
        }

        // Validar pagos y montos
        var totalPagos = req.Pagos?.Sum(p => p.Monto) ?? 0m;
        var creditoOtorgado = req.Pagos?.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto) ?? 0m;
        var totalPagadoDirecto = totalPagos - creditoOtorgado;

        if (creditoOtorgado > 0)
        {
            if (cliente.Saldo + creditoOtorgado > cliente.LimiteCredito)
            {
                return StatusCode(422, new
                {
                    message = $"El crédito solicitado (${creditoOtorgado:N2}) excede el límite disponible del cliente. Saldo actual: ${cliente.Saldo:N2}, Límite: ${cliente.LimiteCredito:N2}"
                });
            }
        }

        // Iniciar transacción de base de datos
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var countToday = await _db.Ventas.CountAsync(v => v.FechaHora.Date == DateTime.Today);
            var folio = $"FOL-{DateTime.Now:yyyyMMdd}-{(countToday + 1):D3}";

            var venta = new Venta
            {
                Folio = folio,
                ClienteId = cliente.Id,
                UsuarioId = usuario.Id,
                Total = req.Total,
                Subtotal = req.Total,
                DescuentoTotal = 0,
                Estado = "Completada",
                FechaHora = DateTime.Now
            };

            _db.Ventas.Add(venta);
            await _db.SaveChangesAsync();

            // Procesar líneas de venta y descontar stock por piezas
            foreach (var item in req.Items)
            {
                var producto = await _db.Productos
                    .FirstOrDefaultAsync(p => p.Codigo == item.ProductoId || p.Id.ToString() == item.ProductoId);

                if (producto != null)
                {
                    var piezasADescontar = item.PiezasTotalesCalculadas > 0 
                        ? item.PiezasTotalesCalculadas 
                        : item.CantidadPresentaciones;

                    // Descontar inventario en piezas globales
                    producto.Existencia -= piezasADescontar;

                    // Registrar movimiento de auditoría/kardex
                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        ProductoId = producto.Id,
                        TipoMovimiento = "Venta",
                        Ubicacion = usuario.RutaAsignada ?? "Camioneta 1",
                        Piezas = -piezasADescontar,
                        Motivo = $"Venta Folio {folio} ({item.CantidadPresentaciones} {item.PresentacionTipo})",
                        FechaHora = DateTime.Now
                    });

                    _db.VentaDetalles.Add(new VentaDetalle
                    {
                        VentaId = venta.Id,
                        ProductoId = producto.Id,
                        PresentacionTipo = item.PresentacionTipo,
                        CantidadPresentaciones = item.CantidadPresentaciones,
                        PiezasTotales = piezasADescontar,
                        PrecioUnitario = item.PrecioUnitario,
                        Subtotal = item.Subtotal
                    });
                }
            }

            // Registrar pagos
            if (req.Pagos != null && req.Pagos.Any())
            {
                foreach (var p in req.Pagos)
                {
                    _db.Pagos.Add(new Pago
                    {
                        VentaId = venta.Id,
                        Metodo = p.Metodo,
                        Monto = p.Monto,
                        FechaHora = DateTime.Now
                    });
                }
            }

            // Actualizar saldo del cliente y visita
            if (creditoOtorgado > 0)
            {
                cliente.Saldo += creditoOtorgado;
            }

            cliente.UltimaCompra = DateTime.Now.ToString("dd MMM yyyy, hh:mm tt");
            cliente.EstadoVisita = "Visitado";

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            var resp = new VentaRegistradaResponseDto
            {
                Folio = folio,
                FechaHora = venta.FechaHora,
                TotalVenta = venta.Total,
                TotalPagado = totalPagadoDirecto,
                CreditoOtorgado = creditoOtorgado,
                NuevoSaldoCliente = cliente.Saldo,
                Estado = "Completada"
            };

            return StatusCode(201, resp);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al procesar la venta en base de datos", detalle = ex.Message });
        }
    }
}
