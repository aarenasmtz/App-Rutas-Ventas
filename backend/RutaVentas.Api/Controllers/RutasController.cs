using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class RutasController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public RutasController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetRutas([FromQuery] bool? activa = null)
    {
        var query = _db.Rutas.AsQueryable();
        if (activa.HasValue)
        {
            query = query.Where(r => r.Activa == activa.Value);
        }

        var rutas = await query.OrderBy(r => r.Id).ToListAsync();

        var clientesCount = await _db.Clientes
            .GroupBy(c => c.Ruta)
            .Select(g => new { Ruta = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Ruta, x => x.Count);

        var vendedores = await _db.Usuarios
            .Where(u => u.RutaAsignada != null && u.Activo)
            .ToDictionaryAsync(u => u.RutaAsignada!, u => u.Nombre);

        var resultado = rutas.Select(r => new
        {
            id = r.Id,
            nombre = r.Nombre,
            descripcion = r.Descripcion ?? string.Empty,
            activa = r.Activa,
            totalClientes = clientesCount.TryGetValue(r.Nombre, out var c) ? c : 0,
            vendedorAsignado = vendedores.TryGetValue(r.Nombre, out var v) ? v : "Sin asignar"
        });

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRutaById(int id)
    {
        var ruta = await _db.Rutas.FindAsync(id);
        if (ruta == null) return NotFound(new { message = "Ruta no encontrada" });

        var totalClientes = await _db.Clientes.CountAsync(c => c.Ruta == ruta.Nombre);
        var vendedor = await _db.Usuarios.FirstOrDefaultAsync(u => u.RutaAsignada == ruta.Nombre);

        return Ok(new
        {
            id = ruta.Id,
            nombre = ruta.Nombre,
            descripcion = ruta.Descripcion ?? string.Empty,
            activa = ruta.Activa,
            totalClientes = totalClientes,
            vendedorAsignado = vendedor?.Nombre ?? "Sin asignar"
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateRuta([FromBody] GuardarRutaRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
        {
            return BadRequest(new { message = "El nombre de la ruta es obligatorio" });
        }

        var exists = await _db.Rutas.AnyAsync(r => r.Nombre.ToLower() == req.Nombre.Trim().ToLower());
        if (exists)
        {
            return BadRequest(new { message = $"Ya existe una ruta con el nombre '{req.Nombre}'" });
        }

        var ruta = new Ruta
        {
            Nombre = req.Nombre.Trim(),
            Descripcion = req.Descripcion?.Trim(),
            Activa = req.Activa ?? true
        };

        _db.Rutas.Add(ruta);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRutaById), new { id = ruta.Id }, new
        {
            id = ruta.Id,
            nombre = ruta.Nombre,
            descripcion = ruta.Descripcion ?? string.Empty,
            activa = ruta.Activa,
            totalClientes = 0,
            vendedorAsignado = "Sin asignar"
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRuta(int id, [FromBody] GuardarRutaRequestDto req)
    {
        var ruta = await _db.Rutas.FindAsync(id);
        if (ruta == null) return NotFound(new { message = "Ruta no encontrada" });

        var nombreAnterior = ruta.Nombre;
        var nuevoNombre = req.Nombre?.Trim();

        if (!string.IsNullOrWhiteSpace(nuevoNombre) && nuevoNombre != nombreAnterior)
        {
            var exists = await _db.Rutas.AnyAsync(r => r.Id != id && r.Nombre.ToLower() == nuevoNombre.ToLower());
            if (exists)
            {
                return BadRequest(new { message = $"Ya existe otra ruta con el nombre '{nuevoNombre}'" });
            }

            // Propagar el cambio de nombre a Clientes y Usuarios asignados
            var clientes = await _db.Clientes.Where(c => c.Ruta == nombreAnterior).ToListAsync();
            foreach (var cl in clientes)
            {
                cl.Ruta = nuevoNombre;
            }

            var usuarios = await _db.Usuarios.Where(u => u.RutaAsignada == nombreAnterior).ToListAsync();
            foreach (var us in usuarios)
            {
                us.RutaAsignada = nuevoNombre;
            }

            ruta.Nombre = nuevoNombre;
        }

        if (req.Descripcion != null) ruta.Descripcion = req.Descripcion.Trim();
        if (req.Activa.HasValue) ruta.Activa = req.Activa.Value;

        await _db.SaveChangesAsync();

        var totalClientes = await _db.Clientes.CountAsync(c => c.Ruta == ruta.Nombre);
        var vendedor = await _db.Usuarios.FirstOrDefaultAsync(u => u.RutaAsignada == ruta.Nombre);

        return Ok(new
        {
            id = ruta.Id,
            nombre = ruta.Nombre,
            descripcion = ruta.Descripcion ?? string.Empty,
            activa = ruta.Activa,
            totalClientes = totalClientes,
            vendedorAsignado = vendedor?.Nombre ?? "Sin asignar"
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRuta(int id)
    {
        var ruta = await _db.Rutas.FindAsync(id);
        if (ruta == null) return NotFound(new { message = "Ruta no encontrada" });

        ruta.Activa = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Ruta '{ruta.Nombre}' desactivada correctamente" });
    }
}
