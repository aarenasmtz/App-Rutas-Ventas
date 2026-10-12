using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/clientes")]
public class ClientesController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public ClientesController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? filtro, [FromQuery] string? search)
    {
        var query = _db.Clientes.Where(c => c.Activo);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Nombre.ToLower().Contains(s) ||
                                     c.Propietario.ToLower().Contains(s) ||
                                     c.Codigo.ToLower().Contains(s) ||
                                     c.Direccion.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(filtro) && filtro != "Todos")
        {
            switch (filtro.ToLower())
            {
                case "pendientes de cobro":
                case "con crédito":
                case "con credito":
                    query = query.Where(c => c.Saldo > 0);
                    break;
                case "hoy":
                    // Clientes asignados a hoy
                    query = query.Where(c => c.DiasVisitaJson.Contains("Mié") || c.DiasVisitaJson.Contains("Lun"));
                    break;
                case "cercanos":
                    query = query.Where(c => c.DistanciaMock != null);
                    break;
            }
        }

        var clientes = await query.OrderBy(c => c.Id).ToListAsync();

        var result = clientes.Select(c =>
        {
            List<string> dias = new();
            try
            {
                dias = JsonSerializer.Deserialize<List<string>>(c.DiasVisitaJson) ?? new();
            }
            catch { dias = new List<string> { "Lun", "Mié", "Vie" }; }

            Dictionary<string, decimal>? preciosEspeciales = null;
            if (!string.IsNullOrWhiteSpace(c.PreciosEspecialesJson))
            {
                try
                {
                    preciosEspeciales = JsonSerializer.Deserialize<Dictionary<string, decimal>>(c.PreciosEspecialesJson);
                }
                catch { }
            }

            return new ClienteDetalleDto
            {
                Id = c.Codigo,
                Nombre = c.Nombre,
                Propietario = c.Propietario,
                Direccion = c.Direccion,
                Telefono = c.Telefono ?? "",
                Ruta = c.Ruta,
                DiasVisita = dias,
                Saldo = c.Saldo,
                LimiteCredito = c.LimiteCredito,
                EstadoVisita = c.EstadoVisita,
                DistanciaMock = c.DistanciaMock,
                UltimaCompra = c.UltimaCompra,
                UltimoPago = c.UltimoPago,
                Latitud = c.Latitud,
                Longitud = c.Longitud,
                Colonia = c.Colonia,
                Ciudad = c.Ciudad,
                PreciosEspeciales = preciosEspeciales
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var c = await _db.Clientes.FirstOrDefaultAsync(c => c.Codigo == id || c.Id.ToString() == id);
        if (c == null) return NotFound(new { message = "Cliente no encontrado" });

        List<string> dias = new();
        try
        {
            dias = JsonSerializer.Deserialize<List<string>>(c.DiasVisitaJson) ?? new();
        }
        catch { dias = new List<string> { "Lun", "Mié", "Vie" }; }

        Dictionary<string, decimal>? preciosEspeciales = null;
        if (!string.IsNullOrWhiteSpace(c.PreciosEspecialesJson))
        {
            try
            {
                preciosEspeciales = JsonSerializer.Deserialize<Dictionary<string, decimal>>(c.PreciosEspecialesJson);
            }
            catch { }
        }

        var dto = new ClienteDetalleDto
        {
            Id = c.Codigo,
            Nombre = c.Nombre,
            Propietario = c.Propietario,
            Direccion = c.Direccion,
            Telefono = c.Telefono ?? "",
            Ruta = c.Ruta,
            DiasVisita = dias,
            Saldo = c.Saldo,
            LimiteCredito = c.LimiteCredito,
            EstadoVisita = c.EstadoVisita,
            DistanciaMock = c.DistanciaMock,
            UltimaCompra = c.UltimaCompra,
            UltimoPago = c.UltimoPago,
            Latitud = c.Latitud,
            Longitud = c.Longitud,
            Colonia = c.Colonia,
            Ciudad = c.Ciudad,
            PreciosEspeciales = preciosEspeciales
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GuardarClienteRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest(new { message = "El nombre del cliente es obligatorio" });

        var total = await _db.Clientes.CountAsync();
        var codigo = !string.IsNullOrWhiteSpace(req.Codigo) 
            ? req.Codigo 
            : $"c{total + 1}";

        var cliente = new Data.Entities.Cliente
        {
            Codigo = codigo,
            Nombre = req.Nombre.Trim(),
            Propietario = req.Propietario.Trim(),
            Direccion = req.Direccion.Trim(),
            Colonia = req.Colonia?.Trim(),
            Ciudad = string.IsNullOrWhiteSpace(req.Ciudad) ? "León, Gto" : req.Ciudad.Trim(),
            Latitud = req.Latitud,
            Longitud = req.Longitud,
            Telefono = req.Telefono?.Trim(),
            Ruta = string.IsNullOrWhiteSpace(req.Ruta) ? "Ruta Centro" : req.Ruta,
            Saldo = req.Saldo,
            LimiteCredito = req.LimiteCredito > 0 ? req.LimiteCredito : 5000,
            EstadoVisita = "Pendiente",
            DistanciaMock = req.DistanciaMock ?? "500m",
            DiasVisitaJson = JsonSerializer.Serialize(req.DiasVisita ?? new List<string> { "Lun", "Mié", "Vie" }),
            PreciosEspecialesJson = req.PreciosEspeciales != null ? JsonSerializer.Serialize(req.PreciosEspeciales) : null,
            Activo = true,
            FechaCreacion = DateTime.Now
        };

        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();

        return StatusCode(201, new ClienteDetalleDto
        {
            Id = cliente.Codigo,
            Nombre = cliente.Nombre,
            Propietario = cliente.Propietario,
            Direccion = cliente.Direccion,
            Telefono = cliente.Telefono ?? "",
            Ruta = cliente.Ruta,
            DiasVisita = req.DiasVisita ?? new List<string> { "Lun", "Mié", "Vie" },
            Saldo = cliente.Saldo,
            LimiteCredito = cliente.LimiteCredito,
            EstadoVisita = cliente.EstadoVisita,
            DistanciaMock = cliente.DistanciaMock,
            PreciosEspeciales = req.PreciosEspeciales
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] GuardarClienteRequestDto req)
    {
        var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Codigo == id || c.Id.ToString() == id);
        if (cliente == null) return NotFound(new { message = "Cliente no encontrado" });

        if (!string.IsNullOrWhiteSpace(req.Nombre)) cliente.Nombre = req.Nombre.Trim();
        if (!string.IsNullOrWhiteSpace(req.Propietario)) cliente.Propietario = req.Propietario.Trim();
        if (!string.IsNullOrWhiteSpace(req.Direccion)) cliente.Direccion = req.Direccion.Trim();
        if (req.Colonia != null) cliente.Colonia = req.Colonia.Trim();
        if (req.Ciudad != null) cliente.Ciudad = req.Ciudad.Trim();
        if (req.Latitud.HasValue) cliente.Latitud = req.Latitud.Value;
        if (req.Longitud.HasValue) cliente.Longitud = req.Longitud.Value;
        if (req.Telefono != null) cliente.Telefono = req.Telefono.Trim();
        if (!string.IsNullOrWhiteSpace(req.Ruta)) cliente.Ruta = req.Ruta;
        if (req.DiasVisita != null && req.DiasVisita.Any())
            cliente.DiasVisitaJson = JsonSerializer.Serialize(req.DiasVisita);
        if (req.LimiteCredito > 0) cliente.LimiteCredito = req.LimiteCredito;
        cliente.Saldo = req.Saldo;
        if (req.PreciosEspeciales != null)
            cliente.PreciosEspecialesJson = JsonSerializer.Serialize(req.PreciosEspeciales);

        await _db.SaveChangesAsync();

        return Ok(new { message = "Cliente actualizado correctamente", id = cliente.Codigo });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Codigo == id || c.Id.ToString() == id);
        if (cliente == null) return NotFound(new { message = "Cliente no encontrado" });

        cliente.Activo = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Cliente '{cliente.Nombre}' dado de baja correctamente", id = cliente.Codigo });
    }
}
