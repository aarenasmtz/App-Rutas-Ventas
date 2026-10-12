using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/sync")]
public class SyncController : ControllerBase
{
    private readonly RutaVentasDbContext _db;
    private static readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public SyncController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        int ventasCount = await _db.Ventas.CountAsync();
        int clientesCount = await _db.Clientes.CountAsync(c => c.Activo);
        int productosCount = await _db.Productos.CountAsync(p => p.Activo);

        return Ok(new
        {
            online = true,
            serverTimestamp = DateTime.Now,
            ventasRegistradas = ventasCount,
            catalogo = new
            {
                clientes = clientesCount,
                productos = productosCount
            }
        });
    }

    [HttpGet("pull")]
    public async Task<IActionResult> PullCatalog()
    {
        var productos = await _db.Productos
            .Include(p => p.Presentaciones)
            .Where(p => p.Activo)
            .OrderBy(p => p.Id)
            .ToListAsync();

        var clientes = await _db.Clientes
            .Where(c => c.Activo)
            .OrderBy(c => c.Id)
            .ToListAsync();

        var productosDto = productos.Select(p => new ProductoDto
        {
            Id = p.Codigo,
            Nombre = p.Nombre,
            Marca = p.Marca ?? "",
            Categoria = p.Categoria,
            Unidad = p.Unidad,
            PrecioPorPeso = p.Unidad == "kg" && !p.ManejaMultiplesPresentaciones,
            PrecioBase = p.PrecioBase,
            PrecioCompra = p.PrecioCompra,
            ExistenciaPiezas = p.Existencia,
            Sku = p.Sku ?? p.Codigo,
            CodigoBarras = p.CodigoBarras ?? "",
            Favorito = p.Favorito,
            Activo = p.Activo,
            ManejaMultiplesPresentaciones = p.ManejaMultiplesPresentaciones,
            Presentaciones = p.Presentaciones
                .Where(pr => pr.Activa)
                .OrderBy(pr => pr.Orden)
                .Select(pr => new PresentacionConfigDto
                {
                    Tipo = pr.Tipo,
                    Nombre = pr.Nombre,
                    PiezasEquivalentes = pr.PiezasEquivalentes,
                    Precio = pr.Precio,
                    DescripcionEquivalencia = pr.DescripcionEquivalencia,
                    CodigoBarras = pr.CodigoBarras ?? "",
                    Activa = pr.Activa,
                    Orden = pr.Orden
                }).ToList()
        }).ToList();

        var clientesDto = clientes.Select(c =>
        {
            List<string> dias = new() { "Lun", "Mié", "Vie" };
            try
            {
                if (!string.IsNullOrWhiteSpace(c.DiasVisitaJson))
                    dias = JsonSerializer.Deserialize<List<string>>(c.DiasVisitaJson) ?? dias;
            }
            catch { }

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
                UltimoPago = c.UltimoPago
            };
        }).ToList();

        return Ok(new SyncPullCatalogResponseDto
        {
            TimestampGeneracion = DateTime.Now,
            Productos = productosDto,
            Clientes = clientesDto
        });
    }

    [HttpPost("batch")]
    public async Task<IActionResult> ProcessBatch([FromBody] SyncBatchRequestDto req)
    {
        if (req.Operaciones == null || !req.Operaciones.Any())
        {
            return Ok(new SyncBatchResponseDto
            {
                Exitoso = true,
                TotalRecibidas = 0,
                SincronizadasCorrectas = 0,
                TimestampServidor = DateTime.Now
            });
        }

        var response = new SyncBatchResponseDto
        {
            TotalRecibidas = req.Operaciones.Count,
            TimestampServidor = DateTime.Now
        };

        var defaultUsuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id.ToString() == req.EmpleadoId || u.Activo)
                             ?? new Usuario { Id = 1, Nombre = "Miguel" };

        foreach (var op in req.Operaciones)
        {
            try
            {
                switch (op.Tipo.ToLower())
                {
                    case "venta":
                    {
                        var ventaDto = JsonSerializer.Deserialize<RegistrarVentaRequestDto>(op.PayloadJson, _jsonOpts);
                        if (ventaDto == null)
                        {
                            response.ConError++;
                            response.Resultados.Add(new SyncOperationResultDto
                            {
                                Id = op.Id,
                                IdempotencyKey = op.IdempotencyKey,
                                Estado = "Error",
                                Mensaje = "Payload de venta inválido"
                            });
                            continue;
                        }

                        // Idempotencia: Verificar si ya existe por IdempotencyKey o Folio
                        var existeVenta = await _db.Ventas.FirstOrDefaultAsync(v => v.Folio == op.IdempotencyKey);
                        if (existeVenta != null)
                        {
                            response.DuplicadasOmitidas++;
                            response.Resultados.Add(new SyncOperationResultDto
                            {
                                Id = op.Id,
                                IdempotencyKey = op.IdempotencyKey,
                                Estado = "DuplicadoOmitido",
                                Mensaje = "Venta ya procesada previamente",
                                FolioAsignado = existeVenta.Folio
                            });
                            continue;
                        }

                        string cleanCId = (ventaDto.ClienteId ?? "").Trim().ToLower();
                        string numOnlyCId = cleanCId.StartsWith("c") ? cleanCId.Substring(1) : cleanCId;
                        var cliente = await _db.Clientes.FirstOrDefaultAsync(c =>
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
                            response.ConError++;
                            response.Resultados.Add(new SyncOperationResultDto
                            {
                                Id = op.Id,
                                IdempotencyKey = op.IdempotencyKey,
                                Estado = "Error",
                                Mensaje = $"Cliente '{ventaDto.ClienteId}' no encontrado"
                            });
                            continue;
                        }

                        string folio = !string.IsNullOrWhiteSpace(op.IdempotencyKey) && op.IdempotencyKey.StartsWith("FOL-")
                            ? op.IdempotencyKey
                            : $"FOL-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks % 1000:D3}";

                        var nuevaVenta = new Venta
                        {
                            Folio = folio,
                            ClienteId = cliente.Id,
                            UsuarioId = defaultUsuario.Id,
                            Total = ventaDto.Total,
                            Subtotal = ventaDto.Total,
                            DescuentoTotal = 0,
                            Estado = "Completada",
                            FechaHora = op.FechaGeneracion != default ? op.FechaGeneracion : DateTime.Now
                        };

                        decimal creditoTotal = 0;
                        if (ventaDto.Pagos != null)
                        {
                            foreach (var p in ventaDto.Pagos)
                            {
                                nuevaVenta.Pagos.Add(new Pago
                                {
                                    Metodo = p.Metodo,
                                    Monto = p.Monto,
                                    FechaHora = nuevaVenta.FechaHora
                                });
                                if (p.Metodo.ToLower().Contains("credito") || p.Metodo.ToLower().Contains("crédito"))
                                {
                                    creditoTotal += p.Monto;
                                }
                            }
                        }

                        if (ventaDto.Items != null)
                        {
                            foreach (var item in ventaDto.Items)
                            {
                                string cleanPId = (item.ProductoId ?? "").Trim().ToLower();
                                string numOnlyPId = cleanPId.StartsWith("p") ? cleanPId.Substring(1) : cleanPId;
                                var prod = await _db.Productos
                                    .Include(p => p.Presentaciones)
                                    .FirstOrDefaultAsync(p =>
                                        p.Codigo.ToLower() == cleanPId ||
                                        p.Id.ToString() == cleanPId ||
                                        p.Id.ToString() == numOnlyPId ||
                                        (p.Sku != null && p.Sku.ToLower() == cleanPId) ||
                                        p.Nombre.ToLower().Contains(cleanPId));
                                if (prod != null)
                                {
                                    var pres = prod.Presentaciones?.FirstOrDefault(pr =>
                                        pr.Tipo.Equals(item.PresentacionTipo, StringComparison.OrdinalIgnoreCase) ||
                                        pr.Nombre.Equals(item.PresentacionTipo, StringComparison.OrdinalIgnoreCase));

                                    int factor = pres?.PiezasEquivalentes ?? (item.FactorConversion > 0 ? item.FactorConversion : 1);
                                    string presNombre = pres?.Nombre ?? item.PresentacionNombre ?? item.PresentacionTipo;
                                    int unidadesADescontar = item.CantidadPresentaciones * factor;

                                    prod.Existencia = Math.Max(0, prod.Existencia - unidadesADescontar);

                                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                                    {
                                        ProductoId = prod.Id,
                                        TipoMovimiento = "Venta",
                                        Ubicacion = defaultUsuario.RutaAsignada ?? "Camioneta 1",
                                        Piezas = -unidadesADescontar,
                                        Motivo = $"Venta Offline Folio {folio} ({item.CantidadPresentaciones} {presNombre} = {unidadesADescontar} {prod.Unidad})",
                                        FechaHora = nuevaVenta.FechaHora
                                    });

                                    nuevaVenta.Detalles.Add(new VentaDetalle
                                    {
                                        ProductoId = prod.Id,
                                        PresentacionTipo = item.PresentacionTipo,
                                        PresentacionNombre = presNombre,
                                        CantidadPresentaciones = item.CantidadPresentaciones,
                                        FactorConversion = factor,
                                        PiezasTotales = unidadesADescontar,
                                        PrecioUnitario = item.PrecioUnitario,
                                        Subtotal = item.Subtotal
                                    });
                                }
                            }
                        }

                        if (creditoTotal > 0)
                        {
                            cliente.Saldo += creditoTotal;
                        }
                        cliente.EstadoVisita = "Venta realizada";
                        cliente.UltimaCompra = $"{DateTime.Now:dd/MM/yyyy} · {folio}";

                        _db.Ventas.Add(nuevaVenta);
                        await _db.SaveChangesAsync();

                        response.SincronizadasCorrectas++;
                        response.Resultados.Add(new SyncOperationResultDto
                        {
                            Id = op.Id,
                            IdempotencyKey = op.IdempotencyKey,
                            Estado = "Sincronizado",
                            Mensaje = "Venta registrada con éxito",
                            FolioAsignado = folio
                        });
                        break;
                    }

                    case "abono":
                    {
                        var abonoDto = JsonSerializer.Deserialize<RegistrarAbonoRequestDto>(op.PayloadJson, _jsonOpts);
                        if (abonoDto == null)
                        {
                            response.ConError++;
                            response.Resultados.Add(new SyncOperationResultDto
                            {
                                Id = op.Id,
                                IdempotencyKey = op.IdempotencyKey,
                                Estado = "Error",
                                Mensaje = "Payload de abono inválido"
                            });
                            continue;
                        }

                        var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Codigo == abonoDto.ClienteId || c.Id.ToString() == abonoDto.ClienteId);
                        if (cliente == null)
                        {
                            response.ConError++;
                            response.Resultados.Add(new SyncOperationResultDto
                            {
                                Id = op.Id,
                                IdempotencyKey = op.IdempotencyKey,
                                Estado = "Error",
                                Mensaje = $"Cliente '{abonoDto.ClienteId}' no encontrado"
                            });
                            continue;
                        }

                        cliente.Saldo = Math.Max(0, cliente.Saldo - abonoDto.Monto);
                        cliente.UltimoPago = $"{DateTime.Now:dd/MM/yyyy} · ${abonoDto.Monto:F2}";

                        _db.AbonosCobranza.Add(new AbonoCobranza
                        {
                            ClienteId = cliente.Id,
                            UsuarioId = defaultUsuario.Id,
                            Monto = abonoDto.Monto,
                            MetodoPago = abonoDto.MetodoPago ?? "Efectivo",
                            Comentario = abonoDto.Comentario,
                            FechaHora = op.FechaGeneracion != default ? op.FechaGeneracion : DateTime.Now
                        });

                        await _db.SaveChangesAsync();

                        response.SincronizadasCorrectas++;
                        response.Resultados.Add(new SyncOperationResultDto
                        {
                            Id = op.Id,
                            IdempotencyKey = op.IdempotencyKey,
                            Estado = "Sincronizado",
                            Mensaje = "Abono aplicado exitosamente a saldo"
                        });
                        break;
                    }

                    case "gasto":
                    {
                        var gastoDto = JsonSerializer.Deserialize<RegistrarGastoRequestDto>(op.PayloadJson, _jsonOpts);
                        if (gastoDto != null)
                        {
                            _db.GastosOperativos.Add(new GastoOperativo
                            {
                                UsuarioId = defaultUsuario.Id,
                                Concepto = gastoDto.Concepto,
                                Importe = gastoDto.Importe,
                                MetodoPago = gastoDto.MetodoPago,
                                Observaciones = gastoDto.Observaciones,
                                FechaHora = op.FechaGeneracion != default ? op.FechaGeneracion : DateTime.Now
                            });
                            await _db.SaveChangesAsync();

                            response.SincronizadasCorrectas++;
                            response.Resultados.Add(new SyncOperationResultDto
                            {
                                Id = op.Id,
                                IdempotencyKey = op.IdempotencyKey,
                                Estado = "Sincronizado",
                                Mensaje = "Gasto operativo registrado"
                            });
                        }
                        break;
                    }

                    case "devolucion":
                    {
                        var devDto = JsonSerializer.Deserialize<RegistrarDevolucionRequestDto>(op.PayloadJson, _jsonOpts);
                        if (devDto != null)
                        {
                            var cliente = await _db.Clientes.FirstOrDefaultAsync(c => c.Codigo == devDto.ClienteId || c.Id.ToString() == devDto.ClienteId);
                            var prod = await _db.Productos.FirstOrDefaultAsync(p => p.Codigo == devDto.ProductoId || p.Id.ToString() == devDto.ProductoId);

                            if (cliente != null && prod != null)
                            {
                                string folio = $"DEV-{DateTime.Now:yyyyMMdd}-{DateTime.Now.Ticks % 1000:D3}";
                                if (devDto.Destino.ToLower() == "inventario")
                                {
                                    prod.Existencia += devDto.Cantidad;
                                }
                                if (devDto.MetodoReembolso.ToLower() == "saldoafavor")
                                {
                                    cliente.Saldo = Math.Max(0, cliente.Saldo - devDto.Total);
                                }

                                _db.Devoluciones.Add(new Devolucion
                                {
                                    Folio = folio,
                                    ClienteId = cliente.Id,
                                    UsuarioId = defaultUsuario.Id,
                                    ProductoId = prod.Id,
                                    Cantidad = devDto.Cantidad,
                                    PresentacionTipo = devDto.PresentacionTipo,
                                    PrecioUnitario = devDto.PrecioUnitario,
                                    Total = devDto.Total,
                                    Motivo = devDto.Motivo,
                                    Destino = devDto.Destino,
                                    MetodoReembolso = devDto.MetodoReembolso,
                                    Observaciones = devDto.Observaciones,
                                    FechaHora = op.FechaGeneracion != default ? op.FechaGeneracion : DateTime.Now
                                });

                                await _db.SaveChangesAsync();

                                response.SincronizadasCorrectas++;
                                response.Resultados.Add(new SyncOperationResultDto
                                {
                                    Id = op.Id,
                                    IdempotencyKey = op.IdempotencyKey,
                                    Estado = "Sincronizado",
                                    Mensaje = "Devolución procesada",
                                    FolioAsignado = folio
                                });
                            }
                        }
                        break;
                    }

                    default:
                        response.ConError++;
                        response.Resultados.Add(new SyncOperationResultDto
                        {
                            Id = op.Id,
                            IdempotencyKey = op.IdempotencyKey,
                            Estado = "Error",
                            Mensaje = $"Tipo de operación '{op.Tipo}' no soportado"
                        });
                        break;
                }
            }
            catch (Exception ex)
            {
                response.ConError++;
                response.Resultados.Add(new SyncOperationResultDto
                {
                    Id = op.Id,
                    IdempotencyKey = op.IdempotencyKey,
                    Estado = "Error",
                    Mensaje = ex.Message
                });
            }
        }

        response.Exitoso = response.ConError == 0;
        return Ok(response);
    }
}
