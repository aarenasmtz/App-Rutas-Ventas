const fs = require('fs');

let code = fs.readFileSync('backend/RutaVentas.Api/DTOs/ApiDtos.cs', 'utf8');

// 1. Fix DashboardResumenDto
code = code.replace(
  `    public int ClientesVisitados { get; set; }
    public string? Telefono { get; set; }
    public string? Pin { get; set; }
    public PermisosEmpleadoDto Permisos { get; set; } = new();
    public int ClientesTotalRuta { get; set; }`,
  `    public int ClientesVisitados { get; set; }
    public int ClientesTotalRuta { get; set; }`
);

// 2. Fix EmpleadoDetalleDto
const empTarget = `public class EmpleadoDetalleDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public string Estado { get; set; } = "Activo";
    public decimal VentasHoy { get; set; }
    public decimal CobranzaHoy { get; set; }
    public int ClientesVisitados { get; set; }
}`;

const empReplacement = `public class EmpleadoDetalleDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public string Estado { get; set; } = "Activo";
    public decimal VentasHoy { get; set; }
    public decimal CobranzaHoy { get; set; }
    public int ClientesVisitados { get; set; }
    public string? Telefono { get; set; }
    public string? Pin { get; set; }
    public PermisosEmpleadoDto Permisos { get; set; } = new();
}`;

code = code.replace(empTarget, empReplacement);

// 3. Append classes at the end
const extraClasses = `
public class PermisosEmpleadoDto
{
    public bool PuedeVender { get; set; } = true;
    public bool PuedeVerClientes { get; set; } = true;
    public bool PuedeCrearClientes { get; set; } = true;
    public bool PuedeVerProductos { get; set; } = true;
    public bool SoloLecturaInventario { get; set; } = true;
    public bool PuedeCobrar { get; set; } = true;
}

public class GuardarEmpleadoRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Pin { get; set; }
    public string Rol { get; set; } = "Vendedor";
    public string? Ruta { get; set; }
    public string? Telefono { get; set; }
    public bool Activo { get; set; } = true;
    public PermisosEmpleadoDto? Permisos { get; set; }
}

public class SurtidoNotaPdfRequestDto
{
    public string FolioNota { get; set; } = string.Empty;
    public string FechaNota { get; set; } = string.Empty;
    public string Proveedor { get; set; } = "Almacén Central";
    public string? EmpleadoId { get; set; }
    public string? UbicacionDestino { get; set; } = "Camioneta 1";
    public List<ItemSurtidoNotaDto> Items { get; set; } = new();
}

public class ItemSurtidoNotaDto
{
    public string ProductoAlmacen { get; set; } = string.Empty;
    public string? ProductoIdApp { get; set; }
    public string Um { get; set; } = "PZA";
    public decimal CantidadNota { get; set; }
    public string? Equivalencias { get; set; }
    public int PiezasASurtir { get; set; }
    public bool GuardarVinculacion { get; set; } = false;
}
`;

if (!code.includes('public class PermisosEmpleadoDto')) {
  code = code.trimEnd() + '\n' + extraClasses + '\n';
}

fs.writeFileSync('backend/RutaVentas.Api/DTOs/ApiDtos.cs', code, 'utf8');
console.log('Fixed ApiDtos.cs cleanly');
