using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/cortes")]
public class CortesController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public CortesController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet("diario")]
    public async Task<IActionResult> GetCortesDiario([FromQuery] string? fecha)
    {
        var targetDate = DateTime.Today;
        if (!string.IsNullOrWhiteSpace(fecha) && DateTime.TryParse(fecha, out var parsedDate))
        {
            targetDate = parsedDate.Date;
        }

        var nextDay = targetDate.AddDays(1);

        // Obtener vendedores
        var usuarios = await _db.Usuarios.Where(u => u.Activo).ToListAsync();

        var list = new List<CorteTrabajadorDto>();

        foreach (var u in usuarios)
        {
            // Ventas del usuario en la fecha
            var ventasUsuario = await _db.Ventas
                .Where(v => v.UsuarioId == u.Id && v.FechaHora >= targetDate && v.FechaHora < nextDay)
                .ToListAsync();

            var ventaIds = ventasUsuario.Select(v => v.Id).ToList();

            var pagosUsuario = await _db.Pagos
                .Where(p => ventaIds.Contains(p.VentaId))
                .ToListAsync();

            var efectivo = pagosUsuario.Where(p => p.Metodo == "Efectivo").Sum(p => p.Monto);
            var transferencias = pagosUsuario.Where(p => p.Metodo == "Transferencia").Sum(p => p.Monto);
            var tarjetas = pagosUsuario.Where(p => p.Metodo == "Tarjeta").Sum(p => p.Monto);
            var credito = pagosUsuario.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto);

            var abonos = await _db.AbonosCobranza
                .Where(a => a.UsuarioId == u.Id && a.FechaHora >= targetDate && a.FechaHora < nextDay)
                .SumAsync(a => (decimal?)a.Monto) ?? 0m;

            var gastos = await _db.GastosOperativos
                .Where(g => g.UsuarioId == u.Id && g.FechaHora >= targetDate && g.FechaHora < nextDay)
                .SumAsync(g => (decimal?)g.Importe) ?? 0m;

            var piezasVendidas = await _db.VentaDetalles
                .Where(d => ventaIds.Contains(d.VentaId))
                .SumAsync(d => (int?)d.PiezasTotales) ?? 0;

            var efectivoEsperado = (efectivo + abonos) - gastos;

            // Revisar si existe corte registrado guardado
            var dateOnly = DateOnly.FromDateTime(targetDate);
            var corteRegistrado = await _db.CortesCaja
                .FirstOrDefaultAsync(c => c.UsuarioId == u.Id && c.FechaJornada == dateOnly);

            var totalVentas = ventasUsuario.Sum(v => v.Total);

            // Si no tiene ventas hoy y hay corte guardado, usar corte guardado
            if (corteRegistrado != null && totalVentas == 0)
            {
                list.Add(new CorteTrabajadorDto
                {
                    EmpleadoId = u.Id.ToString(),
                    Nombre = u.Nombre,
                    Ruta = corteRegistrado.Ruta,
                    VentasTotales = corteRegistrado.VentasTotales,
                    Efectivo = corteRegistrado.Efectivo,
                    Transferencias = corteRegistrado.Transferencias,
                    Tarjetas = corteRegistrado.Tarjetas,
                    Credito = corteRegistrado.Credito,
                    AbonosCobranza = corteRegistrado.CobranzaAbonos,
                    Gastos = corteRegistrado.Gastos,
                    Devoluciones = corteRegistrado.Devoluciones,
                    EfectivoEsperado = corteRegistrado.EfectivoEsperado,
                    DiferenciaCaja = corteRegistrado.DiferenciaCaja,
                    InventarioInicialPiezas = corteRegistrado.InventarioInicialPiezas,
                    InventarioActualPiezas = corteRegistrado.InventarioActualPiezas,
                    PiezasVendidas = corteRegistrado.PiezasVendidas
                });
            }
            else
            {
                list.Add(new CorteTrabajadorDto
                {
                    EmpleadoId = u.Id.ToString(),
                    Nombre = u.Nombre,
                    Ruta = u.RutaAsignada ?? "Ruta General",
                    VentasTotales = totalVentas,
                    Efectivo = efectivo,
                    Transferencias = transferencias,
                    Tarjetas = tarjetas,
                    Credito = credito,
                    AbonosCobranza = abonos,
                    Gastos = gastos,
                    Devoluciones = 0,
                    EfectivoEsperado = efectivoEsperado,
                    DiferenciaCaja = 0,
                    InventarioInicialPiezas = 450,
                    InventarioActualPiezas = 450 - piezasVendidas,
                    PiezasVendidas = piezasVendidas
                });
            }
        }

        return Ok(list);
    }

    [HttpPost("cerrar")]
    public async Task<IActionResult> CerrarCorte([FromBody] CerrarCorteCajaRequestDto req)
    {
        var targetDate = DateTime.Today;
        var nextDay = targetDate.AddDays(1);

        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo)
            ?? new Data.Entities.Usuario { Id = 1, Nombre = "Miguel" };

        var ventas = await _db.Ventas
            .Where(v => v.UsuarioId == usuario.Id && v.FechaHora >= targetDate && v.FechaHora < nextDay)
            .ToListAsync();

        var ventaIds = ventas.Select(v => v.Id).ToList();

        var pagos = await _db.Pagos
            .Where(p => ventaIds.Contains(p.VentaId))
            .ToListAsync();

        var efectivo = pagos.Where(p => p.Metodo == "Efectivo").Sum(p => p.Monto);
        var transferencias = pagos.Where(p => p.Metodo == "Transferencia").Sum(p => p.Monto);
        var tarjetas = pagos.Where(p => p.Metodo == "Tarjeta").Sum(p => p.Monto);
        var credito = pagos.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto);

        var abonos = await _db.AbonosCobranza
            .Where(a => a.UsuarioId == usuario.Id && a.FechaHora >= targetDate && a.FechaHora < nextDay)
            .SumAsync(a => (decimal?)a.Monto) ?? 0m;

        var gastos = await _db.GastosOperativos
            .Where(g => g.UsuarioId == usuario.Id && g.FechaHora >= targetDate && g.FechaHora < nextDay)
            .SumAsync(g => (decimal?)g.Importe) ?? 0m;

        var devoluciones = await _db.Devoluciones
            .Where(d => d.UsuarioId == usuario.Id && d.FechaHora >= targetDate && d.FechaHora < nextDay)
            .SumAsync(d => (decimal?)d.Total) ?? 0m;

        var piezasVendidas = await _db.VentaDetalles
            .Where(d => ventaIds.Contains(d.VentaId))
            .SumAsync(d => (int?)d.PiezasTotales) ?? 0;

        var efectivoEsperado = (efectivo + abonos) - gastos;
        var diferenciaCaja = req.EfectivoContado - efectivoEsperado;

        var dateOnly = DateOnly.FromDateTime(targetDate);
        var corte = await _db.CortesCaja
            .FirstOrDefaultAsync(c => c.UsuarioId == usuario.Id && c.FechaJornada == dateOnly);

        if (corte == null)
        {
            corte = new Data.Entities.CorteCaja
            {
                UsuarioId = usuario.Id,
                FechaJornada = dateOnly,
                Ruta = usuario.RutaAsignada ?? "Ruta Centro",
                VentasTotales = ventas.Sum(v => v.Total),
                Efectivo = efectivo,
                Transferencias = transferencias,
                Tarjetas = tarjetas,
                Credito = credito,
                CobranzaAbonos = abonos,
                Gastos = gastos,
                Devoluciones = devoluciones,
                EfectivoEsperado = efectivoEsperado,
                EfectivoContado = req.EfectivoContado,
                DiferenciaCaja = diferenciaCaja,
                InventarioInicialPiezas = 450,
                InventarioActualPiezas = 450 - piezasVendidas,
                PiezasVendidas = piezasVendidas,
                Estado = "Cerrado"
            };
            _db.CortesCaja.Add(corte);
        }
        else
        {
            corte.VentasTotales = ventas.Sum(v => v.Total);
            corte.Efectivo = efectivo;
            corte.Transferencias = transferencias;
            corte.Tarjetas = tarjetas;
            corte.Credito = credito;
            corte.CobranzaAbonos = abonos;
            corte.Gastos = gastos;
            corte.Devoluciones = devoluciones;
            corte.EfectivoEsperado = efectivoEsperado;
            corte.EfectivoContado = req.EfectivoContado;
            corte.DiferenciaCaja = diferenciaCaja;
            corte.PiezasVendidas = piezasVendidas;
            corte.InventarioActualPiezas = corte.InventarioInicialPiezas - piezasVendidas;
            corte.Estado = "Cerrado";
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Corte de caja cerrado con éxito y persistido en base de datos",
            empleadoId = usuario.Id,
            empleadoNombre = usuario.Nombre,
            fechaJornada = dateOnly.ToString("yyyy-MM-dd"),
            efectivoEsperado,
            efectivoContado = req.EfectivoContado,
            diferenciaCaja,
            estado = "Cerrado"
        });
    }
}

