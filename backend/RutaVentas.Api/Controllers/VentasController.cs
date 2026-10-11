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

        // 1. Idempotencia: Verificar si esta operación ya fue procesada previamente
        var idempotencyKey = Request.Headers["X-Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var existingSale = await _db.Ventas
                .Include(v => v.Cliente)
                .Include(v => v.Pagos)
                .FirstOrDefaultAsync(v => v.Folio == idempotencyKey);

            if (existingSale != null)
            {
                return Ok(new VentaRegistradaResponseDto
                {
                    Folio = existingSale.Folio,
                    FechaHora = existingSale.FechaHora,
                    TotalVenta = existingSale.Total,
                    TotalPagado = existingSale.Pagos.Sum(p => p.Monto),
                    CreditoOtorgado = existingSale.Pagos.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto),
                    NuevoSaldoCliente = existingSale.Cliente?.Saldo ?? 0m,
                    Estado = existingSale.Estado
                });
            }
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

        // Cargar productos y validar existencias de forma transaccional antes de proceder
        var productosDict = new Dictionary<int, Producto>();
        var itemsResueltos = new List<(LineaVentaRequestDto item, Producto prod, int factor, int unidadesBase, string presNombre)>();
        var requerimientosPorProducto = new Dictionary<int, int>();

        foreach (var item in req.Items)
        {
            var producto = await _db.Productos
                .Include(p => p.Presentaciones)
                .FirstOrDefaultAsync(p => p.Codigo == item.ProductoId || p.Id.ToString() == item.ProductoId);

            if (producto == null)
            {
                return NotFound(new { message = $"Producto '{item.ProductoId}' no encontrado en catálogo" });
            }

            productosDict[producto.Id] = producto;

            // Resolver presentación y factor de conversión del servidor
            var pres = producto.Presentaciones?.FirstOrDefault(pr =>
                pr.Tipo.Equals(item.PresentacionTipo, StringComparison.OrdinalIgnoreCase) ||
                pr.Nombre.Equals(item.PresentacionTipo, StringComparison.OrdinalIgnoreCase));

            int factor = pres?.PiezasEquivalentes ?? (item.FactorConversion > 0 ? item.FactorConversion : 1);
            string presNombre = pres?.Nombre ?? item.PresentacionNombre ?? item.PresentacionTipo;
            int unidadesBase = item.CantidadPresentaciones * factor;

            itemsResueltos.Add((item, producto, factor, unidadesBase, presNombre));

            if (!requerimientosPorProducto.ContainsKey(producto.Id))
                requerimientosPorProducto[producto.Id] = 0;
            requerimientosPorProducto[producto.Id] += unidadesBase;
        }

        // Validación estricta de inventario: No permitir vender más de lo disponible
        foreach (var (prodId, totalReq) in requerimientosPorProducto)
        {
            var prod = productosDict[prodId];
            if (totalReq > prod.Existencia)
            {
                return StatusCode(422, new
                {
                    message = $"Inventario insuficiente para '{prod.Nombre}'. Solicitado: {totalReq} {prod.Unidad}(s), Disponible: {prod.Existencia} {prod.Unidad}(s)."
                });
            }
        }

        // Iniciar transacción de base de datos
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var countToday = await _db.Ventas.CountAsync(v => v.FechaHora.Date == DateTime.Today);
            var folio = (!string.IsNullOrWhiteSpace(idempotencyKey) && idempotencyKey.Length <= 50)
                ? idempotencyKey
                : $"FOL-{DateTime.Now:yyyyMMdd}-{(countToday + 1):D3}";

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

            // Procesar líneas de venta y descontar stock por unidades base
            foreach (var (item, producto, factor, unidadesBase, presNombre) in itemsResueltos)
            {
                // Descontar inventario unificado en unidad base
                producto.Existencia -= unidadesBase;

                // Registrar movimiento de auditoría/kardex
                _db.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    ProductoId = producto.Id,
                    TipoMovimiento = "Venta",
                    Ubicacion = usuario.RutaAsignada ?? "Camioneta 1",
                    Piezas = -unidadesBase,
                    Motivo = $"Venta Folio {folio} ({item.CantidadPresentaciones} {presNombre} = {unidadesBase} {producto.Unidad})",
                    FechaHora = DateTime.Now
                });

                _db.VentaDetalles.Add(new VentaDetalle
                {
                    VentaId = venta.Id,
                    ProductoId = producto.Id,
                    PresentacionTipo = item.PresentacionTipo,
                    PresentacionNombre = presNombre,
                    CantidadPresentaciones = item.CantidadPresentaciones,
                    FactorConversion = factor,
                    PiezasTotales = unidadesBase,
                    PrecioUnitario = item.PrecioUnitario,
                    Subtotal = item.Subtotal
                });
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
