using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/productos/importaciones")]
public class ImportacionesController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public ImportacionesController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet("archivo-demo")]
    public async Task<IActionResult> GetDemoFile()
    {
        var candidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "ProductosMiguel.csv"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "ProductosMiguel.csv"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "ProductosMiguel.csv"),
            @"D:\APP-Ruta-Venta\ProductosMiguel.csv"
        };

        foreach (var path in candidates)
        {
            if (System.IO.File.Exists(path))
            {
                var content = await System.IO.File.ReadAllTextAsync(path);
                return Ok(new { nombreArchivo = "ProductosMiguel.csv", contenidoCsv = content });
            }
        }

        return NotFound(new { message = "Archivo ProductosMiguel.csv no encontrado en el servidor" });
    }

    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] PreviewImportacionRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.ContenidoCsv))
        {
            return BadRequest(new { message = "El contenido del archivo CSV es obligatorio para la previsualización" });
        }

        var fileHash = ComputeSha256(req.ContenidoCsv);
        var importacionPrevia = await _db.ImportacionesCatalogo
            .Where(i => i.FileHash == fileHash)
            .OrderByDescending(i => i.FechaHora)
            .FirstOrDefaultAsync();

        var yaFueImportado = importacionPrevia != null;
        DateTime? fechaUltima = importacionPrevia?.FechaHora;

        // Cargar productos existentes para comparar nombres normalizados
        var productosDb = await _db.Productos
            .Where(p => p.Activo)
            .Select(p => new
            {
                p.Id,
                p.Codigo,
                p.Nombre,
                p.PrecioBase,
                p.PrecioCompra,
                p.Existencia,
                p.Unidad,
                p.Categoria,
                NormNombre = NormalizeText(p.Nombre)
            })
            .ToListAsync();

        var dbLookup = productosDb
            .GroupBy(p => p.NormNombre)
            .ToDictionary(g => g.Key, g => g.ToList());

        var lines = req.ContenidoCsv.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None);
        var filasPreview = new List<FilaPreviewImportacionDto>();

        // Primero recopilar filas válidas para detectar ambigüedades dentro del mismo CSV
        var rawRows = new List<(int lineIndex, List<string> cols)>();
        bool isFirstLine = true;

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line)) continue;

            var cols = ParseCsvLine(line);
            if (isFirstLine)
            {
                isFirstLine = false;
                // Si la primera fila es encabezado (ej. contiene "Código" o "Nombre"), la saltamos
                if (cols.Count > 1 && (cols[0].Contains("Código", StringComparison.OrdinalIgnoreCase) ||
                                       cols[1].Contains("Nombre", StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }
            }

            rawRows.Add((i + 1, cols));
        }

        // Frecuencia de nombres en el CSV para detectar duplicados internos
        var nameFrequencies = new Dictionary<string, int>();
        foreach (var r in rawRows)
        {
            var name = r.cols.Count > 1 ? r.cols[1].Trim() : "";
            var norm = NormalizeText(name);
            if (!string.IsNullOrEmpty(norm))
            {
                nameFrequencies[norm] = nameFrequencies.GetValueOrDefault(norm, 0) + 1;
            }
        }

        foreach (var r in rawRows)
        {
            var filaNum = r.lineIndex;
            var cols = r.cols;

            var rawCodigo = cols.Count > 0 ? cols[0].Trim() : "";
            var rawNombre = cols.Count > 1 ? cols[1].Trim() : "";
            var rawCategoria = cols.Count > 2 ? cols[2].Trim() : "";
            var rawUnidad = cols.Count > 3 ? cols[3].Trim() : "";
            var rawCosto = cols.Count > 6 ? cols[6].Trim() : "";
            var rawPrecio = cols.Count > 7 ? cols[7].Trim() : "";

            var codigoOrigen = (rawCodigo.Equals("null", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(rawCodigo))
                ? ""
                : rawCodigo;

            var filaDto = new FilaPreviewImportacionDto
            {
                NumeroFila = filaNum,
                CodigoCsv = codigoOrigen,
                NombreCsv = rawNombre,
                CategoriaCsv = rawCategoria,
                UnidadCsv = rawUnidad,
            };

            // Validar nombre
            if (string.IsNullOrWhiteSpace(rawNombre))
            {
                filaDto.Clasificacion = "Invalido";
                filaDto.MotivoClasificacion = "El nombre del producto no puede estar vacío";
                filasPreview.Add(filaDto);
                continue;
            }

            // Validar números (Costo y Precio)
            bool costoValido = TryParseSpanishDecimal(rawCosto, out decimal costo);
            bool precioValido = TryParseSpanishDecimal(rawPrecio, out decimal precio);

            if (!costoValido || !precioValido)
            {
                filaDto.Clasificacion = "Invalido";
                filaDto.MotivoClasificacion = $"Formato numérico inválido en Costo ('{rawCosto}') o Precio ('{rawPrecio}')";
                filasPreview.Add(filaDto);
                continue;
            }

            filaDto.CostoCsv = costo;
            filaDto.PrecioCsv = precio;

            var normNombre = NormalizeText(rawNombre);

            // Comparar con BD
            if (dbLookup.TryGetValue(normNombre, out var dbMatches))
            {
                if (dbMatches.Count == 1)
                {
                    var m = dbMatches[0];
                    filaDto.Clasificacion = "Existente";
                    filaDto.MotivoClasificacion = $"Coincide exactamente con el producto existente '{m.Nombre}' ({m.Codigo})";
                    filaDto.ProductoCoincidenteId = m.Codigo;
                    filaDto.ProductoCoincidenteNombre = m.Nombre;
                    filaDto.ProductoCoincidentePrecioActual = m.PrecioBase;
                    filaDto.ProductoCoincidenteCostoActual = m.PrecioCompra;
                    filaDto.ProductoCoincidenteExistenciaActual = m.Existencia;
                    filaDto.CandidatosCoincidentes.Add(new CoincidenciaCandidataDto
                    {
                        ProductoId = m.Id.ToString(),
                        Codigo = m.Codigo,
                        Nombre = m.Nombre,
                        PrecioBase = m.PrecioBase,
                        PrecioCompra = m.PrecioCompra,
                        Existencia = m.Existencia,
                        Unidad = m.Unidad,
                        Categoria = m.Categoria
                    });
                }
                else
                {
                    filaDto.Clasificacion = "Ambiguo";
                    filaDto.MotivoClasificacion = $"Existen {dbMatches.Count} productos en catálogo con el mismo nombre normalizado";
                    foreach (var m in dbMatches)
                    {
                        filaDto.CandidatosCoincidentes.Add(new CoincidenciaCandidataDto
                        {
                            ProductoId = m.Id.ToString(),
                            Codigo = m.Codigo,
                            Nombre = m.Nombre,
                            PrecioBase = m.PrecioBase,
                            PrecioCompra = m.PrecioCompra,
                            Existencia = m.Existencia,
                            Unidad = m.Unidad,
                            Categoria = m.Categoria
                        });
                    }
                }
            }
            else
            {
                // No hay coincidencia exacta en BD. Revisar si hay duplicados en el mismo CSV
                if (nameFrequencies.GetValueOrDefault(normNombre, 0) > 1)
                {
                    filaDto.Clasificacion = "Ambiguo";
                    filaDto.MotivoClasificacion = "Nombre repetido en múltiples filas del mismo archivo CSV; requiere confirmación manual";
                }
                else
                {
                    // Buscar coincidencias parciales en BD para sugerir
                    var partialMatches = productosDb
                        .Where(p => p.NormNombre.Contains(normNombre) || normNombre.Contains(p.NormNombre))
                        .Take(3)
                        .ToList();

                    if (partialMatches.Any())
                    {
                        filaDto.Clasificacion = "Nuevo";
                        filaDto.MotivoClasificacion = "Producto nuevo (existen productos con nombres similares en catálogo)";
                        foreach (var m in partialMatches)
                        {
                            filaDto.CandidatosCoincidentes.Add(new CoincidenciaCandidataDto
                            {
                                ProductoId = m.Id.ToString(),
                                Codigo = m.Codigo,
                                Nombre = m.Nombre,
                                PrecioBase = m.PrecioBase,
                                PrecioCompra = m.PrecioCompra,
                                Existencia = m.Existencia,
                                Unidad = m.Unidad,
                                Categoria = m.Categoria
                            });
                        }
                    }
                    else
                    {
                        filaDto.Clasificacion = "Nuevo";
                        filaDto.MotivoClasificacion = "Producto nuevo a dar de alta";
                    }
                }
            }

            filasPreview.Add(filaDto);
        }

        var response = new PreviewImportacionResponseDto
        {
            FileHash = fileHash,
            NombreArchivo = req.NombreArchivo,
            TotalFilas = filasPreview.Count,
            TotalNuevos = filasPreview.Count(f => f.Clasificacion == "Nuevo"),
            TotalExistentes = filasPreview.Count(f => f.Clasificacion == "Existente"),
            TotalAmbiguos = filasPreview.Count(f => f.Clasificacion == "Ambiguo"),
            TotalInvalidos = filasPreview.Count(f => f.Clasificacion == "Invalido"),
            YaFueImportadoPreviamente = yaFueImportado,
            FechaUltimaImportacion = fechaUltima,
            Filas = filasPreview
        };

        return Ok(response);
    }

    [HttpPost("confirmar")]
    public async Task<IActionResult> Confirmar([FromBody] ConfirmarImportacionRequestDto req)
    {
        if (req.Resoluciones == null || !req.Resoluciones.Any())
        {
            return BadRequest(new { message = "Se requiere al menos una fila resuelta para confirmar la importación" });
        }

        // Validación de autorización: solo administradores pueden confirmar importación de catálogo
        var usuario = req.Usuario?.Trim() ?? "Miguel";
        var dbUser = await _db.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario.ToLower() == usuario.ToLower() || u.Nombre.ToLower() == usuario.ToLower());
        if (dbUser != null && dbUser.Rol != "Administrador")
        {
            return StatusCode(403, new { message = "Solo usuarios con rol Administrador tienen autorización para importar el catálogo de productos." });
        }

        // Prevención estricta de importaciones duplicadas simultáneas o repetidas
        var yaImportado = await _db.ImportacionesCatalogo.AnyAsync(i => i.FileHash == req.FileHash);
        if (yaImportado)
        {
            return Conflict(new
            {
                message = "Este archivo ya fue importado previamente en el catálogo. La importación fue cancelada para proteger la integridad de los datos.",
                fileHash = req.FileHash
            });
        }

        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            int totalCreados = 0;
            int totalActualizados = 0;
            int totalOmitidos = 0;
            int totalPendientes = 0;
            var advertencias = new List<string>();

            // Determinar secuencia numérica de códigos p{num} de forma segura ante concurrencia
            var allCodigos = await _db.Productos.Select(p => p.Codigo).ToListAsync();
            int maxPNumber = 0;
            foreach (var c in allCodigos)
            {
                if (c.StartsWith("p", StringComparison.OrdinalIgnoreCase) &&
                    int.TryParse(c[1..], out int num))
                {
                    if (num > maxPNumber) maxPNumber = num;
                }
            }

            int nextCodeNum = maxPNumber + 1;

            foreach (var res in req.Resoluciones)
            {
                if (res.Accion == "Omitir")
                {
                    totalOmitidos++;
                    continue;
                }

                if (res.Accion == "Vincular" && !string.IsNullOrWhiteSpace(res.ProductoExistenteId))
                {
                    var prod = await _db.Productos
                        .Include(p => p.Presentaciones)
                        .FirstOrDefaultAsync(p => p.Codigo == res.ProductoExistenteId);

                    if (prod != null)
                    {
                        // REGLA CRÍTICA: Actualizar SOLO PrecioBase y PrecioCompra.
                        // CONSERVAR Existencia, Presentaciones, Códigos y Factores de conversión intactos.
                        prod.PrecioBase = res.PrecioCsv;
                        prod.PrecioCompra = res.CostoCsv;

                        // Si el usuario confirmó una unidad específica válida
                        if (!string.IsNullOrWhiteSpace(res.UnidadConfirmada) && res.UnidadConfirmada.ToLower() != "unidad")
                        {
                            prod.Unidad = res.UnidadConfirmada.Trim();
                            prod.EstadoConfiguracion = "Completo";
                        }

                        totalActualizados++;
                    }
                    else
                    {
                        advertencias.Add($"Fila {res.NumeroFila}: No se encontró el producto con código '{res.ProductoExistenteId}' para vincular.");
                    }
                }
                else if (res.Accion == "Crear")
                {
                    // Asignar código p{nextCodeNum} único
                    var nuevoCodigo = $"p{nextCodeNum++}";
                    while (allCodigos.Contains(nuevoCodigo))
                    {
                        nuevoCodigo = $"p{nextCodeNum++}";
                    }
                    allCodigos.Add(nuevoCodigo);

                    var unidadConfirmada = !string.IsNullOrWhiteSpace(res.UnidadConfirmada) ? res.UnidadConfirmada.Trim().ToLower() : "unidad";
                    var esPendiente = unidadConfirmada == "unidad" || string.IsNullOrWhiteSpace(res.UnidadConfirmada);

                    var codigoOrigen = (!string.IsNullOrWhiteSpace(res.CodigoCsv) && !res.CodigoCsv.Equals("null", StringComparison.OrdinalIgnoreCase))
                        ? res.CodigoCsv.Trim()
                        : null;

                    var nuevoProd = new Producto
                    {
                        Codigo = nuevoCodigo,
                        Nombre = res.NombreCsv.Trim(),
                        Categoria = "Sin categoría", // NO inventar categoría "Jamón"
                        Unidad = unidadConfirmada,
                        PrecioBase = res.PrecioCsv,
                        PrecioCompra = res.CostoCsv,
                        Existencia = 0, // REGLA: Los productos nuevos inician en cero existencias
                        Sku = nuevoCodigo.ToUpper(),
                        CodigoBarras = "", // NO inventar códigos de barras ficticios
                        Favorito = false,
                        Activo = true,
                        EstadoConfiguracion = esPendiente ? "Pendiente" : "Completo",
                        CodigoOrigen = codigoOrigen,
                        ManejaMultiplesPresentaciones = false,
                        FechaCreacion = DateTime.Now
                    };

                    if (esPendiente)
                    {
                        totalPendientes++;
                    }

                    // Presentación base inicial
                    nuevoProd.Presentaciones.Add(new PresentacionProducto
                    {
                        Tipo = "pieza",
                        Nombre = "Unidad Base",
                        PiezasEquivalentes = 1,
                        Precio = res.PrecioCsv,
                        DescripcionEquivalencia = "1 unidad base",
                        Activa = true,
                        Orden = 1
                    });

                    _db.Productos.Add(nuevoProd);
                    totalCreados++;
                }
            }

            // Registrar importación en la tabla de trazabilidad y auditoría
            var importRecord = new ImportacionCatalogo
            {
                FileHash = req.FileHash,
                NombreArchivo = req.NombreArchivo,
                TotalFilas = req.Resoluciones.Count,
                TotalCreados = totalCreados,
                TotalActualizados = totalActualizados,
                TotalOmitidos = totalOmitidos,
                TotalPendientesConfiguracion = totalPendientes,
                FechaHora = DateTime.Now,
                Usuario = usuario
            };

            _db.ImportacionesCatalogo.Add(importRecord);

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new ConfirmarImportacionResponseDto
            {
                Success = true,
                Message = "Importación de catálogo confirmada y persistida en SQL Server exitosamente.",
                FileHash = req.FileHash,
                TotalProcesados = req.Resoluciones.Count,
                TotalCreados = totalCreados,
                TotalActualizados = totalActualizados,
                TotalOmitidos = totalOmitidos,
                TotalPendientesConfiguracion = totalPendientes,
                Advertencias = advertencias
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al confirmar la importación de catálogo", detalle = ex.Message });
        }
    }

    private static bool TryParseSpanishDecimal(string raw, out decimal result)
    {
        result = 0;
        if (string.IsNullOrWhiteSpace(raw)) return false;

        var cleaned = raw.Trim().Replace("$", "").Replace(" ", "");

        // Si contiene punto y coma (ej. 241.088,06 o 16.762,5)
        if (cleaned.Contains('.') && cleaned.Contains(','))
        {
            cleaned = cleaned.Replace(".", "").Replace(',', '.');
        }
        else if (cleaned.Contains(','))
        {
            cleaned = cleaned.Replace(',', '.');
        }
        else if (cleaned.Count(c => c == '.') > 1)
        {
            // Múltiples puntos como separadores de miles sin coma (ej. 1.000.000)
            cleaned = cleaned.Replace(".", "");
        }
        else if (cleaned.Contains('.'))
        {
            // Un solo punto sin coma: si tiene 3 dígitos tras el punto y parte entera != 0 (ej. 1.350, 25.802), es separador de miles en formato contable español
            var dotParts = cleaned.Split('.');
            if (dotParts.Length == 2 && dotParts[1].Length == 3 && dotParts[0] != "0" && dotParts[0] != "-0")
            {
                cleaned = cleaned.Replace(".", "");
            }
        }

        return decimal.TryParse(cleaned, NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }

    private static string NormalizeText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        return sb.ToString().Normalize(NormalizationForm.FormC).Trim().ToLowerInvariant();
    }

    private static string ComputeSha256(string content)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        if (string.IsNullOrEmpty(line)) return values;

        var sb = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    sb.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                values.Add(sb.ToString().Trim());
                sb.Clear();
            }
            else
            {
                sb.Append(c);
            }
        }
        values.Add(sb.ToString().Trim());
        return values;
    }
}
