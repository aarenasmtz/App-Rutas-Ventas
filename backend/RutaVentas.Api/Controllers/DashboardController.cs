using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public DashboardController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen([FromQuery] string? rutaId)
    {
        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);

        // Ventas de hoy
        var ventasHoyQuery = _db.Ventas
            .Where(v => v.FechaHora >= today && v.FechaHora < tomorrow);

        var ventasHoy = await ventasHoyQuery.SumAsync(v => (decimal?)v.Total) ?? 0m;

        // Pagos de hoy por método
        var pagosHoy = await _db.Pagos
            .Where(p => p.FechaHora >= today && p.FechaHora < tomorrow)
            .ToListAsync();

        var efectivoPagos = pagosHoy.Where(p => p.Metodo == "Efectivo").Sum(p => p.Monto);
        var transferencias = pagosHoy.Where(p => p.Metodo == "Transferencia").Sum(p => p.Monto);
        var tarjetas = pagosHoy.Where(p => p.Metodo == "Tarjeta").Sum(p => p.Monto);
        var creditoColocado = pagosHoy.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto);

        // Abonos de hoy
        var abonosHoy = await _db.AbonosCobranza
            .Where(a => a.FechaHora >= today && a.FechaHora < tomorrow)
            .ToListAsync();

        var totalAbonos = abonosHoy.Sum(a => a.Monto);
        var abonosEfectivo = abonosHoy.Where(a => a.MetodoPago == "Efectivo").Sum(a => a.Monto);

        // Gastos operativos de hoy
        var gastosHoy = await _db.GastosOperativos
            .Where(g => g.FechaHora >= today && g.FechaHora < tomorrow && g.MetodoPago == "Efectivo")
            .SumAsync(g => (decimal?)g.Importe) ?? 0m;

        var efectivoEnCaja = (efectivoPagos + abonosEfectivo) - gastosHoy;
        if (efectivoEnCaja < 0) efectivoEnCaja = 0;

        // Clientes
        var clientesTotal = await _db.Clientes.CountAsync(c => c.Activo);
        var clientesVisitados = await _db.Clientes.CountAsync(c => c.Activo && c.EstadoVisita == "Visitado");

        // Piezas vendidas hoy
        var piezasVendidas = await _db.VentaDetalles
            .Where(d => d.Venta != null && d.Venta.FechaHora >= today && d.Venta.FechaHora < tomorrow)
            .SumAsync(d => (int?)d.PiezasTotales) ?? 0;

        // Cliente cercano de muestra
        var proximo = await _db.Clientes
            .Where(c => c.Activo && c.EstadoVisita == "Pendiente")
            .OrderBy(c => c.Id)
            .Select(c => new ClienteProximoDto
            {
                Id = c.Codigo,
                Nombre = c.Nombre,
                Propietario = c.Propietario,
                Saldo = c.Saldo,
                DistanciaMetros = 120
            })
            .FirstOrDefaultAsync();

        var resumen = new DashboardResumenDto
        {
            VentasHoy = ventasHoy,
            CobranzaHoy = totalAbonos + efectivoPagos + transferencias + tarjetas,
            CreditoColocadoHoy = creditoColocado,
            EfectivoEnCaja = efectivoEnCaja,
            ClientesVisitados = clientesVisitados,
            ClientesTotalRuta = clientesTotal,
            TotalPiezasVendidas = piezasVendidas,
            ClienteCercano = proximo
        };

        return Ok(resumen);
    }
}
