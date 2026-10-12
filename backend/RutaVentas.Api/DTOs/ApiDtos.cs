namespace RutaVentas.Api.DTOs;

// ==========================================
// 1. Auth DTOs
// ==========================================
public class LoginRequestDto
{
    public string Usuario { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? DispositivoId { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public EmpleadoDto Usuario { get; set; } = new();
}

public class EmpleadoDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? NombreAlmacen { get; set; }
    public string Rol { get; set; } = string.Empty; // "Administrador" | "Vendedor"
    public string RutaId { get; set; } = string.Empty;
    public string RutaNombre { get; set; } = string.Empty;
}

// ==========================================
// 2. Dashboard DTOs
// ==========================================
public class DashboardResumenDto
{
    public decimal VentasHoy { get; set; }
    public decimal CobranzaHoy { get; set; }
    public decimal CreditoColocadoHoy { get; set; }
    public decimal EfectivoEnCaja { get; set; }
    public int ClientesVisitados { get; set; }
    public int ClientesTotalRuta { get; set; }
    public int TotalPiezasVendidas { get; set; }
    public ClienteProximoDto? ClienteCercano { get; set; }
}

public class ClienteProximoDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Propietario { get; set; } = string.Empty;
    public decimal Saldo { get; set; }
    public double DistanciaMetros { get; set; }
}

