using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/inventario/revision")]
public class RevisionController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public RevisionController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetRevisionItems([FromQuery] string? rutaId)
    {
        var productos = await _db.Productos
            .Where(p => p.Activo)
            .OrderBy(p => p.Id)
            .ToListAsync();

        var list = productos.Select(p => new RevisionItemDto
        {
            ProductoId = p.Codigo,
            ProductoNombre = p.Nombre,
            Marca = p.Marca,
            Sistema = p.Existencia,
            Fisico = p.Existencia, // Inicialmente igual al sistema
            Diferencia = 0,
            Revisado = false,
            Comentario = ""
        }).ToList();

        return Ok(list);
    }

    [HttpPost("autorizar")]
    public async Task<IActionResult> AutorizarAjuste([FromBody] AutorizarAjusteInventarioDto req)
    {
        if (req.Ajustes == null || !req.Ajustes.Any())
        {
            return BadRequest(new { message = "No se proporcionaron ajustes para autorizar" });
        }

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Rol == "Administrador")
            ?? new Usuario { Id = 1, Nombre = "Miguel" };

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var auditoria = new AuditoriaInventario
            {
                UsuarioId = usuario.Id,
                Ruta = usuario.RutaAsignada ?? "Ruta Centro",
                FechaRevision = req.FechaRevision != default ? req.FechaRevision : DateTime.Now,
                Estado = "Autorizado",
                Observaciones = $"Autorizado por {usuario.Nombre} el {DateTime.Now:g}"
            };

            _db.AuditoriaInventario.Add(auditoria);
            await _db.SaveChangesAsync();

            foreach (var aj in req.Ajustes)
            {
                var prod = await _db.Productos
                    .FirstOrDefaultAsync(p => p.Codigo == aj.ProductoId || p.Id.ToString() == aj.ProductoId);

                if (prod != null)
                {
                    _db.AuditoriaInventarioDetalles.Add(new AuditoriaInventarioDetalle
                    {
                        AuditoriaId = auditoria.Id,
                        ProductoId = prod.Id,
                        CantidadSistema = aj.CantidadSistema,
                        CantidadFisica = aj.CantidadFisica,
                        Diferencia = aj.Diferencia,
                        Comentario = aj.Motivo,
                        Revisado = true
                    });

                    // Si hay diferencia, ajustar inventario del producto
                    if (aj.Diferencia != 0)
                    {
                        prod.Existencia = aj.CantidadFisica;

                        _db.InventarioMovimientos.Add(new InventarioMovimiento
                        {
                            ProductoId = prod.Id,
                            TipoMovimiento = "AjusteAuditoria",
                            Ubicacion = auditoria.Ruta,
                            Piezas = aj.Diferencia,
                            Motivo = $"Ajuste físico autorizado: {aj.Motivo}",
                            FechaHora = DateTime.Now
                        });
                    }
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = "Revisión de inventario autorizada y existencias actualizadas en base de datos",
                auditoriaId = auditoria.Id,
                ajustesAplicados = req.Ajustes.Count
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al autorizar auditoría de inventario", detalle = ex.Message });
        }
    }
}
