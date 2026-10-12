const fs = require('fs');

let code = fs.readFileSync('backend/RutaVentas.Api/Controllers/InventarioController.cs', 'utf8');

const surtidoEndpoint = `
    [HttpPost("surtido-nota")]
    public async Task<IActionResult> SurtirNotaPdf([FromBody] SurtidoNotaPdfRequestDto req)
    {
        if (req.Items == null || !req.Items.Any())
        {
            return BadRequest(new { message = "La nota no contiene productos para surtir" });
        }

        var ubicacion = req.UbicacionDestino ?? "Camioneta 1";
        using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            int totalPiezasSurtidas = 0;
            int productosActualizados = 0;

            foreach (var item in req.Items)
            {
                if (item.PiezasASurtir <= 0) continue;

                Data.Entities.Producto? prod = null;
                if (!string.IsNullOrWhiteSpace(item.ProductoIdApp))
                {
                    prod = await _db.Productos.FirstOrDefaultAsync(p => p.Codigo == item.ProductoIdApp || p.Id.ToString() == item.ProductoIdApp);
                }

                if (prod == null && !string.IsNullOrWhiteSpace(item.ProductoAlmacen))
                {
                    var nomAlm = item.ProductoAlmacen.Trim().ToLower();
                    prod = await _db.Productos.FirstOrDefaultAsync(p => 
                        (p.NombreAlmacen != null && p.NombreAlmacen.ToLower() == nomAlm) ||
                        p.Nombre.ToLower() == nomAlm);
                }

                if (prod != null)
                {
                    prod.Existencia += item.PiezasASurtir;
                    totalPiezasSurtidas += item.PiezasASurtir;
                    productosActualizados++;

                    if (item.GuardarVinculacion && !string.IsNullOrWhiteSpace(item.ProductoAlmacen))
                    {
                        prod.NombreAlmacen = item.ProductoAlmacen.Trim();
                    }

                    _db.InventarioMovimientos.Add(new InventarioMovimiento
                    {
                        ProductoId = prod.Id,
                        TipoMovimiento = "SurtidoAlmacenPDF",
                        Ubicacion = ubicacion,
                        Piezas = item.PiezasASurtir,
                        Motivo = $"Surtido nota #{req.FolioNota} ({req.FechaNota}) - {item.ProductoAlmacen} ({item.CantidadNota} {item.Um})",
                        FechaHora = DateTime.Now
                    });
                }
            }

            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return Ok(new
            {
                message = $"Nota #{req.FolioNota} procesada con éxito: {totalPiezasSurtidas} piezas surtidas en {productosActualizados} productos.",
                folio = req.FolioNota,
                totalPiezas = totalPiezasSurtidas,
                productosSurtidos = productosActualizados
            });
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            return StatusCode(500, new { message = "Error al registrar surtido de nota", detalle = ex.Message });
        }
    }
}
`;

// Replace last closing brace
const lastBraceIdx = code.lastIndexOf('}');
if (lastBraceIdx !== -1) {
  code = code.substring(0, lastBraceIdx) + surtidoEndpoint;
  fs.writeFileSync('backend/RutaVentas.Api/Controllers/InventarioController.cs', code, 'utf8');
  console.log('InventarioController.cs updated with surtido-nota endpoint');
} else {
  console.error('Closing brace not found');
}