// ==========================================
// 3. Productos y Presentaciones DTOs
// ==========================================
public class ProductoDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? NombreAlmacen { get; set; } // Almacen alias
    public string? Marca { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Unidad { get; set; } = "pieza";
    public bool PrecioPorPeso { get; set; }
    public decimal PrecioBase { get; set; }
    public decimal? PrecioCompra { get; set; }
    public int ExistenciaPiezas { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string CodigoBarras { get; set; } = string.Empty;
    public bool Favorito { get; set; }
    public bool Activo { get; set; }
    public bool ManejaMultiplesPresentaciones { get; set; }
    public List<PresentacionConfigDto> Presentaciones { get; set; } = new();
}

public class PresentacionConfigDto
{
    public string Tipo { get; set; } = string.Empty; // "pieza" | "paquete" | "caja" | "exhibidor"
    public string Nombre { get; set; } = string.Empty;
    public int PiezasEquivalentes { get; set; }
    public decimal Precio { get; set; }
    public string? DescripcionEquivalencia { get; set; }
    public string? CodigoBarras { get; set; }
    public bool Activa { get; set; } = true;
    public int Orden { get; set; } = 1;
}

// ==========================================
// 4. Ventas DTOs
// ==========================================
public class RegistrarVentaRequestDto
{
    public string ClienteId { get; set; } = string.Empty;
    public string EmpleadoId { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public List<LineaVentaRequestDto> Items { get; set; } = new();
    public List<PagoRequestDto> Pagos { get; set; } = new();
}

public class LineaVentaRequestDto
{
    public string ProductoId { get; set; } = string.Empty;
    public string PresentacionTipo { get; set; } = string.Empty;
    public int CantidadPresentaciones { get; set; }
    public int PiezasTotalesCalculadas { get; set; }
    public int FactorConversion { get; set; } = 1;
    public string? PresentacionNombre { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

public class PagoRequestDto
{
    public string Metodo { get; set; } = string.Empty; // "Efectivo" | "Transferencia" | "Tarjeta" | "Crédito"
    public decimal Monto { get; set; }
}

public class VentaRegistradaResponseDto
{
    public string Folio { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
    public decimal TotalVenta { get; set; }
    public decimal TotalPagado { get; set; }
    public decimal CreditoOtorgado { get; set; }
    public decimal NuevoSaldoCliente { get; set; }
    public string Estado { get; set; } = "Completada";
}

// ==========================================
// 5. Clientes y Cobranza DTOs
// ==========================================
public class ClienteDetalleDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Propietario { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public List<string> DiasVisita { get; set; } = new();
    public decimal Saldo { get; set; }
    public decimal LimiteCredito { get; set; }
    public string EstadoVisita { get; set; } = string.Empty;
    public string? DistanciaMock { get; set; }
    public string? UltimaCompra { get; set; }
    public string? UltimoPago { get; set; }
    public Dictionary<string, decimal>? PreciosEspeciales { get; set; }
}

public class RegistrarAbonoRequestDto
{
    public string ClienteId { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string MetodoPago { get; set; } = "Efectivo"; // "Efectivo" | "Transferencia"
    public string? Comentario { get; set; }
    public string? EmpleadoId { get; set; }
}

public class AbonoRegistradoResponseDto
{
    public int Id { get; set; }
    public string ClienteId { get; set; } = string.Empty;
    public decimal MontoAbonado { get; set; }
    public decimal NuevoSaldo { get; set; }
    public DateTime FechaHora { get; set; }
    public string Mensaje { get; set; } = "Abono registrado con éxito";
}

// ==========================================
// 6. Inventario DTOs
// ==========================================
public class InventarioUbicacionDto
{
    public string UbicacionId { get; set; } = string.Empty;
    public string UbicacionNombre { get; set; } = string.Empty;
    public int TotalPiezas { get; set; }
    public int TotalStockBajo { get; set; }
    public int TotalAgotados { get; set; }
    public List<ItemInventarioDto> Items { get; set; } = new();
}

public class ItemInventarioDto
{
    public string ProductoId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Unidad { get; set; } = "pieza";
    public bool ManejaMultiplesPresentaciones { get; set; }
    public int ExistenciaPiezas { get; set; }
    public decimal PrecioBase { get; set; }
    public string EstadoStock { get; set; } = string.Empty; // "Normal" | "Bajo" | "Agotado"
    public List<PresentacionConfigDto> Presentaciones { get; set; } = new();
}

public class TransferenciaInventarioDto
{
    public string OrigenId { get; set; } = "Bodega";
    public string DestinoId { get; set; } = string.Empty;
    public List<ItemTransferenciaDto> Lotes { get; set; } = new();
}

public class ItemTransferenciaDto
{
    public string ProductoId { get; set; } = string.Empty;
    public int Piezas { get; set; }
}

// ==========================================
// 7. Cortes de Caja DTOs
// ==========================================
public class CorteTrabajadorDto
{
    public string EmpleadoId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Ruta { get; set; } = string.Empty;
    public decimal VentasTotales { get; set; }
    public decimal Efectivo { get; set; }
    public decimal Transferencias { get; set; }
    public decimal Tarjetas { get; set; }
    public decimal Credito { get; set; }
    public decimal AbonosCobranza { get; set; }
    public decimal Gastos { get; set; }
    public decimal Devoluciones { get; set; }
    public decimal EfectivoEsperado { get; set; }
    public decimal DiferenciaCaja { get; set; }
    public int InventarioInicialPiezas { get; set; }
    public int InventarioActualPiezas { get; set; }
    public int PiezasVendidas { get; set; }
}

// ==========================================
// 8. Revisión Rápida de Inventario DTOs
// ==========================================
public class RevisionItemDto
{
    public string ProductoId { get; set; } = string.Empty;
    public string ProductoNombre { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public int Sistema { get; set; }
    public int Fisico { get; set; }
    public int Diferencia { get; set; }
    public bool Revisado { get; set; }
    public string Comentario { get; set; } = string.Empty;
}

public class AutorizarAjusteInventarioDto
{
    public string EmpleadoId { get; set; } = string.Empty;
    public DateTime FechaRevision { get; set; }
    public List<AjusteItemDto> Ajustes { get; set; } = new();
}

public class AjusteItemDto
{
    public string ProductoId { get; set; } = string.Empty;
    public int CantidadSistema { get; set; }
    public int CantidadFisica { get; set; }
    public int Diferencia { get; set; }
    public string Motivo { get; set; } = string.Empty;
}

// ==========================================
// 9. Gastos Operativos DTOs (Fase 3)
// ==========================================
public class RegistrarGastoRequestDto
{
    public string EmpleadoId { get; set; } = string.Empty;
    public string Concepto { get; set; } = "Gasolina"; // Gasolina, Comida, Estacionamiento, Mantenimiento, Otro
    public decimal Importe { get; set; }
    public string MetodoPago { get; set; } = "Efectivo";
    public string? Observaciones { get; set; }
}

public class GastoDto
{
    public int Id { get; set; }
    public string EmpleadoId { get; set; } = string.Empty;
    public string EmpleadoNombre { get; set; } = string.Empty;
    public string Concepto { get; set; } = string.Empty;
    public decimal Importe { get; set; }
    public string MetodoPago { get; set; } = "Efectivo";
    public string? Observaciones { get; set; }
    public DateTime FechaHora { get; set; }
}

// ==========================================
// 10. Devoluciones DTOs (Fase 3)
// ==========================================
public class RegistrarDevolucionRequestDto
{
    public string ClienteId { get; set; } = string.Empty;
    public string EmpleadoId { get; set; } = string.Empty;
    public string ProductoId { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public string PresentacionTipo { get; set; } = "pieza";
    public decimal PrecioUnitario { get; set; }
    public decimal Total { get; set; }
    public string Motivo { get; set; } = "Caducado";
    public string Destino { get; set; } = "Merma"; // "Merma" | "Inventario"
    public string MetodoReembolso { get; set; } = "SaldoAFavor"; // "SaldoAFavor" | "Efectivo" | "CambioFisico"
    public string? Observaciones { get; set; }
}

public class DevolucionDto
{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;
    public string ProductoId { get; set; } = string.Empty;
    public string ProductoNombre { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public string PresentacionTipo { get; set; } = "pieza";
    public decimal Total { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string Destino { get; set; } = string.Empty;
    public string MetodoReembolso { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
}

// ==========================================
// 11. Cierre de Jornada y Carga (Fase 3)
// ==========================================
public class CerrarCorteCajaRequestDto
{
    public string EmpleadoId { get; set; } = string.Empty;
    public decimal EfectivoContado { get; set; }
    public string? Observaciones { get; set; }
}

public class ConfirmarCargaInicialRequestDto
{
    public string EmpleadoId { get; set; } = string.Empty;
    public string UbicacionDestino { get; set; } = "Camioneta 1";
    public List<ItemTransferenciaDto> Lotes { get; set; } = new();
}

// ==========================================
// 12. Reportes Ejecutivos y Exportación (Fase 4)
// ==========================================
public class ReporteResumenDto
{
    public string Periodo { get; set; } = "Día";
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal VentasTotales { get; set; }
    public decimal CobranzaTotal { get; set; }
    public decimal CreditoColocado { get; set; }
    public decimal GastosTotal { get; set; }
    public decimal UtilidadEstimada { get; set; }
    public decimal TicketPromedio { get; set; }
    public int PedidosTotal { get; set; }
    public int ClientesVisitados { get; set; }
    public int ClientesTotalRuta { get; set; }
    public decimal EfectividadVisitas { get; set; }
    public List<TopProductoReporteDto> TopProductos { get; set; } = new();
    public MetodosPagoReporteDto MetodosPago { get; set; } = new();
}

public class TopProductoReporteDto
{
    public string ProductoId { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public int CantidadVendida { get; set; }
    public decimal ImporteTotal { get; set; }
}

public class MetodosPagoReporteDto
{
    public decimal Efectivo { get; set; }
    public decimal Transferencia { get; set; }
    public decimal Tarjeta { get; set; }
    public decimal Credito { get; set; }
}

// ==========================================
// 13. Sincronización Offline Bidireccional (Fase 5)
// ==========================================
public class SyncBatchRequestDto
{
    public string DispositivoId { get; set; } = string.Empty;
    public string EmpleadoId { get; set; } = string.Empty;
    public DateTime FechaEnvio { get; set; } = DateTime.Now;
    public List<SyncOperationItemDto> Operaciones { get; set; } = new();
}

public class SyncOperationItemDto
{
    public string Id { get; set; } = string.Empty; // UUID del cliente
    public string Tipo { get; set; } = string.Empty; // "Venta", "Abono", "Gasto", "Devolucion"
    public string IdempotencyKey { get; set; } = string.Empty;
    public DateTime FechaGeneracion { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
}

public class SyncBatchResponseDto
{
    public bool Exitoso { get; set; } = true;
    public int TotalRecibidas { get; set; }
    public int SincronizadasCorrectas { get; set; }
    public int DuplicadasOmitidas { get; set; }
    public int ConError { get; set; }
    public List<SyncOperationResultDto> Resultados { get; set; } = new();
    public DateTime TimestampServidor { get; set; } = DateTime.Now;
}

public class SyncOperationResultDto
{
    public string Id { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public string Estado { get; set; } = "Sincronizado"; // "Sincronizado", "DuplicadoOmitido", "Error"
    public string? Mensaje { get; set; }
    public string? FolioAsignado { get; set; }
}

public class SyncPullCatalogResponseDto
{
    public DateTime TimestampGeneracion { get; set; } = DateTime.Now;
    public List<ProductoDto> Productos { get; set; } = new();
    public List<ClienteDetalleDto> Clientes { get; set; } = new();
}

// ==========================================
// 14. Auditoría y Bitácora del Sistema (Fase 6)
// ==========================================
public class BitacoraEventoDto
{
    public int Id { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string Hora { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; }
    public string Tipo { get; set; } = string.Empty; // "Actividad" | "Error" | "Seguridad" | "Sincronizacion"
    public string Modulo { get; set; } = string.Empty; // "Ventas" | "Cobranza" | "Inventario" | "Cortes" | "Auth" | "Sync" | "Impresion"
    public string Accion { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string? Dispositivo { get; set; }
    public string? Detalle { get; set; }
    public string Estado { get; set; } = "Exitoso";
}

public class RegistrarBitacoraRequestDto
{
    public string Tipo { get; set; } = "Actividad";
    public string Modulo { get; set; } = "Sistema";
    public string Accion { get; set; } = string.Empty;
    public string? UsuarioNombre { get; set; }
    public int? UsuarioId { get; set; }
    public string? Dispositivo { get; set; }
    public string? Detalle { get; set; }
    public string Estado { get; set; } = "Exitoso";
}

public class EmpleadoDetalleDto
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
}

// ==========================================
// 14. ABC (CRUD) Request DTOs
// ==========================================
public class GuardarClienteRequestDto
{
    public string? Codigo { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Propietario { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string? Colonia { get; set; }
    public string? Ciudad { get; set; }
    public string? Telefono { get; set; }
    public string Ruta { get; set; } = "Ruta Centro";
    public List<string> DiasVisita { get; set; } = new() { "Lun", "Mié", "Vie" };
    public decimal LimiteCredito { get; set; } = 5000;
    public decimal Saldo { get; set; } = 0;
    public string? DistanciaMock { get; set; }
    public Dictionary<string, decimal>? PreciosEspeciales { get; set; }
}

public class GuardarProductoRequestDto
{
    public string? NombreAlmacen { get; set; } // en GuardarProducto
    public string? Codigo { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string Categoria { get; set; } = "Jamón";
    public string Unidad { get; set; } = "kg";
    public decimal PrecioBase { get; set; }
    public decimal? PrecioCompra { get; set; }
    public int ExistenciaPiezas { get; set; }
    public string? Sku { get; set; }
    public string? CodigoBarras { get; set; }
    public bool Favorito { get; set; } = false;
    public bool ManejaMultiplesPresentaciones { get; set; } = false;
    public List<PresentacionConfigDto>? Presentaciones { get; set; }
}

public class CategoriaDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Icono { get; set; } = "🏷️";
    public string? Descripcion { get; set; }
    public int TotalProductos { get; set; }
    public bool Activa { get; set; } = true;
}

public class GuardarCategoriaRequestDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Icono { get; set; } = "🏷️";
    public string? Descripcion { get; set; }
}

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
    public int? ProductoId { get; set; }
    public string Um { get; set; } = "PZA";
    public decimal CantidadNota { get; set; }
    public string? Equivalencias { get; set; }
    public decimal PiezasASurtir { get; set; }
    public decimal PiezasCalculadas { get; set; }
    public bool GuardarVinculacion { get; set; } = false;
    public bool RecordarVinculacion { get; set; } = false;
}

