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
                    if (req.EsEntradaMercancia)
                    {
                        prod.Existencia += lote.Piezas;
                    }

                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        ProductoId = prod.Id,
                        TipoMovimiento = req.EsEntradaMercancia ? "EntradaMercancia" : "CargaMatutinaVerificada",
                        Ubicacion = req.UbicacionDestino ?? usuario.RutaAsignada ?? "Camioneta 1",
                        Piezas = lote.Piezas,
                        Motivo = req.EsEntradaMercancia
                            ? $"Entrada de mercancía / surtido ({DateTime.Now:dd/MM/yyyy})"
                            : $"Verificación matutina de ruta ({DateTime.Now:dd/MM/yyyy}) - Sin duplicar existencias globales",
                        FechaHora = DateTime.Now
                    });
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = req.EsEntradaMercancia
                    ? "Entrada de mercancía confirmada e incrementada en inventario"
                    : "Verificación de carga matutina confirmada (existencias globales preservadas sin duplicación)",
                piezasCargadas = req.Lotes.Sum(l => l.Piezas),
                esEntradaMercancia = req.EsEntradaMercancia,
                ubicacion = req.UbicacionDestino ?? "Camioneta 1"
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al confirmar carga inicial", detalle = ex.Message });
        }
    }

    [HttpPost("surtido-nota")]
    public async Task<IActionResult> SurtirNotaPdf([FromBody] SurtidoNotaPdfRequestDto req)
    {
        if (req.Items == null || !req.Items.Any())
        {
            return BadRequest(new { message = "La nota no contiene productos para surtir" });
        }

        var ubicacion = req.UbicacionDestino ?? "Camioneta 1";
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            int totalPiezasSurtidas = 0;
            int productosActualizados = 0;

            foreach (var item in req.Items)
            {
                var piezas = item.PiezasASurtir > 0 ? item.PiezasASurtir : item.PiezasCalculadas;
                if (piezas <= 0) continue;

                Data.Entities.Producto? prod = null;
                if (item.ProductoId.HasValue && item.ProductoId.Value > 0)
                {
                    prod = await _db.Productos.FirstOrDefaultAsync(p => p.Id == item.ProductoId.Value);
                }

                if (prod == null && !string.IsNullOrWhiteSpace(item.ProductoIdApp))
                {
                    prod = await _db.Productos.FirstOrDefaultAsync(p => p.Codigo == item.ProductoIdApp || p.Id.ToString() == item.ProductoIdApp);
                }

                if (prod == null && !string.IsNullOrWhiteSpace(item.ProductoAlmacen))
                {
                    var nomAlm = item.ProductoAlmacen.Trim().ToLower();
                    prod = await _db.Productos.FirstOrDefaultAsync(p => 
                        (p.NombreAlmacen != null && p.NombreAlmacen.ToLower() == nomAlm) ||
                        p.Nombre.ToLower() == nomAlm);
                }

                // Si aún no existe en el catálogo de la app, darlo de alta automáticamente como producto nuevo
                if (prod == null && !string.IsNullOrWhiteSpace(item.ProductoAlmacen))
                {
                    var isKg = item.Um.Equals("KG", StringComparison.OrdinalIgnoreCase) || item.Um.Equals("KGS", StringComparison.OrdinalIgnoreCase);
                    var newCodigo = "PROD-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
                    prod = new Data.Entities.Producto
                    {
                        Codigo = newCodigo,
                        Nombre = item.ProductoAlmacen.Trim(),
                        NombreAlmacen = item.ProductoAlmacen.Trim(),
                        Categoria = isKg ? "Salchichonería" : "Abarrotes",
                        Unidad = isKg ? "kg" : "pieza",
                        PrecioBase = 50.0m,
                        PrecioCompra = 40.0m,
                        Existencia = 0,
                        Activo = true
                    };
                    _db.Productos.Add(prod);
                    await _db.SaveChangesAsync(); // Genera prod.Id
                }

                if (prod != null)
                {
                    int incremento = (int)Math.Max(1, Math.Round(piezas));
                    prod.Existencia += incremento;
                    totalPiezasSurtidas += incremento;
                    productosActualizados++;

                    bool recordar = item.GuardarVinculacion || item.RecordarVinculacion;
                    if ((recordar || string.IsNullOrWhiteSpace(prod.NombreAlmacen)) && !string.IsNullOrWhiteSpace(item.ProductoAlmacen))
                    {
                        prod.NombreAlmacen = item.ProductoAlmacen.Trim();
                    }

                    var motivoText = $"Surtido nota #{req.FolioNota} ({req.FechaNota}) - {item.ProductoAlmacen} ({item.CantidadNota} {item.Um})";
                    if (motivoText.Length > 195)
                    {
                        motivoText = motivoText[..195];
                    }

                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        ProductoId = prod.Id,
                        TipoMovimiento = "SurtidoAlmacenPDF",
                        Ubicacion = ubicacion,
                        Piezas = incremento,
                        Motivo = motivoText,
                        FechaHora = DateTime.Now
                    });
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = $"Nota #{req.FolioNota} procesada con éxito: {totalPiezasSurtidas} piezas surtidas en {productosActualizados} productos.",
                folio = req.FolioNota,
                totalPiezas = totalPiezasSurtidas,
                productosSurtidos = productosActualizados
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al registrar surtido de nota", detalle = ex.Message });
        }
    }
}
