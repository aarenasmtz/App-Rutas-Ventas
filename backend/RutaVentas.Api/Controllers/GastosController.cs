using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/gastos")]
public class GastosController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public GastosController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? fecha, [FromQuery] string? empleadoId)
    {
        var targetDate = DateTime.Today;
        if (!string.IsNullOrWhiteSpace(fecha) && DateTime.TryParse(fecha, out var parsed))
        {
            targetDate = parsed.Date;
        }

        var nextDay = targetDate.AddDays(1);
        var query = _db.GastosOperativos
            .Include(g => g.Usuario)
            .Where(g => g.FechaHora >= targetDate && g.FechaHora < nextDay);

        if (!string.IsNullOrWhiteSpace(empleadoId))
        {
            query = query.Where(g => g.UsuarioId.ToString() == empleadoId || 
                                     (g.Usuario != null && g.Usuario.NombreUsuario.ToLower() == empleadoId.ToLower()));
        }

        var list = await query
            .OrderByDescending(g => g.FechaHora)
            .Select(g => new GastoDto
            {
                Id = g.Id,
                EmpleadoId = g.UsuarioId.ToString(),
                EmpleadoNombre = g.Usuario != null ? g.Usuario.Nombre : "Operador",
                Concepto = g.Concepto,
                Importe = g.Importe,
                MetodoPago = g.MetodoPago,
                Observaciones = g.Observaciones,
                FechaHora = g.FechaHora
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> RegistrarGasto([FromBody] RegistrarGastoRequestDto req)
    {
        if (req.Importe <= 0)
        {
            return BadRequest(new { message = "El importe del gasto debe ser mayor a 0" });
        }

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo)
            ?? new Usuario { Id = 1, Nombre = "Miguel" };

        var gasto = new GastoOperativo
        {
            UsuarioId = usuario.Id,
            Concepto = string.IsNullOrWhiteSpace(req.Concepto) ? "Gasolina" : req.Concepto,
            Importe = req.Importe,
            MetodoPago = string.IsNullOrWhiteSpace(req.MetodoPago) ? "Efectivo" : req.MetodoPago,
            Observaciones = req.Observaciones,
            FechaHora = DateTime.Now
        };

        _db.GastosOperativos.Add(gasto);
        await _db.SaveChangesAsync();

        return StatusCode(201, new GastoDto
        {
            Id = gasto.Id,
            EmpleadoId = usuario.Id.ToString(),
            EmpleadoNombre = usuario.Nombre,
            Concepto = gasto.Concepto,
            Importe = gasto.Importe,
            MetodoPago = gasto.MetodoPago,
            Observaciones = gasto.Observaciones,
            FechaHora = gasto.FechaHora
        });
    }
}
