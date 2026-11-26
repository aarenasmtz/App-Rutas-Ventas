using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/ventas")]
public class VentasController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public VentasController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int limit = 50)
    {
        var ventas = await _db.Ventas
            .Include(v => v.Cliente)
            .Include(v => v.Usuario)
            .Include(v => v.Detalles)
            .Include(v => v.Pagos)
            .OrderByDescending(v => v.FechaHora)
            .Take(limit)
            .ToListAsync();

        return Ok(ventas);
    }

    [HttpPost]
    public async Task<IActionResult> RegistrarVenta([FromBody] RegistrarVentaRequestDto req)
    {
        if (req.Items == null || !req.Items.Any())
        {
            return BadRequest(new { message = "La venta debe incluir al menos un producto" });
        }

        // 1. Idempotencia: Verificar si esta operación ya fue procesada previamente
        var idempotencyKey = Request.Headers["X-Idempotency-Key"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(idempotencyKey))
        {
            var existingSale = await _db.Ventas
                .Include(v => v.Cliente)
                .Include(v => v.Pagos)
                .FirstOrDefaultAsync(v => v.Folio == idempotencyKey);

            if (existingSale != null)
            {
                return Ok(new VentaRegistradaResponseDto
                {
                    Folio = existingSale.Folio,
                    FechaHora = existingSale.FechaHora,
                    TotalVenta = existingSale.Total,
                    TotalPagado = existingSale.Pagos.Sum(p => p.Monto),
                    CreditoOtorgado = existingSale.Pagos.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto),
                    NuevoSaldoCliente = existingSale.Cliente?.Saldo ?? 0m,
                    Estado = existingSale.Estado
                });
            }
        }

        // Buscar cliente por Id o Código de manera flexible
        string cleanCId = (req.ClienteId ?? "").Trim().ToLower();
        string numOnlyCId = cleanCId.StartsWith("c") ? cleanCId.Substring(1) : cleanCId;
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c =>
                c.Codigo.ToLower() == cleanCId ||
                c.Id.ToString() == cleanCId ||
                c.Id.ToString() == numOnlyCId ||
                c.Nombre.ToLower() == cleanCId);

        if (cliente == null)
        {
            cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Activo) ?? await _db.Clientes.FirstOrDefaultAsync();
        }

        if (cliente == null)
        {
            return NotFound(new { message = $"Cliente '{req.ClienteId}' no encontrado" });
        }

        // Buscar vendedor/usuario
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower());

        if (usuario == null)
        {
            // Default al primer usuario activo
            usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo) 
                      ?? new Usuario { Id = 1, Nombre = "Miguel", Rol = "Administrador" };
        }

        // Validar pagos y montos
        var totalPagos = req.Pagos?.Sum(p => p.Monto) ?? 0m;
        var creditoOtorgado = req.Pagos?.Where(p => p.Metodo == "Crédito").Sum(p => p.Monto) ?? 0m;
        var totalPagadoDirecto = totalPagos - creditoOtorgado;

                if (creditoOtorgado > 0)
        {
            decimal excedente = (cliente.Saldo + creditoOtorgado) - cliente.LimiteCredito;
            if (excedente > 0)
            {
                bool autorizacionValida = false;
                SolicitudSobregiro? solicitudAprobada = null;

                if (!string.IsNullOrWhiteSpace(req.TokenAutorizacionSobregiro))
                {
                    solicitudAprobada = await _db.SolicitudesSobregiro
                        .FirstOrDefaultAsync(s => s.TokenAutorizacion == req.TokenAutorizacionSobregiro &&
                                                  s.ClienteId == cliente.Id &&
                                                  s.Estado == "Autorizada");

                    if (solicitudAprobada != null)
                    {
                        autorizacionValida = true;
                        solicitudAprobada.Estado = "Utilizada";
                        solicitudAprobada.FechaResolucion = DateTime.Now;
                    }
                }

                if (!autorizacionValida)
                {
                    return StatusCode(422, new
                    {
                        message = $"El crédito solicitado (${creditoOtorgado:N2}) excede el límite disponible del cliente. Saldo actual: ${cliente.Saldo:N2}, Límite: ${cliente.LimiteCredito:N2}, Excedente: ${excedente:N2}",
                        requiereAutorizacion = true,
                        clienteId = cliente.Id,
                        clienteNombre = cliente.Nombre,
                        saldoActual = cliente.Saldo,
                        limiteCredito = cliente.LimiteCredito,
                        montoSolicitado = creditoOtorgado,
                        excedente = excedente
                    });
                }
            }
        }

        // Cargar productos y validar existencias de forma transaccional antes de proceder
        var productosDict = new Dictionary<int, Producto>();
        var itemsResueltos = new List<(LineaVentaRequestDto item, Producto prod, int factor, decimal unidadesBase, string presNombre)>();
        var requerimientosPorProducto = new Dictionary<int, decimal>();

        foreach (var item in req.Items)
        {
            string cleanPId = (item.ProductoId ?? "").Trim().ToLower();
            string numOnlyPId = cleanPId.StartsWith("p") ? cleanPId.Substring(1) : cleanPId;
            var producto = await _db.Productos
                .Include(p => p.Presentaciones)
                .FirstOrDefaultAsync(p =>
                    p.Codigo.ToLower() == cleanPId ||
                    p.Id.ToString() == cleanPId ||
                    p.Id.ToString() == numOnlyPId ||
                    (p.Sku != null && p.Sku.ToLower() == cleanPId) ||
                    p.Nombre.ToLower().Contains(cleanPId));

            if (producto == null)
            {
                return NotFound(new { message = $"Producto '{item.ProductoId}' no encontrado en catálogo" });
            }

            productosDict[producto.Id] = producto;

            // Resolver presentación y factor de conversión del servidor
            var pres = producto.Presentaciones?.FirstOrDefault(pr =>
                pr.Tipo.Equals(item.PresentacionTipo, StringComparison.OrdinalIgnoreCase) ||
                pr.Nombre.Equals(item.PresentacionTipo, StringComparison.OrdinalIgnoreCase));

            int factor = pres?.PiezasEquivalentes ?? (item.FactorConversion > 0 ? item.FactorConversion : 1);
            string presNombre = pres?.Nombre ?? item.PresentacionNombre ?? item.PresentacionTipo;
            decimal unidadesBase = item.CantidadPresentaciones * factor;

            itemsResueltos.Add((item, producto, factor, unidadesBase, presNombre));

            if (!requerimientosPorProducto.ContainsKey(producto.Id))
                requerimientosPorProducto[producto.Id] = 0m;
            requerimientosPorProducto[producto.Id] += unidadesBase;
        }

        // Validación estricta de inventario: No permitir vender más de lo disponible
        foreach (var (prodId, totalReq) in requerimientosPorProducto)
        {
            var prod = productosDict[prodId];
            if (totalReq > prod.Existencia)
            {
                return StatusCode(422, new
                {
                    message = $"Inventario insuficiente para '{prod.Nombre}'. Solicitado: {totalReq} {prod.Unidad}(s), Disponible: {prod.Existencia} {prod.Unidad}(s)."
                });
            }
        }

        // Iniciar transacción de base de datos
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var countToday = await _db.Ventas.CountAsync(v => v.FechaHora.Date == DateTime.Today);
            var folio = (!string.IsNullOrWhiteSpace(idempotencyKey) && idempotencyKey.Length <= 50)
                ? idempotencyKey
                : $"FOL-{DateTime.Now:yyyyMMdd}-{(countToday + 1):D3}";

            var venta = new Venta
            {
                Folio = folio,
                ClienteId = cliente.Id,
                UsuarioId = usuario.Id,
                Total = req.Total,
                Subtotal = req.Total,
                DescuentoTotal = 0,
                Estado = "Completada",
                FechaHora = DateTime.Now
            };

            _db.Ventas.Add(venta);
            await _db.SaveChangesAsync();

            // Procesar líneas de venta y descontar stock por unidades base
            foreach (var (item, producto, factor, unidadesBase, presNombre) in itemsResueltos)
            {
                // Descontar inventario unificado en unidad base
                producto.Existencia -= unidadesBase;

                // Registrar movimiento de auditoría/kardex
                _db.InventarioMovimientos.Add(new InventarioMovimiento
                {
                    ProductoId = producto.Id,
                    TipoMovimiento = "Venta",
                    Ubicacion = usuario.RutaAsignada ?? "Camioneta 1",
                    Piezas = -unidadesBase,
                    Motivo = $"Venta Folio {folio} ({item.CantidadPresentaciones} {presNombre} = {unidadesBase} {producto.Unidad})",
                    FechaHora = DateTime.Now
                });

                _db.VentaDetalles.Add(new VentaDetalle
                {
                    VentaId = venta.Id,
                    ProductoId = producto.Id,
                    PresentacionTipo = item.PresentacionTipo,
                    PresentacionNombre = presNombre,
                    CantidadPresentaciones = item.CantidadPresentaciones,
                    FactorConversion = factor,
                    PiezasTotales = unidadesBase,
                    PrecioUnitario = item.PrecioUnitario,
                    Subtotal = item.Subtotal
                });
            }

            // Registrar pagos
            if (req.Pagos != null && req.Pagos.Any())
            {
                foreach (var p in req.Pagos)
                {
                    _db.Pagos.Add(new Pago
                    {
                        VentaId = venta.Id,
                        Metodo = p.Metodo,
                        Monto = p.Monto,
                        FechaHora = DateTime.Now
                    });
                }
            }

            // Actualizar saldo del cliente y visita
            if (creditoOtorgado > 0)
            {
                cliente.Saldo += creditoOtorgado;
            }

            cliente.UltimaCompra = DateTime.Now.ToString("dd MMM yyyy, hh:mm tt");
            cliente.EstadoVisita = "Visitado";

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            var resp = new VentaRegistradaResponseDto
            {
                Folio = folio,
                FechaHora = venta.FechaHora,
                TotalVenta = venta.Total,
                TotalPagado = totalPagadoDirecto,
                CreditoOtorgado = creditoOtorgado,
                NuevoSaldoCliente = cliente.Saldo,
                Estado = "Completada"
            };

            return StatusCode(201, resp);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al procesar la venta en base de datos", detalle = ex.Message });
        }
    }

    [HttpPost("solicitar-sobregiro")]
    public async Task<IActionResult> SolicitarSobregiro([FromBody] SolicitarSobregiroRequestDto req)
    {
        string cleanCId = (req.ClienteId ?? "").Trim().ToLower();
        string numOnlyCId = cleanCId.StartsWith("c") ? cleanCId.Substring(1) : cleanCId;
        var cliente = await _db.Clientes.FirstOrDefaultAsync(c =>
            c.Codigo.ToLower() == cleanCId ||
            c.Id.ToString() == cleanCId ||
            c.Id.ToString() == numOnlyCId ||
            c.Nombre.ToLower() == cleanCId);

        if (cliente == null)
            return NotFound(new { message = $"Cliente '{req.ClienteId}' no encontrado" });

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u =>
            u.Id.ToString() == req.EmpleadoId ||
            u.NombreUsuario.ToLower() == req.EmpleadoId.ToLower())
            ?? await _db.Usuarios.FirstOrDefaultAsync(u => u.Activo)
            ?? new Usuario { Id = 1, Nombre = "Juan Chofer" };

        decimal excedente = Math.Max(0m, (cliente.Saldo + req.MontoSolicitado) - cliente.LimiteCredito);

        var solicitud = new SolicitudSobregiro
        {
            TokenSolicitud = Guid.NewGuid().ToString("N"),
            ClienteId = cliente.Id,
            ChoferId = usuario.Id,
            SaldoActual = cliente.Saldo,
            LimiteCredito = cliente.LimiteCredito,
            MontoSolicitado = req.MontoSolicitado,
            Motivo = req.Motivo ?? $"Sobregiro de crédito en ruta por ${req.MontoSolicitado:N2}",
            Estado = "Pendiente",
            FechaSolicitud = DateTime.Now
        };

        _db.SolicitudesSobregiro.Add(solicitud);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(ConsultarSobregiro), new { token = solicitud.TokenSolicitud }, new
        {
            message = "Solicitud de sobregiro enviada exitosamente a Don Miguel",
            tokenSolicitud = solicitud.TokenSolicitud,
            clienteNombre = cliente.Nombre,
            choferNombre = usuario.Nombre,
            saldoActual = cliente.Saldo,
            limiteCredito = cliente.LimiteCredito,
            montoSolicitado = req.MontoSolicitado,
            excedente = excedente,
            estado = solicitud.Estado
        });
    }

    [HttpGet("solicitudes-sobregiro")]
    public async Task<IActionResult> GetSolicitudesSobregiro([FromQuery] string? estado)
    {
        string targetEstado = string.IsNullOrWhiteSpace(estado) ? "Pendiente" : estado.Trim();
        var query = _db.SolicitudesSobregiro
            .Include(s => s.Cliente)
            .Include(s => s.Chofer)
            .AsQueryable();

        if (targetEstado != "Todos")
        {
            query = query.Where(s => s.Estado == targetEstado);
        }

        var list = await query
            .OrderByDescending(s => s.FechaSolicitud)
            .Take(50)
            .Select(s => new SolicitudSobregiroDto
            {
                Id = s.Id,
                TokenSolicitud = s.TokenSolicitud,
                ClienteId = s.Cliente != null ? s.Cliente.Codigo : s.ClienteId.ToString(),
                ClienteNombre = s.Cliente != null ? s.Cliente.Nombre : "Cliente",
                ChoferId = s.Chofer != null ? s.Chofer.Id.ToString() : s.ChoferId.ToString(),
                ChoferNombre = s.Chofer != null ? s.Chofer.Nombre : "Chofer",
                SaldoActual = s.SaldoActual,
                LimiteCredito = s.LimiteCredito,
                MontoSolicitado = s.MontoSolicitado,
                Excedente = Math.Max(0m, (s.SaldoActual + s.MontoSolicitado) - s.LimiteCredito),
                Motivo = s.Motivo,
                Estado = s.Estado,
                TokenAutorizacion = s.TokenAutorizacion,
                FechaSolicitud = s.FechaSolicitud,
                FechaResolucion = s.FechaResolucion
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost("resolver-sobregiro")]
    public async Task<IActionResult> ResolverSobregiro([FromBody] ResolverSobregiroRequestDto req)
    {
        var solicitud = await _db.SolicitudesSobregiro
            .Include(s => s.Cliente)
            .FirstOrDefaultAsync(s => s.TokenSolicitud == req.TokenSolicitud);

        if (solicitud == null)
            return NotFound(new { message = "Solicitud de sobregiro no encontrada" });

        if (solicitud.Estado != "Pendiente")
            return BadRequest(new { message = $"La solicitud ya fue procesada anteriormente ({solicitud.Estado})" });

        solicitud.FechaResolucion = DateTime.Now;
        if (req.Autorizado)
        {
            solicitud.Estado = "Autorizada";
            solicitud.TokenAutorizacion = $"AUTH-{Random.Shared.Next(100000, 999999)}";
        }
        else
        {
            solicitud.Estado = "Rechazada";
        }

        if (!string.IsNullOrWhiteSpace(req.MotivoResolucion))
        {
            solicitud.Motivo = $"{solicitud.Motivo} | Resolución: {req.MotivoResolucion}";
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = req.Autorizado ? "Sobregiro autorizado por Don Miguel" : "Sobregiro rechazado",
            tokenSolicitud = solicitud.TokenSolicitud,
            estado = solicitud.Estado,
            tokenAutorizacion = solicitud.TokenAutorizacion,
            clienteNombre = solicitud.Cliente?.Nombre
        });
    }

    [HttpGet("consultar-sobregiro/{token}")]
    public async Task<IActionResult> ConsultarSobregiro(string token)
    {
        var solicitud = await _db.SolicitudesSobregiro
            .Include(s => s.Cliente)
            .FirstOrDefaultAsync(s => s.TokenSolicitud == token);

        if (solicitud == null)
            return NotFound(new { message = "Solicitud no encontrada" });

        return Ok(new
        {
            tokenSolicitud = solicitud.TokenSolicitud,
            estado = solicitud.Estado,
            tokenAutorizacion = solicitud.TokenAutorizacion,
            clienteNombre = solicitud.Cliente?.Nombre,
            montoSolicitado = solicitud.MontoSolicitado,
            fechaResolucion = solicitud.FechaResolucion
        });
    }
}
