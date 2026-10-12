const fs = require('fs');

let code = fs.readFileSync('backend/RutaVentas.Api/Controllers/ProductosController.cs', 'utf8');

// 1. In GetAll
code = code.replace(
  'Nombre = p.Nombre,',
  'Nombre = p.Nombre,\n                NombreAlmacen = p.NombreAlmacen,'
);

// 2. In GetById
code = code.replace(
  'Nombre = p.Nombre,',
  'Nombre = p.Nombre,\n            NombreAlmacen = p.NombreAlmacen,'
);

// 3. In Create
code = code.replace(
  'Nombre = req.Nombre.Trim(),',
  'Nombre = req.Nombre.Trim(),\n            NombreAlmacen = req.NombreAlmacen?.Trim(),'
);

code = code.replace(
  'Nombre = producto.Nombre,',
  'Nombre = producto.Nombre,\n            NombreAlmacen = producto.NombreAlmacen,'
);

// 4. In Update
code = code.replace(
  'if (!string.IsNullOrWhiteSpace(req.Nombre)) producto.Nombre = req.Nombre.Trim();',
  'if (!string.IsNullOrWhiteSpace(req.Nombre)) producto.Nombre = req.Nombre.Trim();\n        if (req.NombreAlmacen != null) producto.NombreAlmacen = string.IsNullOrWhiteSpace(req.NombreAlmacen) ? null : req.NombreAlmacen.Trim();'
);

fs.writeFileSync('backend/RutaVentas.Api/Controllers/ProductosController.cs', code, 'utf8');
console.log('ProductosController.cs updated with NombreAlmacen');
