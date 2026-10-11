using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/cobranza")]
public class CobranzaController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public CobranzaController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet("abonos")]
    public async Task<IActionResult> GetAbonos([FromQuery] string? clienteId)
    {
        var query = _db.AbonosCobranza
            .Include(a => a.Cliente)
            .Include(a => a.Usuario)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(clienteId))
        {
            query = query.Where(a => a.Cliente != null && (a.Cliente.Codigo == clienteId || a.Cliente.Id.ToString() == clienteId));
        }

        var list = await query
            .OrderByDescending(a => a.FechaHora)
            .Select(a => new
            {
                a.Id,
                ClienteId = a.Cliente != null ? a.Cliente.Codigo : "",
                ClienteNombre = a.Cliente != null ? a.Cliente.Nombre : "",
                UsuarioNombre = a.Usuario != null ? a.Usuario.Nombre : "",
                a.Monto,
                a.MetodoPago,
                a.Comentario,
                a.FechaHora
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("abonos")]
    public async Task<IActionResult> RegistrarAbono([FromBody] RegistrarAbonoRequestDto req)
    {
        if (req.Monto <= 0)
        {
            return BadRequest(new { message = "El monto del abono debe ser mayor a 0" });
        }

        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Codigo == req.ClienteId || c.Id.ToString() == req.ClienteId);

        if (cliente == null)
        {
            return NotFound(new { message = $"Cliente '{req.ClienteId}' no encontrado" });
        }

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == (req.EmpleadoId ?? "").ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo)
            ?? new Usuario { Id = 1, Nombre = "Miguel", Rol = "Administrador" };

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var abono = new AbonoCobranza
            {
                ClienteId = cliente.Id,
                UsuarioId = usuario.Id,
                Monto = req.Monto,
                MetodoPago = string.IsNullOrWhiteSpace(req.MetodoPago) ? "Efectivo" : req.MetodoPago,
                Comentario = req.Comentario,
                FechaHora = DateTime.Now
            };

            _db.AbonosCobranza.Add(abono);

            // Reducir saldo del cliente
            cliente.Saldo -= req.Monto;
            if (cliente.Saldo < 0) cliente.Saldo = 0;

            cliente.UltimoPago = $"{DateTime.Now:dd MMM yyyy} (${req.Monto:N2})";

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            var resp = new AbonoRegistradoResponseDto
            {
                Id = abono.Id,
                ClienteId = cliente.Codigo,
                MontoAbonado = req.Monto,
                NuevoSaldo = cliente.Saldo,
                FechaHora = abono.FechaHora,
                Mensaje = "Abono registrado con éxito"
            };

            return StatusCode(201, resp);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al registrar el abono", detalle = ex.Message });
        }
    }
}
