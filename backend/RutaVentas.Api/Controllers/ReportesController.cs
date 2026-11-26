using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/reportes")]
public class ReportesController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public ReportesController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen([FromQuery] string periodo = "Semana", [FromQuery] string? rutaId = null)
    {
        var now = DateTime.Now;
        DateTime fechaInicio;
        DateTime fechaFin = now;

        switch (periodo.ToLower())
        {
            case "dia":
            case "día":
            case "hoy":
                fechaInicio = now.Date;
                break;
            case "mes":
                fechaInicio = new DateTime(now.Year, now.Month, 1);
                break;
            case "semana":
            default:
                int diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
                fechaInicio = now.Date.AddDays(-1 * diff);
                break;
        }

        // 1. Consultar ventas en el periodo incluyendo Pagos y Detalles
        var ventasQuery = _db.Ventas
            .Include(v => v.Pagos)
            .Include(v => v.Detalles)
            .ThenInclude(d => d.Producto)
            .Where(v => v.FechaHora >= fechaInicio && v.FechaHora <= fechaFin);

        var ventasList = await ventasQuery.ToListAsync();

        decimal totalVentas = ventasList.Sum(v => v.Total);
        int totalPedidos = ventasList.Count;
        decimal ticketPromedio = totalPedidos > 0 ? Math.Round(totalVentas / totalPedidos, 2) : 0;

        // Métodos de pago a través de la relación Pagos
        var todosLosPagos = ventasList.SelectMany(v => v.Pagos).ToList();
        decimal efectivo = todosLosPagos.Where(p => p.Metodo == "Efectivo").Sum(p => p.Monto);
        decimal transferencia = todosLosPagos.Where(p => p.Metodo == "Transferencia" || p.Metodo == "SPEI").Sum(p => p.Monto);
        decimal tarjeta = todosLosPagos.Where(p => p.Metodo == "Tarjeta").Sum(p => p.Monto);
        decimal credito = todosLosPagos.Where(p => p.Metodo == "Crédito" || p.Metodo == "Credito").Sum(p => p.Monto);

        // 2. Cobranza en el periodo
        var cobranzaQuery = _db.AbonosCobranza
            .Where(a => a.FechaHora >= fechaInicio && a.FechaHora <= fechaFin);
        decimal totalCobranza = await cobranzaQuery.SumAsync(a => a.Monto);

        // 3. Gastos operativos en el periodo
        var gastosQuery = _db.GastosOperativos
            .Where(g => g.FechaHora >= fechaInicio && g.FechaHora <= fechaFin);
        decimal totalGastos = await gastosQuery.SumAsync(g => g.Importe);

        // 4. Clientes visitados y ruta
        int clientesTotal = await _db.Clientes.CountAsync(c => c.Activo);
        var clientesVisitadosIds = ventasList.Select(v => v.ClienteId).Distinct().Count();
        decimal efectividad = clientesTotal > 0 
            ? Math.Round(((decimal)clientesVisitadosIds / clientesTotal) * 100, 1) 
            : 0;

        // 5. Utilidad estimada (35% margen comercial estándar de distribución láctea y carnes frías)
        decimal utilidadEstimada = Math.Round((totalVentas * 0.35m) - totalGastos, 2);

        // 6. Top productos vendidos
        var topProductos = ventasList
            .SelectMany(v => v.Detalles)
            .GroupBy(d => new { d.ProductoId, Nombre = d.Producto != null ? d.Producto.Nombre : "Producto", Presentacion = d.PresentacionNombre ?? d.PresentacionTipo, Unidad = d.Producto != null ? d.Producto.Unidad : "" })
            .Select(g => new TopProductoReporteDto
            {
                ProductoId = g.Key.ProductoId.ToString(),
                Nombre = g.Key.Nombre,
                CantidadVendida = g.Sum(x => x.PiezasTotales),
                CantidadPresentaciones = g.Sum(x => x.CantidadPresentaciones),
                Presentacion = g.Key.Presentacion,
                Unidad = g.Key.Unidad,
                ImporteTotal = g.Sum(x => x.Subtotal)
            })
            .OrderByDescending(x => x.ImporteTotal)
            .Take(5)
            .ToList();

        var response = new ReporteResumenDto
        {
            Periodo = periodo,
            FechaInicio = fechaInicio,
            FechaFin = fechaFin,
            VentasTotales = totalVentas,
            CobranzaTotal = totalCobranza,
            CreditoColocado = credito,
            GastosTotal = totalGastos,
            UtilidadEstimada = utilidadEstimada,
            TicketPromedio = ticketPromedio,
            PedidosTotal = totalPedidos,
            ClientesVisitados = clientesVisitadosIds,
            ClientesTotalRuta = clientesTotal,
            EfectividadVisitas = efectividad,
            TopProductos = topProductos,
            MetodosPago = new MetodosPagoReporteDto
            {
                Efectivo = efectivo,
                Transferencia = transferencia,
                Tarjeta = tarjeta,
                Credito = credito
            }
        };

        return Ok(response);
    }

    private static string Csv(string value) => "\"" + value.Replace("\"", "\"\"") + "\"";

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] string periodo = "Semana")
    {
        var now = DateTime.Now;
        DateTime fechaInicio = periodo.ToLower() switch
        {
            "dia" or "día" or "hoy" => now.Date,
            "mes" => new DateTime(now.Year, now.Month, 1),
            _ => now.Date.AddDays(-((7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7))
        };

        var ventas = await _db.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Pagos)
            .Where(v => v.FechaHora >= fechaInicio && v.FechaHora <= now)
            .OrderByDescending(v => v.FechaHora)
            .ToListAsync();

        var sb = new StringBuilder();
        // Encabezados con formato CSV en español (separador semicolon compatible con Excel en español)
        sb.AppendLine("Folio;Fecha;Hora;Cliente;Vendedor;MetodoPago;Subtotal;Impuestos;Total;SaldoCliente");

        foreach (var v in ventas)
        {
            var clienteNombre = Csv(v.Cliente?.Nombre ?? "");
            var vendedorNombre = Csv(v.Usuario?.Nombre ?? "");
            var fecha = v.FechaHora.ToString("dd/MM/yyyy");
            var hora = v.FechaHora.ToString("HH:mm:ss");
            var metodo = Csv(string.Join(" / ", v.Pagos.Select(p => p.Metodo)));
            var saldo = v.Cliente?.Saldo ?? 0m;

            sb.AppendLine($"{Csv(v.Folio)};{fecha};{hora};{clienteNombre};{vendedorNombre};{metodo};{v.Subtotal:F2};0.00;{v.Total:F2};{saldo:F2}");
        }

        // Prefijar UTF-8 BOM para que Excel abra acentos y ñ sin problemas
        byte[] bom = Encoding.UTF8.GetPreamble();
        byte[] contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        byte[] fullBytes = new byte[bom.Length + contentBytes.Length];
        Buffer.BlockCopy(bom, 0, fullBytes, 0, bom.Length);
        Buffer.BlockCopy(contentBytes, 0, fullBytes, bom.Length, contentBytes.Length);

        var fileName = $"Reporte_Ventas_{periodo}_{fechaInicio:yyyyMMdd}_{now:yyyyMMdd}.csv";
        return File(fullBytes, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("export/clientes/csv")]
    public async Task<IActionResult> ExportClientesCsv()
    {
        var clientes = await _db.Clientes
            .Where(c => c.Activo)
            .OrderByDescending(c => c.Saldo)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Codigo;NombreNegocio;Propietario;Direccion;Telefono;Ruta;SaldoPendiente;LimiteCredito;EstadoVisita;UltimaCompra;UltimoPago");

        foreach (var c in clientes)
        {
            var nombre = c.Nombre.Replace(";", " ");
            var prop = c.Propietario.Replace(";", " ");
            var dir = c.Direccion.Replace(";", " ");
            var tel = (c.Telefono ?? "").Replace(";", " ");
            var ruta = c.Ruta.Replace(";", " ");

            sb.AppendLine($"{c.Codigo};{nombre};{prop};{dir};{tel};{ruta};{c.Saldo:F2};{c.LimiteCredito:F2};{c.EstadoVisita};{c.UltimaCompra ?? "N/A"};{c.UltimoPago ?? "N/A"}");
        }

        byte[] bom = Encoding.UTF8.GetPreamble();
        byte[] contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        byte[] fullBytes = new byte[bom.Length + contentBytes.Length];
        Buffer.BlockCopy(bom, 0, fullBytes, 0, bom.Length);
        Buffer.BlockCopy(contentBytes, 0, fullBytes, bom.Length, contentBytes.Length);

        var fileName = $"Cartera_Clientes_Saldos_{DateTime.Now:yyyyMMdd_HHmm}.csv";
        return File(fullBytes, "text/csv; charset=utf-8", fileName);
    }

    [HttpGet("export/inventario/csv")]
    public async Task<IActionResult> ExportInventarioCsv()
    {
        var productos = await _db.Productos
            .Where(p => p.Activo)
            .OrderBy(p => p.Categoria)
            .ThenBy(p => p.Nombre)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Codigo;NombreProducto;Marca;Categoria;Unidad;ExistenciaPiezas;PrecioLista;PrecioCompra;ValorInventario;CodigoBarras");

        foreach (var p in productos)
        {
            var nombre = p.Nombre.Replace(";", " ");
            var marca = (p.Marca ?? "Genérica").Replace(";", " ");
            var cat = p.Categoria.Replace(";", " ");
            var valor = p.Existencia * p.PrecioCompra;

            sb.AppendLine($"{p.Codigo};{nombre};{marca};{cat};{p.Unidad};{p.Existencia};{p.PrecioBase:F2};{p.PrecioCompra:F2};{valor:F2};{p.CodigoBarras ?? ""}");
        }

        byte[] bom = Encoding.UTF8.GetPreamble();
        byte[] contentBytes = Encoding.UTF8.GetBytes(sb.ToString());
        byte[] fullBytes = new byte[bom.Length + contentBytes.Length];
        Buffer.BlockCopy(bom, 0, fullBytes, 0, bom.Length);
        Buffer.BlockCopy(contentBytes, 0, fullBytes, bom.Length, contentBytes.Length);

        var fileName = $"Inventario_Existencias_{DateTime.Now:yyyyMMdd_HHmm}.csv";
        return File(fullBytes, "text/csv; charset=utf-8", fileName);
    }
}
