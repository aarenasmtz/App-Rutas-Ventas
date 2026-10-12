const fs = require('fs');

// 1. Entities.cs
let ent = fs.readFileSync('backend/RutaVentas.Api/Data/Entities/Entities.cs', 'utf8');
if (!ent.includes('public string? NombreAlmacen')) {
  ent = ent.replace(
    'public string Nombre { get; set; } = string.Empty;',
    'public string Nombre { get; set; } = string.Empty;\n\n    [MaxLength(200)]\n    public string? NombreAlmacen { get; set; }'
  );
  fs.writeFileSync('backend/RutaVentas.Api/Data/Entities/Entities.cs', ent, 'utf8');
  console.log('Entities.cs updated with NombreAlmacen');
}

// 2. ApiDtos.cs
let dtos = fs.readFileSync('backend/RutaVentas.Api/DTOs/ApiDtos.cs', 'utf8');
if (!dtos.includes('public string? NombreAlmacen { get; set; } // en GuardarProducto')) {
  dtos = dtos.replace(
    'public class GuardarProductoRequestDto\n{',
    'public class GuardarProductoRequestDto\n{\n    public string? NombreAlmacen { get; set; } // en GuardarProducto'
  );
}
if (!dtos.includes('public string? NombreAlmacen { get; set; } // en ProductoDto')) {
  dtos = dtos.replace(
    'public class ProductoDto\n{',
    'public class ProductoDto\n{\n    public string? NombreAlmacen { get; set; } // en ProductoDto'
  );
}
fs.writeFileSync('backend/RutaVentas.Api/DTOs/ApiDtos.cs', dtos, 'utf8');
console.log('ApiDtos.cs updated with NombreAlmacen');
