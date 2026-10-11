using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/inventario")]
public class InventarioController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public InventarioController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetInventario([FromQuery] string? ubicacion)
    {
        var productos = await _db.Productos
            .Include(p => p.Presentaciones)
            .Where(p => p.Activo)
            .OrderBy(p => p.Id)
            .ToListAsync();

        var items = productos.Select(p =>
        {
            var estado = p.Existencia switch
            {
                <= 0 => "Agotado",
                <= 20 => "Bajo",
                _ => "Normal"
            };

            return new ItemInventarioDto
            {
                ProductoId = p.Codigo,
                Nombre = p.Nombre,
                Marca = p.Marca,
                Sku = p.Sku ?? p.Codigo,
                Unidad = p.Unidad,
                ManejaMultiplesPresentaciones = p.ManejaMultiplesPresentaciones,
                ExistenciaPiezas = p.Existencia,
                PrecioBase = p.PrecioBase,
                EstadoStock = estado,
                Presentaciones = p.Presentaciones
                    .Where(pr => pr.Activa)
                    .OrderBy(pr => pr.Orden)
                    .Select(pr => new PresentacionConfigDto
                    {
                        Tipo = pr.Tipo,
                        Nombre = pr.Nombre,
                        PiezasEquivalentes = pr.PiezasEquivalentes,
                        Precio = pr.Precio,
                        DescripcionEquivalencia = pr.DescripcionEquivalencia,
                        CodigoBarras = pr.CodigoBarras ?? "",
                        Activa = pr.Activa,
                        Orden = pr.Orden
                    }).ToList()
            };
        }).ToList();

        var totalPiezas = items.Sum(i => i.ExistenciaPiezas);
        var totalBajo = items.Count(i => i.EstadoStock == "Bajo");
        var totalAgotados = items.Count(i => i.EstadoStock == "Agotado");

        var response = new InventarioUbicacionDto
        {
            UbicacionId = ubicacion ?? "Camioneta 1",
            UbicacionNombre = ubicacion ?? "Camioneta 1 (Ruta Centro)",
            TotalPiezas = totalPiezas,
            TotalStockBajo = totalBajo,
            TotalAgotados = totalAgotados,
            Items = items
        };

        return Ok(response);
    }

    [HttpPost("transferencias")]
    public async Task<IActionResult> RegistrarTransferencia([FromBody] TransferenciaInventarioDto req)
    {
        if (req.Lotes == null || !req.Lotes.Any())
        {
            return BadRequest(new { message = "Se requiere al menos un lote de producto para la transferencia" });
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            foreach (var lote in req.Lotes)
            {
                var prod = await _db.Productos.FirstOrDefaultAsync(p => p.Codigo == lote.ProductoId || p.Id.ToString() == lote.ProductoId);
                if (prod != null)
                {
                    prod.Existencia += lote.Piezas;

                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        ProductoId = prod.Id,
                        TipoMovimiento = "Traspaso",
                        Ubicacion = req.DestinoId,
                        Piezas = lote.Piezas,
                        Motivo = $"Traspaso de {req.OrigenId} a {req.DestinoId}",
                        FechaHora = DateTime.Now
                    });
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new { message = "Transferencia de inventario registrada con éxito" });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al procesar la transferencia", detalle = ex.Message });
        }
    }

    [HttpPost("carga-inicial")]
    public async Task<IActionResult> ConfirmarCargaInicial([FromBody] ConfirmarCargaInicialRequestDto req)
    {
        if (req.Lotes == null || !req.Lotes.Any())
        {
            return BadRequest(new { message = "Se requiere al menos un producto para la carga inicial" });
        }

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo)
            ?? new Usuario { Id = 1, Nombre = "Miguel" };

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            foreach (var lote in req.Lotes)
            {
                var prod = await _db.Productos.FirstOrDefaultAsync(p => p.Codigo == lote.ProductoId || p.Id.ToString() == lote.ProductoId);
                if (prod != null)
                {
                    prod.Existencia += lote.Piezas;

                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        ProductoId = prod.Id,
                        TipoMovimiento = "CargaInicial",
                        Ubicacion = req.UbicacionDestino ?? usuario.RutaAsignada ?? "Camioneta 1",
                        Piezas = lote.Piezas,
                        Motivo = $"Carga matutina de ruta ({DateTime.Now:dd/MM/yyyy})",
                        FechaHora = DateTime.Now
                    });
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Carga inicial de camioneta confirmada y registrada en inventario",
                piezasCargadas = req.Lotes.Sum(l => l.Piezas),
                ubicacion = req.UbicacionDestino ?? "Camioneta 1"
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al confirmar carga inicial", detalle = ex.Message });
        }
    }
}

