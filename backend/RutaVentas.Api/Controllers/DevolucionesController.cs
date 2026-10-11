using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/devoluciones")]
public class DevolucionesController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public DevolucionesController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? clienteId)
    {
        var query = _db.Devoluciones
            .Include(d => d.Cliente)
            .Include(d => d.Producto)
            .Include(d => d.Usuario)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(clienteId))
        {
            query = query.Where(d => d.Cliente != null && (d.Cliente.Codigo == clienteId || d.Cliente.Id.ToString() == clienteId));
        }

        var list = await query
            .OrderByDescending(d => d.FechaHora)
            .Select(d => new DevolucionDto
            {
                Id = d.Id,
                Folio = d.Folio,
                ClienteId = d.Cliente != null ? d.Cliente.Codigo : "",
                ClienteNombre = d.Cliente != null ? d.Cliente.Nombre : "Cliente",
                ProductoId = d.Producto != null ? d.Producto.Codigo : "",
                ProductoNombre = d.Producto != null ? d.Producto.Nombre : "Producto",
                Cantidad = d.Cantidad,
                PresentacionTipo = d.PresentacionTipo,
                Total = d.Total,
                Motivo = d.Motivo,
                Destino = d.Destino,
                MetodoReembolso = d.MetodoReembolso,
                FechaHora = d.FechaHora
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> RegistrarDevolucion([FromBody] RegistrarDevolucionRequestDto req)
    {
        if (req.Cantidad <= 0)
        {
            return BadRequest(new { message = "La cantidad a devolver debe ser mayor a 0" });
        }

        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Codigo == req.ClienteId || c.Id.ToString() == req.ClienteId);

        if (cliente == null)
        {
            return NotFound(new { message = $"Cliente '{req.ClienteId}' no encontrado" });
        }

        var producto = await _db.Productos
            .FirstOrDefaultAsync(p => p.Codigo == req.ProductoId || p.Id.ToString() == req.ProductoId);

        if (producto == null)
        {
            return NotFound(new { message = $"Producto '{req.ProductoId}' no encontrado" });
        }

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo)
            ?? new Usuario { Id = 1, Nombre = "Miguel" };

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var countToday = await _db.Devoluciones.CountAsync(d => d.FechaHora.Date == DateTime.Today);
            var folio = $"DEV-{DateTime.Now:yyyyMMdd}-{(countToday + 1):D3}";

            var devolucion = new Devolucion
            {
                Folio = folio,
                ClienteId = cliente.Id,
                UsuarioId = usuario.Id,
                ProductoId = producto.Id,
                Cantidad = req.Cantidad,
                PresentacionTipo = req.PresentacionTipo,
                PrecioUnitario = req.PrecioUnitario,
                Total = req.Total > 0 ? req.Total : (req.Cantidad * req.PrecioUnitario),
                Motivo = req.Motivo,
                Destino = req.Destino,
                MetodoReembolso = req.MetodoReembolso,
                Observaciones = req.Observaciones,
                FechaHora = DateTime.Now
            };

            _db.Devoluciones.Add(devolucion);

            // Si el destino es Inventario, regresarlo a piezas en existencia
            if (req.Destino.Equals("Inventario", StringComparison.OrdinalIgnoreCase))
            {
                producto.Existencia += req.Cantidad;

                _db.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    ProductoId = producto.Id,
                    TipoMovimiento = "Devolucion",
                    Ubicacion = usuario.RutaAsignada ?? "Camioneta 1",
                    Piezas = req.Cantidad,
                    Motivo = $"Devolución {folio} reintegrada a stock ({req.Motivo})",
                    FechaHora = DateTime.Now
                });
            }
            else
            {
                // Merma (destrucción o merma no vendible)
                _db.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    ProductoId = producto.Id,
                    TipoMovimiento = "Merma",
                    Ubicacion = usuario.RutaAsignada ?? "Camioneta 1",
                    Piezas = 0,
                    Motivo = $"Devolución {folio} clasificada como merma ({req.Motivo})",
                    FechaHora = DateTime.Now
                });
            }

            // Si el método es Saldo a Favor, reducir saldo pendiente del cliente si tiene deuda
            if (req.MetodoReembolso.Equals("SaldoAFavor", StringComparison.OrdinalIgnoreCase))
            {
                cliente.Saldo -= devolucion.Total;
                if (cliente.Saldo < 0) cliente.Saldo = 0;
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return StatusCode(201, new DevolucionDto
            {
                Id = devolucion.Id,
                Folio = folio,
                ClienteId = cliente.Codigo,
                ClienteNombre = cliente.Nombre,
                ProductoId = producto.Codigo,
                ProductoNombre = producto.Nombre,
                Cantidad = devolucion.Cantidad,
                PresentacionTipo = devolucion.PresentacionTipo,
                Total = devolucion.Total,
                Motivo = devolucion.Motivo,
                Destino = devolucion.Destino,
                MetodoReembolso = devolucion.MetodoReembolso,
                FechaHora = devolucion.FechaHora
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al procesar devolución", detalle = ex.Message });
        }
    }
}
