using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
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
        var usuarios = await _db.Usuarios.OrderBy(u => u.Id).ToListAsync();

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

            PermisosEmpleadoDto permisos = new();
            if (!string.IsNullOrWhiteSpace(u.PermisosJson))
            {
                try
                {
                    permisos = JsonSerializer.Deserialize<PermisosEmpleadoDto>(u.PermisosJson) ?? new();
                }
                catch { }
            }
            else
            {
                // Permisos predeterminados según rol
                if (u.Rol == "Administrador")
                {
                    permisos = new PermisosEmpleadoDto
                    {
                        PuedeVender = true,
                        PuedeVerClientes = true,
                        PuedeCrearClientes = true,
                        PuedeVerProductos = true,
                        SoloLecturaInventario = false,
                        PuedeCobrar = true
                    };
                }
                else
                {
                    permisos = new PermisosEmpleadoDto
                    {
                        PuedeVender = true,
                        PuedeVerClientes = true,
                        PuedeCrearClientes = true,
                        PuedeVerProductos = true,
                        SoloLecturaInventario = true, // Trabajador solo lectura de inventario
                        PuedeCobrar = true
                    };
                }
            }

            result.Add(new EmpleadoDetalleDto
            {
                Id = u.Id.ToString(),
                Nombre = u.Nombre,
                Usuario = u.NombreUsuario,
                Rol = u.Rol,
                Ruta = u.RutaAsignada ?? "Ruta Centro",
                Estado = u.Activo ? "Activo" : "Inactivo",
                Telefono = u.Telefono,
                Pin = u.Pin,
                Permisos = permisos,
                VentasHoy = ventasHoy,
                CobranzaHoy = cobranzaHoy,
                ClientesVisitados = visitados
            });
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmpleadoDetalleDto>> GetById(string id)
    {
        var u = await _db.Usuarios.FirstOrDefaultAsync(x => x.Id.ToString() == id || x.NombreUsuario.ToLower() == id.ToLower());
        if (u == null) return NotFound(new { message = "Trabajador no encontrado" });

        PermisosEmpleadoDto permisos = new();
        if (!string.IsNullOrWhiteSpace(u.PermisosJson))
        {
            try { permisos = JsonSerializer.Deserialize<PermisosEmpleadoDto>(u.PermisosJson) ?? new(); } catch { }
        }

        return Ok(new EmpleadoDetalleDto
        {
            Id = u.Id.ToString(),
            Nombre = u.Nombre,
            Usuario = u.NombreUsuario,
            Rol = u.Rol,
            Ruta = u.RutaAsignada ?? "Ruta Centro",
            Estado = u.Activo ? "Activo" : "Inactivo",
            Telefono = u.Telefono,
            Pin = u.Pin,
            Permisos = permisos
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GuardarEmpleadoRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre) || string.IsNullOrWhiteSpace(req.Usuario))
        {
            return BadRequest(new { message = "Nombre y Usuario son obligatorios" });
        }

        var normalizedUser = req.Usuario.Trim().ToLower();
        if (await _db.Usuarios.AnyAsync(u => u.NombreUsuario.ToLower() == normalizedUser))
        {
            return BadRequest(new { message = $"El nombre de usuario '{req.Usuario}' ya está registrado" });
        }

        var permisosJson = req.Permisos != null ? JsonSerializer.Serialize(req.Permisos) : null;

        var nuevo = new Usuario
        {
            Nombre = req.Nombre.Trim(),
            NombreUsuario = normalizedUser,
            PasswordHash = !string.IsNullOrWhiteSpace(req.Password) ? req.Password.Trim() : "1234",
            Rol = string.IsNullOrWhiteSpace(req.Rol) ? "Vendedor" : req.Rol.Trim(),
            RutaAsignada = req.Ruta?.Trim() ?? "Ruta Centro",
            Telefono = req.Telefono?.Trim(),
            Pin = req.Pin?.Trim() ?? "1234",
            PermisosJson = permisosJson,
            Activo = req.Activo,
            FechaCreacion = DateTime.Now
        };

        _db.Usuarios.Add(nuevo);
        await _db.SaveChangesAsync();

        return StatusCode(201, new EmpleadoDetalleDto
        {
            Id = nuevo.Id.ToString(),
            Nombre = nuevo.Nombre,
            Usuario = nuevo.NombreUsuario,
            Rol = nuevo.Rol,
            Ruta = nuevo.RutaAsignada,
            Estado = nuevo.Activo ? "Activo" : "Inactivo",
            Telefono = nuevo.Telefono,
            Pin = nuevo.Pin,
            Permisos = req.Permisos ?? new()
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] GuardarEmpleadoRequestDto req)
    {
        var u = await _db.Usuarios.FirstOrDefaultAsync(x => x.Id.ToString() == id || x.NombreUsuario.ToLower() == id.ToLower());
        if (u == null) return NotFound(new { message = "Trabajador no encontrado" });

        if (!string.IsNullOrWhiteSpace(req.Nombre)) u.Nombre = req.Nombre.Trim();
        if (!string.IsNullOrWhiteSpace(req.Usuario)) u.NombreUsuario = req.Usuario.Trim().ToLower();
        if (!string.IsNullOrWhiteSpace(req.Password)) u.PasswordHash = req.Password.Trim();
        if (!string.IsNullOrWhiteSpace(req.Pin)) u.Pin = req.Pin.Trim();
        if (!string.IsNullOrWhiteSpace(req.Rol)) u.Rol = req.Rol.Trim();
        if (!string.IsNullOrWhiteSpace(req.Ruta)) u.RutaAsignada = req.Ruta.Trim();
        if (req.Telefono != null) u.Telefono = req.Telefono.Trim();
        u.Activo = req.Activo;

        if (req.Permisos != null)
        {
            u.PermisosJson = JsonSerializer.Serialize(req.Permisos);
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Trabajador actualizado correctamente", id = u.Id.ToString() });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var u = await _db.Usuarios.FirstOrDefaultAsync(x => x.Id.ToString() == id);
        if (u == null) return NotFound(new { message = "Trabajador no encontrado" });

        u.Activo = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = $"Trabajador '{u.Nombre}' desactivado correctamente" });
    }
}
