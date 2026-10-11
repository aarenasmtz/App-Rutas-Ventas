using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/categorias")]
public class CategoriasController : ControllerBase
{
    private readonly RutaVentasDbContext _db;

    private static readonly Dictionary<string, string> IconosDefault = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Jamón", "🥓" },
        { "Salchicha", "🌭" },
        { "Chorizo", "🥩" },
        { "Quesos", "🧀" },
        { "Queso", "🧀" },
        { "Carnes frías", "🍗" },
        { "Abarrotes", "🥫" },
        { "Enlatados", "🥫" },
        { "Lácteos", "🥛" },
        { "Bebidas", "🥤" },
        { "Panadería", "🍞" },
    };

    public CategoriasController(RutaVentasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categorias = await _db.Categorias
            .Where(c => c.Activa)
            .OrderBy(c => c.Nombre)
            .ToListAsync();

        // Si la tabla estuviera vacía, sembramos de productos
        if (!categorias.Any())
        {
            var distinctFromProds = await _db.Productos
                .Where(p => p.Activo && !string.IsNullOrEmpty(p.Categoria))
                .Select(p => p.Categoria)
                .Distinct()
                .ToListAsync();

            foreach (var nom in distinctFromProds)
            {
                var cod = nom.ToLower().Trim().Replace(" ", "-");
                var cat = new Categoria
                {
                    Codigo = cod,
                    Nombre = nom.Trim(),
                    Icono = IconosDefault.TryGetValue(nom, out var ic) ? ic : "🏷️",
                    Descripcion = $"Categoría {nom}",
                    Activa = true
                };
                _db.Categorias.Add(cat);
                categorias.Add(cat);
            }
            if (categorias.Any())
            {
                await _db.SaveChangesAsync();
            }
        }

        var prodCounts = await _db.Productos
            .Where(p => p.Activo)
            .GroupBy(p => p.Categoria.ToLower())
            .Select(g => new { Categoria = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Categoria, x => x.Count);

        var result = categorias.Select(c =>
        {
            var key = c.Nombre.Trim().ToLower();
            var total = prodCounts.TryGetValue(key, out var cnt) ? cnt : 0;
            return new CategoriaDto
            {
                Id = c.Codigo,
                Nombre = c.Nombre,
                Icono = string.IsNullOrWhiteSpace(c.Icono) ? (IconosDefault.TryGetValue(c.Nombre, out var ic) ? ic : "🏷️") : c.Icono,
                Descripcion = c.Descripcion ?? $"Productos de {c.Nombre}",
                TotalProductos = total,
                Activa = c.Activa
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] GuardarCategoriaRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest(new { message = "El nombre de la categoría es requerido" });

        var nombreTrim = req.Nombre.Trim();
        var codigo = nombreTrim.ToLower().Replace(" ", "-").Replace("á", "a").Replace("é", "e").Replace("í", "i").Replace("ó", "o").Replace("ú", "u");

        var existente = await _db.Categorias.FirstOrDefaultAsync(c => c.Nombre.ToLower() == nombreTrim.ToLower() || c.Codigo == codigo);
        if (existente != null)
        {
            if (!existente.Activa)
            {
                existente.Activa = true;
                if (!string.IsNullOrWhiteSpace(req.Icono)) existente.Icono = req.Icono;
                if (!string.IsNullOrWhiteSpace(req.Descripcion)) existente.Descripcion = req.Descripcion;
                await _db.SaveChangesAsync();
            }
            return StatusCode(200, new CategoriaDto
            {
                Id = existente.Codigo,
                Nombre = existente.Nombre,
                Icono = existente.Icono ?? "🏷️",
                Descripcion = existente.Descripcion,
                TotalProductos = await _db.Productos.CountAsync(p => p.Categoria.ToLower() == existente.Nombre.ToLower() && p.Activo),
                Activa = true
            });
        }

        var iconoFinal = !string.IsNullOrWhiteSpace(req.Icono) 
            ? req.Icono 
            : (IconosDefault.TryGetValue(nombreTrim, out var ic) ? ic : "🏷️");

        var nuevaCat = new Categoria
        {
            Codigo = codigo,
            Nombre = nombreTrim,
            Icono = iconoFinal,
            Descripcion = req.Descripcion ?? $"Categoría {nombreTrim}",
            Activa = true,
            FechaCreacion = DateTime.Now
        };

        _db.Categorias.Add(nuevaCat);
        await _db.SaveChangesAsync();

        return StatusCode(201, new CategoriaDto
        {
            Id = nuevaCat.Codigo,
            Nombre = nuevaCat.Nombre,
            Icono = nuevaCat.Icono ?? "🏷️",
            Descripcion = nuevaCat.Descripcion,
            TotalProductos = 0,
            Activa = true
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] GuardarCategoriaRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre))
            return BadRequest(new { message = "El nombre de la categoría es requerido" });

        var cat = await _db.Categorias.FirstOrDefaultAsync(c => c.Codigo.ToLower() == id.ToLower() || c.Nombre.ToLower() == id.ToLower());
        var nombreTrim = req.Nombre.Trim();

        if (cat != null)
        {
            var nombreAnterior = cat.Nombre;
            cat.Nombre = nombreTrim;
            if (!string.IsNullOrWhiteSpace(req.Icono)) cat.Icono = req.Icono;
            if (req.Descripcion != null) cat.Descripcion = req.Descripcion;

            // Actualizar el nombre de la categoría en todos los productos asociados
            var prods = await _db.Productos.Where(p => p.Categoria.ToLower() == nombreAnterior.ToLower()).ToListAsync();
            foreach (var p in prods)
            {
                p.Categoria = nombreTrim;
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Categoría actualizada correctamente", id = cat.Codigo });
        }
        else
        {
            // Si no estaba en Categorias, actualizar en productos
            var prods = await _db.Productos.Where(p => p.Categoria.ToLower() == id.ToLower()).ToListAsync();
            foreach (var p in prods)
            {
                p.Categoria = nombreTrim;
            }
            if (prods.Any())
            {
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Categoría actualizada correctamente", id = req.Nombre.ToLower().Replace(" ", "-") });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var cat = await _db.Categorias.FirstOrDefaultAsync(c => c.Codigo.ToLower() == id.ToLower() || c.Nombre.ToLower() == id.ToLower());
        var nombreCat = cat?.Nombre ?? id;

        var count = await _db.Productos.CountAsync(p => p.Categoria.ToLower() == nombreCat.ToLower() && p.Activo);
        if (count > 0)
        {
            return BadRequest(new { message = $"No se puede eliminar la categoría porque tiene {count} productos activos asignados." });
        }

        if (cat != null)
        {
            cat.Activa = false;
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Categoría eliminada correctamente", id });
    }
}
