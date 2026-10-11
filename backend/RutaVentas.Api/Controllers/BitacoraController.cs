using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/bitacora")]
public class BitacoraController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public BitacoraController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<BitacoraEventoDto>>> GetEventos(
        [FromQuery] string? tipo = null,
        [FromQuery] string? modulo = null,
        [FromQuery] int limite = 50)
    {
        var query = _db.BitacoraEventos.AsQueryable();

        if (!string.IsNullOrWhiteSpace(tipo) && tipo != "Todos")
        {
            query = query.Where(b => b.Tipo.ToLower() == tipo.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(modulo) && modulo != "Todos")
        {
            query = query.Where(b => b.Modulo.ToLower() == modulo.ToLower());
        }

        var eventos = await query
            .OrderByDescending(b => b.FechaHora)
            .Take(limite)
            .Select(b => new BitacoraEventoDto
            {
                Id = b.Id,
                Fecha = b.FechaHora.ToString("yyyy-MM-dd"),
                Hora = b.FechaHora.ToString("HH:mm:ss"),
                FechaHora = b.FechaHora,
                Tipo = b.Tipo,
                Modulo = b.Modulo,
                Accion = b.Accion,
                Usuario = b.UsuarioNombre,
                Dispositivo = b.Dispositivo,
                Detalle = b.Detalle,
                Estado = b.Estado
            })
            .ToListAsync();

        return Ok(eventos);
    }

    [HttpPost]
    public async Task<ActionResult<BitacoraEventoDto>> RegistrarEvento([FromBody] RegistrarBitacoraRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Accion))
        {
            return BadRequest(new { message = "La acción de bitácora es requerida" });
        }

        var nuevo = new BitacoraEvento
        {
            FechaHora = DateTime.Now,
            Tipo = string.IsNullOrWhiteSpace(req.Tipo) ? "Actividad" : req.Tipo,
            Modulo = string.IsNullOrWhiteSpace(req.Modulo) ? "Sistema" : req.Modulo,
            Accion = req.Accion.Trim(),
            UsuarioNombre = string.IsNullOrWhiteSpace(req.UsuarioNombre) ? "Operador Ruta" : req.UsuarioNombre.Trim(),
            UsuarioId = req.UsuarioId,
            Dispositivo = req.Dispositivo ?? "App Móvil Miguel",
            Detalle = req.Detalle,
            Estado = string.IsNullOrWhiteSpace(req.Estado) ? "Exitoso" : req.Estado
        };

        _db.BitacoraEventos.Add(nuevo);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEventos), new { id = nuevo.Id }, new BitacoraEventoDto
        {
            Id = nuevo.Id,
            Fecha = nuevo.FechaHora.ToString("yyyy-MM-dd"),
            Hora = nuevo.FechaHora.ToString("HH:mm:ss"),
            FechaHora = nuevo.FechaHora,
            Tipo = nuevo.Tipo,
            Modulo = nuevo.Modulo,
            Accion = nuevo.Accion,
            Usuario = nuevo.UsuarioNombre,
            Dispositivo = nuevo.Dispositivo,
            Detalle = nuevo.Detalle,
            Estado = nuevo.Estado
        });
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var total = await _db.BitacoraEventos.CountAsync();
        var errores = await _db.BitacoraEventos.CountAsync(b => b.Tipo == "Error" || b.Estado == "Error");
        var advertencias = await _db.BitacoraEventos.CountAsync(b => b.Estado == "Advertencia");
        var seguridad = await _db.BitacoraEventos.CountAsync(b => b.Tipo == "Seguridad");
        var sync = await _db.BitacoraEventos.CountAsync(b => b.Tipo == "Sincronizacion");

        return Ok(new
        {
            totalEventos = total,
            errores = errores,
            advertencias = advertencias,
            seguridad = seguridad,
            sincronizaciones = sync,
            ultimoEvento = await _db.BitacoraEventos.OrderByDescending(b => b.FechaHora).Select(b => b.FechaHora).FirstOrDefaultAsync()
        });
    }
}
