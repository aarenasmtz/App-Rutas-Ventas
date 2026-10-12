using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RutaVentas.Api.Data.Entities;

public class Usuario
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string NombreUsuario { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Rol { get; set; } = "Vendedor"; // "Administrador" | "Vendedor"

    [MaxLength(50)]
    public string? RutaAsignada { get; set; }

    public bool Activo { get; set; } = true;

    public string? Telefono { get; set; }

    [MaxLength(10)]
    public string? Pin { get; set; }

    public string? PermisosJson { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.Now;
}

public class Ruta
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Descripcion { get; set; }

    public bool Activa { get; set; } = true;
}

public class Cliente
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Propietario { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string Direccion { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Telefono { get; set; }

    [Required]
    [MaxLength(50)]
    public string Ruta { get; set; } = "Ruta Centro";

    [Column(TypeName = "decimal(18,2)")]
    public decimal Saldo { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal LimiteCredito { get; set; } = 5000;

    [Required]
    [MaxLength(30)]
    public string EstadoVisita { get; set; } = "Pendiente";

    [MaxLength(50)]
    public string? DistanciaMock { get; set; }

    [Required]
    public string DiasVisitaJson { get; set; } = "[\"Lun\",\"Mié\",\"Vie\"]";

    public string? PreciosEspecialesJson { get; set; }

    [MaxLength(100)]
    public string? UltimaCompra { get; set; }

    [MaxLength(100)]
    public string? UltimoPago { get; set; }

    public double? Latitud { get; set; }

    public double? Longitud { get; set; }

    [MaxLength(100)]
    public string? Colonia { get; set; }

    [MaxLength(100)]
    public string? Ciudad { get; set; }

    public bool Activo { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.Now;
}

public class Producto
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? NombreAlmacen { get; set; }

    [MaxLength(100)]
    public string? Marca { get; set; }

    [Required]
    [MaxLength(50)]
    public string Categoria { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Unidad { get; set; } = "pieza";

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioBase { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioCompra { get; set; }

    public int Existencia { get; set; } = 0; // En piezas totales

    [MaxLength(50)]
    public string? Sku { get; set; }

    [MaxLength(50)]
    public string? CodigoBarras { get; set; }

    public bool Favorito { get; set; } = false;

    public bool Activo { get; set; } = true;

    public bool ManejaMultiplesPresentaciones { get; set; } = false;

    public DateTime FechaCreacion { get; set; } = DateTime.Now;

    public List<PresentacionProducto> Presentaciones { get; set; } = new();
}

public class PresentacionProducto
{
    [Key]
    public int Id { get; set; }

    public int ProductoId { get; set; }

    [ForeignKey(nameof(ProductoId))]
    public Producto? Producto { get; set; }

    [Required]
    [MaxLength(30)]
    public string Tipo { get; set; } = "pieza"; // "pieza" | "paquete" | "caja" | "exhibidor"

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public int PiezasEquivalentes { get; set; } = 1;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Precio { get; set; }

    [MaxLength(150)]
    public string? DescripcionEquivalencia { get; set; }

    [MaxLength(50)]
    public string? CodigoBarras { get; set; }

    public bool Activa { get; set; } = true;

    public int Orden { get; set; } = 1;
}

public class Venta
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Folio { get; set; } = string.Empty;

    public int ClienteId { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente? Cliente { get; set; }

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DescuentoTotal { get; set; } = 0;

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Completada";

    public DateTime FechaHora { get; set; } = DateTime.Now;

    public List<VentaDetalle> Detalles { get; set; } = new();

    public List<Pago> Pagos { get; set; } = new();
}

public class VentaDetalle
{
    [Key]
    public int Id { get; set; }

    public int VentaId { get; set; }

    [ForeignKey(nameof(VentaId))]
    public Venta? Venta { get; set; }

    public int ProductoId { get; set; }

    [ForeignKey(nameof(ProductoId))]
    public Producto? Producto { get; set; }

    [Required]
    [MaxLength(30)]
    public string PresentacionTipo { get; set; } = "pieza";

    public int CantidadPresentaciones { get; set; }

    public int PiezasTotales { get; set; }

    public int FactorConversion { get; set; } = 1;

    [MaxLength(100)]
    public string? PresentacionNombre { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Subtotal { get; set; }
}

public class Pago
{
    [Key]
    public int Id { get; set; }

    public int VentaId { get; set; }

    [ForeignKey(nameof(VentaId))]
    public Venta? Venta { get; set; }

    [Required]
    [MaxLength(30)]
    public string Metodo { get; set; } = "Efectivo"; // "Efectivo" | "Transferencia" | "Tarjeta" | "Crédito"

    [Column(TypeName = "decimal(18,2)")]
    public decimal Monto { get; set; }

    public DateTime FechaHora { get; set; } = DateTime.Now;
}

public class AbonoCobranza
{
    [Key]
    public int Id { get; set; }

    public int ClienteId { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente? Cliente { get; set; }

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Monto { get; set; }

    [Required]
    [MaxLength(30)]
    public string MetodoPago { get; set; } = "Efectivo";

    [MaxLength(250)]
    public string? Comentario { get; set; }

    public DateTime FechaHora { get; set; } = DateTime.Now;
}

public class InventarioMovimiento
{
    [Key]
    public int Id { get; set; }

    public int ProductoId { get; set; }

    [ForeignKey(nameof(ProductoId))]
    public Producto? Producto { get; set; }

    [Required]
    [MaxLength(30)]
    public string TipoMovimiento { get; set; } = "Venta";

    [Required]
    [MaxLength(50)]
    public string Ubicacion { get; set; } = "Camioneta 1";

    public int Piezas { get; set; } // Puede ser positivo o negativo

    [MaxLength(200)]
    public string? Motivo { get; set; }

    public DateTime FechaHora { get; set; } = DateTime.Now;
}

public class AuditoriaInventario
{
    [Key]
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(50)]
    public string Ruta { get; set; } = "Ruta Centro";

    public DateTime FechaRevision { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Pendiente"; // "Pendiente" | "Autorizado"

    public string? Observaciones { get; set; }

    public List<AuditoriaInventarioDetalle> Detalles { get; set; } = new();
}

public class AuditoriaInventarioDetalle
{
    [Key]
    public int Id { get; set; }

    public int AuditoriaId { get; set; }

    [ForeignKey(nameof(AuditoriaId))]
    public AuditoriaInventario? Auditoria { get; set; }

    public int ProductoId { get; set; }

    [ForeignKey(nameof(ProductoId))]
    public Producto? Producto { get; set; }

    public int CantidadSistema { get; set; }

    public int CantidadFisica { get; set; }

    public int Diferencia { get; set; }

    [MaxLength(250)]
    public string? Comentario { get; set; }

    public bool Revisado { get; set; } = false;
}

public class CorteCaja
{
    [Key]
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    public DateOnly FechaJornada { get; set; } = DateOnly.FromDateTime(DateTime.Today);

    [Required]
    [MaxLength(50)]
    public string Ruta { get; set; } = "Ruta Centro";

    [Column(TypeName = "decimal(18,2)")]
    public decimal VentasTotales { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Efectivo { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Transferencias { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Tarjetas { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Credito { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal CobranzaAbonos { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Gastos { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Devoluciones { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EfectivoEsperado { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EfectivoContado { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiferenciaCaja { get; set; }

    public int InventarioInicialPiezas { get; set; }

    public int InventarioActualPiezas { get; set; }

    public int PiezasVendidas { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Cerrado";
}

public class GastoOperativo
{
    [Key]
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [Required]
    [MaxLength(50)]
    public string Concepto { get; set; } = "Gasolina";

    [Column(TypeName = "decimal(18,2)")]
    public decimal Importe { get; set; }

    [Required]
    [MaxLength(30)]
    public string MetodoPago { get; set; } = "Efectivo";

    [MaxLength(250)]
    public string? Observaciones { get; set; }

    public DateTime FechaHora { get; set; } = DateTime.Now;
}

public class Devolucion
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Folio { get; set; } = string.Empty;

    public int ClienteId { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente? Cliente { get; set; }

    public int UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    public int ProductoId { get; set; }

    [ForeignKey(nameof(ProductoId))]
    public Producto? Producto { get; set; }

    public int Cantidad { get; set; }

    [Required]
    [MaxLength(30)]
    public string PresentacionTipo { get; set; } = "pieza";

    [Column(TypeName = "decimal(18,2)")]
    public decimal PrecioUnitario { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Total { get; set; }

    [Required]
    [MaxLength(100)]
    public string Motivo { get; set; } = "Caducado";

    [Required]
    [MaxLength(50)]
    public string Destino { get; set; } = "Merma"; // "Inventario" | "Merma"

    [Required]
    [MaxLength(50)]
    public string MetodoReembolso { get; set; } = "SaldoAFavor"; // "SaldoAFavor" | "Efectivo" | "CambioFisico"

    [MaxLength(250)]
    public string? Observaciones { get; set; }

    public DateTime FechaHora { get; set; } = DateTime.Now;
}

public class BitacoraEvento
{
    [Key]
    public int Id { get; set; }

    public DateTime FechaHora { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string Tipo { get; set; } = "Actividad"; // "Actividad" | "Error" | "Seguridad" | "Sincronizacion"

    [Required]
    [MaxLength(50)]
    public string Modulo { get; set; } = "Sistema"; // "Ventas" | "Cobranza" | "Inventario" | "Cortes" | "Auth" | "Sync" | "Impresion"

    [Required]
    [MaxLength(250)]
    public string Accion { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string UsuarioNombre { get; set; } = "Sistema";

    public int? UsuarioId { get; set; }

    [ForeignKey(nameof(UsuarioId))]
    public Usuario? Usuario { get; set; }

    [MaxLength(100)]
    public string? Dispositivo { get; set; }

    public string? Detalle { get; set; }

    [Required]
    [MaxLength(30)]
    public string Estado { get; set; } = "Exitoso"; // "Exitoso" | "Advertencia" | "Error"
}

public class Categoria
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Icono { get; set; } = "🏷️";

    [MaxLength(250)]
    public string? Descripcion { get; set; }

    public bool Activa { get; set; } = true;

    public DateTime FechaCreacion { get; set; } = DateTime.Now;
}
