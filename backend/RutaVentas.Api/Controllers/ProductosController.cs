using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/productos")]
public class ProductosController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    public ProductosController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? categoria, [FromQuery] string? search, [FromQuery] bool activo = true)
    {
        var query = _db.Productos
            .Include(p => p.Presentaciones)
            .Where(p => p.Activo == activo);

        if (!string.IsNullOrWhiteSpace(categoria) && categoria != "Todos" && categoria != "todas")
        {
            query = query.Where(p => p.Categoria.ToLower() == categoria.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(s) || 
                                     p.Codigo.ToLower().Contains(s) || 
                                     (p.Marca != null && p.Marca.ToLower().Contains(s)) ||
                                     (p.Sku != null && p.Sku.ToLower().Contains(s)));
        }

        var list = await query
            .OrderBy(p => p.Id)
            .Select(p => new ProductoDto
            {
                Id = p.Codigo,
                Nombre = p.Nombre,
                Marca = p.Marca,
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
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var p = await _db.Productos
            .Include(p => p.Presentaciones)
            .FirstOrDefaultAsync(p => p.Codigo == id || p.Id.ToString() == id);

        if (p == null) return NotFound(new { message = "Producto no encontrado" });

        var dto = new ProductoDto
        {
            Id = p.Codigo,
            Nombre = p.Nombre,
            Marca = p.Marca,
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
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GuardarProductoRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest(new { message = "El nombre del producto es obligatorio" });

        var maxId = await _db.Productos.AnyAsync() ? await _db.Productos.MaxAsync(p => p.Id) : 0;
        var codigo = !string.IsNullOrWhiteSpace(req.Codigo) ? req.Codigo.Trim() : $"p{maxId + 1}";
        while (await _db.Productos.AnyAsync(p => p.Codigo == codigo))
        {
            maxId++;
            codigo = $"p{maxId + 1}";
        }

        var sku = !string.IsNullOrWhiteSpace(req.Sku) ? req.Sku.Trim() : codigo.ToUpper();
        if (await _db.Productos.AnyAsync(p => p.Sku == sku))
        {
            sku = $"{sku}-{DateTime.Now.Ticks.ToString()[^4..]}";
        }

        var producto = new Data.Entities.Producto
        {
            Codigo = codigo,
            Nombre = req.Nombre.Trim(),
            Marca = req.Marca?.Trim(),
            Categoria = string.IsNullOrWhiteSpace(req.Categoria) ? "Jamón" : req.Categoria.Trim(),
            Unidad = string.IsNullOrWhiteSpace(req.Unidad) ? "kg" : req.Unidad.Trim(),
            PrecioBase = req.PrecioBase,
            PrecioCompra = req.PrecioCompra ?? Math.Round(req.PrecioBase * 0.70m, 2),
            Existencia = req.ExistenciaPiezas,
            Sku = sku,
            CodigoBarras = req.CodigoBarras?.Trim() ?? $"750{DateTime.Now.Ticks.ToString()[^9..]}",
            Favorito = req.Favorito,
            Activo = true,
            ManejaMultiplesPresentaciones = req.ManejaMultiplesPresentaciones,
            FechaCreacion = DateTime.Now
        };

        if (req.Presentaciones != null && req.Presentaciones.Any())
        {
            int ord = 1;
            foreach (var pr in req.Presentaciones)
            {
                producto.Presentaciones.Add(new Data.Entities.PresentacionProducto
                {
                    Tipo = pr.Tipo,
                    Nombre = pr.Nombre,
                    PiezasEquivalentes = pr.PiezasEquivalentes > 0 ? pr.PiezasEquivalentes : 1,
                    Precio = pr.Precio > 0 ? pr.Precio : req.PrecioBase,
                    DescripcionEquivalencia = pr.DescripcionEquivalencia,
                    CodigoBarras = pr.CodigoBarras,
                    Activa = pr.Activa,
                    Orden = pr.Orden > 0 ? pr.Orden : ord++
                });
            }
        }
        else
        {
            producto.Presentaciones.Add(new Data.Entities.PresentacionProducto
            {
                Tipo = "pieza",
                Nombre = producto.Unidad == "kg" ? "Por Kilo / Porción" : "Pieza Individual",
                PiezasEquivalentes = 1,
                Precio = req.PrecioBase,
                DescripcionEquivalencia = producto.Unidad == "kg" ? $"Venta por peso (${req.PrecioBase}/kg)" : "1 pieza",
                Activa = true,
                Orden = 1
            });
        }

        _db.Productos.Add(producto);
        await _db.SaveChangesAsync();

        return StatusCode(201, new ProductoDto
        {
            Id = producto.Codigo,
            Nombre = producto.Nombre,
            Marca = producto.Marca,
            Categoria = producto.Categoria,
            Unidad = producto.Unidad,
            PrecioPorPeso = producto.Unidad == "kg" && !producto.ManejaMultiplesPresentaciones,
            PrecioBase = producto.PrecioBase,
            PrecioCompra = producto.PrecioCompra,
            ExistenciaPiezas = producto.Existencia,
            Sku = producto.Sku ?? producto.Codigo,
            CodigoBarras = producto.CodigoBarras ?? "",
            Favorito = producto.Favorito,
            Activo = producto.Activo,
            ManejaMultiplesPresentaciones = producto.ManejaMultiplesPresentaciones,
            Presentaciones = producto.Presentaciones.Select(pr => new PresentacionConfigDto
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
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] GuardarProductoRequestDto req)
    {
        var producto = await _db.Productos
            .Include(p => p.Presentaciones)
            .FirstOrDefaultAsync(p => p.Codigo == id || p.Id.ToString() == id);

        if (producto == null) return NotFound(new { message = "Producto no encontrado" });

        if (!string.IsNullOrWhiteSpace(req.Nombre)) producto.Nombre = req.Nombre.Trim();
        if (req.Marca != null) producto.Marca = req.Marca.Trim();
        if (!string.IsNullOrWhiteSpace(req.Categoria)) producto.Categoria = req.Categoria.Trim();
        if (!string.IsNullOrWhiteSpace(req.Unidad)) producto.Unidad = req.Unidad.Trim();
        if (req.PrecioBase > 0) producto.PrecioBase = req.PrecioBase;
        if (req.PrecioCompra.HasValue) producto.PrecioCompra = req.PrecioCompra.Value;
        producto.Existencia = req.ExistenciaPiezas;
        if (!string.IsNullOrWhiteSpace(req.Sku)) producto.Sku = req.Sku.Trim();
        if (req.CodigoBarras != null) producto.CodigoBarras = req.CodigoBarras.Trim();
        producto.Favorito = req.Favorito;
        producto.ManejaMultiplesPresentaciones = req.ManejaMultiplesPresentaciones;

        if (req.Presentaciones != null && req.Presentaciones.Any())
        {
            _db.PresentacionesProducto.RemoveRange(producto.Presentaciones);
            producto.Presentaciones.Clear();

            int ord = 1;
            foreach (var pr in req.Presentaciones)
            {
                producto.Presentaciones.Add(new Data.Entities.PresentacionProducto
                {
                    Tipo = pr.Tipo,
                    Nombre = pr.Nombre,
                    PiezasEquivalentes = pr.PiezasEquivalentes > 0 ? pr.PiezasEquivalentes : 1,
                    Precio = pr.Precio > 0 ? pr.Precio : producto.PrecioBase,
                    DescripcionEquivalencia = pr.DescripcionEquivalencia,
                    CodigoBarras = pr.CodigoBarras,
                    Activa = pr.Activa,
                    Orden = pr.Orden > 0 ? pr.Orden : ord++
                });
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Producto actualizado correctamente", id = producto.Codigo });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var producto = await _db.Productos.FirstOrDefaultAsync(p => p.Codigo == id || p.Id.ToString() == id);
        if (producto == null) return NotFound(new { message = "Producto no encontrado" });

        producto.Activo = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Producto '{producto.Nombre}' dado de baja correctamente", id = producto.Codigo });
    }
}
