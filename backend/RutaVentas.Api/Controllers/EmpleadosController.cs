using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/empleados")]
public class EmpleadosController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public EmpleadosController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<EmpleadoDetalleDto>>> GetEmpleados()
    {
        var hoy = DateTime.Today;
        var usuarios = await _db.Usuarios.ToListAsync();

        var result = new List<EmpleadoDetalleDto>();

        foreach (var u in usuarios)
        {
            var ventasHoy = await _db.Ventas
                .Where(v => v.UsuarioId == u.Id && v.FechaHora >= hoy)
                .SumAsync(v => (decimal?)v.Total) ?? 0m;

            var cobranzaHoy = await _db.AbonosCobranza
                .Where(a => a.UsuarioId == u.Id && a.FechaHora >= hoy)
                .SumAsync(a => (decimal?)a.Monto) ?? 0m;

            var visitados = await _db.Ventas
                .Where(v => v.UsuarioId == u.Id && v.FechaHora >= hoy)
                .Select(v => v.ClienteId)
                .Distinct()
                .CountAsync();

            result.Add(new EmpleadoDetalleDto
            {
                Id = u.Id.ToString(),
                Nombre = u.Nombre,
                Usuario = u.NombreUsuario,
                Rol = u.Rol,
                Ruta = u.RutaAsignada ?? "Sin ruta",
                Estado = u.Activo ? "Activo" : "Inactivo",
                VentasHoy = ventasHoy,
                CobranzaHoy = cobranzaHoy,
                ClientesVisitados = visitados
            });
        }

        return Ok(result);
    }
}
