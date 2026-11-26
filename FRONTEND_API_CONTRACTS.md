# ESPECIFICACIÓN DE CONTRATOS API Y DTOs
## Sistema de Ventas en Ruta de Miguel
### Backend ASP.NET Core 9 y Base de Datos SQL Server (`RutaVentasDb`)

Este documento define la totalidad de los contratos HTTP, modelos DTO (Request/Response), endpoints RESTful y códigos de estado implementados en el backend .NET 9 (`backend/RutaVentas.Api`) y consumidos por el frontend (`services/httpApiService.ts` y fachada `DataService`).

---

## 1. Módulo de Autenticación y Perfil (`AuthController`)

### `POST /api/v1/auth/login`
- **Pantalla:** `app/login.tsx`
- **Descripción:** Inicio de sesión con credenciales y retorno de token JWT con rol del operador (Administrador o Vendedor) y ruta asignada.
- **Request DTO (`LoginRequestDto`):**
  ```csharp
  public class LoginRequestDto
  {
      public string Usuario { get; set; } = string.Empty;
      public string Password { get; set; } = string.Empty;
      public string? DispositivoId { get; set; }
  }
  ```
- **Response DTO (`LoginResponseDto`):**
  ```csharp
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
  ```
- **Códigos de Estado:**
  - `200 OK`: Autenticación exitosa.
  - `401 Unauthorized`: Credenciales inválidas.
  - `403 Forbidden`: Usuario inactivo.

---

## 2. Módulo de Home / Dashboard (`DashboardController`)

### `GET /api/v1/dashboard/resumen?rutaId={rutaId}`
- **Pantalla:** `app/(tabs)/index.tsx`
- **Descripción:** Indicadores clave del día (KPIs) para la camioneta/vendedor o consolidados para el administrador.
- **Response DTO (`DashboardResumenDto`):**
  ```csharp
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
  ```

---

## 3. Módulo de Productos y Catálogo (`ProductosController`)

### `GET /api/v1/productos?categoria={cat}&search={q}&activo=true`
- **Pantallas:** `app/(tabs)/venta/index.tsx`, `app/(tabs)/mas/productos.tsx`
- **Descripción:** Catálogo con multipresentaciones, alias de almacén y factores de conversión de piezas.
- **Response DTO (`List<ProductoDto>`):**
  ```csharp
  public class ProductoDto
  {
      public string Id { get; set; } = string.Empty;
      public string Nombre { get; set; } = string.Empty;
      public string? NombreAlmacen { get; set; }
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
      public string EstadoConfiguracion { get; set; } = "Completo"; // "Completo" | "Pendiente"
      public string? CodigoOrigen { get; set; }
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
  ```

### `POST /api/v1/productos` / `PUT /api/v1/productos/{id}`
- **Request DTO (`GuardarProductoRequestDto`):**
  ```csharp
  public class GuardarProductoRequestDto
  {
      public string? NombreAlmacen { get; set; }
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
      public string? EstadoConfiguracion { get; set; }
      public string? CodigoOrigen { get; set; }
      public bool ManejaMultiplesPresentaciones { get; set; } = false;
      public List<PresentacionConfigDto>? Presentaciones { get; set; }
  }
  ```

---

## 4. Módulo de Ventas y Cobro (`VentasController`)

### `POST /api/v1/ventas`
- **Pantalla:** `app/(tabs)/venta/carrito.tsx` / `pago.tsx`
- **Descripción:** Registro transaccional de venta, descuento de existencias en unidades base (con precisión decimal para pesaje en báscula) y actualización del saldo del cliente si hubo crédito o sobregiro autorizado.
- **Request DTO (`RegistrarVentaRequestDto`):**
  ```csharp
  public class RegistrarVentaRequestDto
  {
      public string ClienteId { get; set; } = string.Empty;
      public string EmpleadoId { get; set; } = string.Empty;
      public decimal Total { get; set; }
      public List<LineaVentaRequestDto> Items { get; set; } = new();
      public List<PagoRequestDto> Pagos { get; set; } = new();
      public string? TokenAutorizacionSobregiro { get; set; }
  }

  public class LineaVentaRequestDto
  {
      public string ProductoId { get; set; } = string.Empty;
      public string PresentacionTipo { get; set; } = string.Empty;
      public decimal CantidadPresentaciones { get; set; } // Admite fracciones ej. 0.450 kg
      public decimal PiezasTotalesCalculadas { get; set; }
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
  ```
- **Response DTO (`VentaRegistradaResponseDto`):**
  ```csharp
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
  ```

### `POST /api/v1/ventas/solicitar-sobregiro`
- **Pantalla:** `app/(tabs)/venta/pago.tsx`
- **Descripción:** El chofer solicita autorización remota a Don Miguel para realizar una venta que excede el límite de crédito del cliente.
- **Request DTO (`SolicitarSobregiroRequestDto`):**
  ```csharp
  public class SolicitarSobregiroRequestDto
  {
      public string ClienteId { get; set; } = string.Empty;
      public string EmpleadoId { get; set; } = string.Empty;
      public decimal MontoSolicitado { get; set; }
      public string? Motivo { get; set; }
  }
  ```
- **Response DTO:**
  ```json
  {
    "tokenSolicitud": "415e8f5a59fa4b828d40eab7ac08b256",
    "mensaje": "Solicitud de sobregiro registrada como pendiente.",
    "estado": "Pendiente"
  }
  ```

### `GET /api/v1/ventas/solicitudes-sobregiro?estado={estado}`
- **Pantalla:** `app/(tabs)/mas/creditos.tsx`
- **Descripción:** Don Miguel consulta solicitudes de sobregiro activas o históricas.
- **Response DTO (`List<SolicitudSobregiroDto>`):**
  ```csharp
  public class SolicitudSobregiroDto
  {
      public int Id { get; set; }
      public string TokenSolicitud { get; set; } = string.Empty;
      public string ClienteId { get; set; } = string.Empty;
      public string ClienteNombre { get; set; } = string.Empty;
      public string ChoferNombre { get; set; } = string.Empty;
      public decimal SaldoActual { get; set; }
      public decimal LimiteCredito { get; set; }
      public decimal MontoSolicitado { get; set; }
      public string Motivo { get; set; } = string.Empty;
      public string Estado { get; set; } = string.Empty; // "Pendiente" | "Autorizada" | "Rechazada"
      public DateTime FechaSolicitud { get; set; }
      public string? TokenAutorizacion { get; set; }
  }
  ```

### `POST /api/v1/ventas/resolver-sobregiro`
- **Pantalla:** `app/(tabs)/mas/creditos.tsx`
- **Descripción:** Don Miguel autoriza o rechaza una solicitud de sobregiro desde su dispositivo.
- **Request DTO (`ResolverSobregiroRequestDto`):**
  ```csharp
  public class ResolverSobregiroRequestDto
  {
      public string TokenSolicitud { get; set; } = string.Empty;
      public bool Autorizado { get; set; }
      public string? AdminId { get; set; }
      public string? MotivoResolucion { get; set; }
  }
  ```
- **Response DTO:**
  ```json
  {
    "message": "Sobregiro autorizado exitosamente",
    "estado": "Autorizada",
    "tokenAutorizacion": "AUTH-984103"
  }
  ```

### `GET /api/v1/ventas/consultar-sobregiro/{token}`
- **Pantalla:** `app/(tabs)/venta/pago.tsx`
- **Descripción:** El chofer consulta periódicamente si su solicitud ya fue resuelta por Don Miguel para desbloquear la venta.
- **Response DTO:**
  ```json
  {
    "tokenSolicitud": "415e8f5a59fa4b828d40eab7ac08b256",
    "estado": "Autorizada",
    "tokenAutorizacion": "AUTH-984103"
  }
  ```

---

## 5. Módulo de Clientes y Cartera (`ClientesController`)

### `GET /api/v1/clientes?ruta={ruta}&filtro={filtro}`
- **Pantalla:** `app/(tabs)/clientes.tsx`
- **Response DTO (`List<ClienteDetalleDto>`):**
  ```csharp
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
      public double? Latitud { get; set; }
      public double? Longitud { get; set; }
      public string? Colonia { get; set; }
      public string? Ciudad { get; set; }
      public Dictionary<string, decimal>? PreciosEspeciales { get; set; }
  }
  ```

---

## 6. Módulo de Cobranza y Abonos (`CobranzaController`)

### `POST /api/v1/cobranza/abonos`
- **Pantallas:** `app/(tabs)/mas/cobranza.tsx`, `app/(tabs)/clientes.tsx`
- **Request DTO (`RegistrarAbonoRequestDto`):**
  ```csharp
  public class RegistrarAbonoRequestDto
  {
      public string ClienteId { get; set; } = string.Empty;
      public decimal Monto { get; set; }
      public string MetodoPago { get; set; } = "Efectivo"; // "Efectivo" | "Transferencia"
      public string? Comentario { get; set; }
      public string? EmpleadoId { get; set; }
  }
  ```
- **Response DTO (`AbonoRegistradoResponseDto`):**
  ```csharp
  public class AbonoRegistradoResponseDto
  {
      public int Id { get; set; }
      public string ClienteId { get; set; } = string.Empty;
      public decimal MontoAbonado { get; set; }
      public decimal NuevoSaldo { get; set; }
      public DateTime FechaHora { get; set; }
      public string Mensaje { get; set; } = "Abono registrado con éxito";
  }
  ```

---

## 7. Módulo de Inventario y Surtido (`InventarioController`)

### `GET /api/v1/inventario?ubicacion={ubicacion}&usuarioId={usuarioId}`
- **Pantalla:** `app/(tabs)/inventario.tsx`
- **Descripción:** Consulta del catálogo de existencias físicas segmentadas por ubicación (`Bodega` vs `Camioneta 1`). Soporta existencias fraccionarias decimales (`DECIMAL(18,3)`).
- **Response DTO (`List<InventarioItemDto>`):**
  ```csharp
  public class InventarioItemDto
  {
      public int ProductoId { get; set; }
      public string Codigo { get; set; } = string.Empty;
      public string Nombre { get; set; } = string.Empty;
      public string Unidad { get; set; } = "pza";
      public decimal Existencia { get; set; } // Admite decimales para pesaje en báscula
      public string Ubicacion { get; set; } = "Bodega";
      public decimal PrecioBase { get; set; }
      public List<PresentacionInventarioDto> Presentaciones { get; set; } = new();
  }
  ```

### `POST /api/v1/inventario/surtido-nota`
- **Pantalla:** `app/(tabs)/mas/surtido-nota.tsx`
- **Descripción:** Recepción masiva de existencias extraídas por el parser PDF de bodega central.
- **Request DTO (`SurtidoNotaPdfRequestDto`):**
  ```csharp
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
  ```

### `POST /api/v1/inventario/confirmar-carga-inicial`
- **Pantalla:** `app/(tabs)/mas/carga.tsx`
- **Descripción:** Verificación de camioneta. Si `EsEntradaMercancia == false`, genera auditoría sin alterar stock; si es `true`, incrementa existencia.
- **Request DTO (`ConfirmarCargaInicialRequestDto`):**
  ```csharp
  public class ConfirmarCargaInicialRequestDto
  {
      public string EmpleadoId { get; set; } = string.Empty;
      public string UbicacionDestino { get; set; } = "Camioneta 1";
      public bool EsEntradaMercancia { get; set; } = false;
      public List<ItemTransferenciaDto> Lotes { get; set; } = new();
  }
  ```

---

## 8. Módulo de Cortes de Caja y Arqueo (`CortesController`)

### `GET /api/v1/cortes/diario?fecha={yyyy-MM-dd}`
- **Pantalla:** `app/(tabs)/mas/corte.tsx`
- **Response DTO (`List<CorteTrabajadorDto>`):**
  ```csharp
  public class CorteTrabajadorDto
  {
      public string EmpleadoId { get; set; } = string.Empty;
      public string Nombre { get; set; } = string.Empty;
      public string Ruta { get; set; } = string.Empty;
      public decimal FondoInicial { get; set; } // Fondo de caja entregado al inicio
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
  ```

### `POST /api/v1/cortes/cerrar`
- **Request DTO (`CerrarCorteCajaRequestDto`):**
  ```csharp
  public class CerrarCorteCajaRequestDto
  {
      public string EmpleadoId { get; set; } = string.Empty;
      public decimal FondoInicial { get; set; }
      public decimal EfectivoContado { get; set; }
      public string? Observaciones { get; set; }
  }
  ```

---

## 9. Módulo de Importación CSV de Catálogo (`ImportacionesController`)

### `POST /api/v1/productos/importaciones/preview`
- **Pantalla:** `app/(tabs)/mas/productos.tsx`
- **Descripción:** Lectura en memoria y clasificación de `ProductosMiguel.csv` (formato contable español, detección de homónimos, 0 escrituras en BD).
- **Request DTO (`PreviewImportacionRequestDto`):**
  ```csharp
  public class PreviewImportacionRequestDto
  {
      public string NombreArchivo { get; set; } = string.Empty;
      public string ContenidoCsv { get; set; } = string.Empty;
  }
  ```
- **Response DTO (`PreviewImportacionResponseDto`):**
  ```csharp
  public class PreviewImportacionResponseDto
  {
      public string FileHash { get; set; } = string.Empty;
      public string NombreArchivo { get; set; } = string.Empty;
      public int TotalFilas { get; set; }
      public int TotalNuevos { get; set; }
      public int TotalExistentes { get; set; }
      public int TotalAmbiguos { get; set; }
      public int TotalInvalidos { get; set; }
      public bool YaFueImportadoPreviamente { get; set; }
      public DateTime? FechaUltimaImportacion { get; set; }
      public List<FilaPreviewImportacionDto> Filas { get; set; } = new();
  }
  ```

### `POST /api/v1/productos/importaciones/confirmar`
- **Descripción:** Transacción SQL que aplica la importación. Si el hash SHA-256 ya existe, retorna `409 Conflict`.
- **Request DTO (`ConfirmarImportacionRequestDto`):**
  ```csharp
  public class ConfirmarImportacionRequestDto
  {
      public string FileHash { get; set; } = string.Empty;
      public string NombreArchivo { get; set; } = string.Empty;
      public string Usuario { get; set; } = "Miguel";
      public List<ResolucionFilaImportacionDto> Resoluciones { get; set; } = new();
  }
  ```
- **Response DTO (`ConfirmarImportacionResponseDto`):**
  ```csharp
  public class ConfirmarImportacionResponseDto
  {
      public bool Success { get; set; }
      public string Message { get; set; } = string.Empty;
      public string FileHash { get; set; } = string.Empty;
      public int TotalProcesados { get; set; }
      public int TotalCreados { get; set; }
      public int TotalActualizados { get; set; }
      public int TotalOmitidos { get; set; }
      public int TotalPendientesConfiguracion { get; set; }
      public List<string> Advertencias { get; set; } = new();
  }
  ```

---

## 10. Módulo de Gastos Operativos (`GastosController`)

### `POST /api/v1/gastos`
- **Pantalla:** `app/(tabs)/mas/gastos.tsx`
- **Request DTO (`RegistrarGastoRequestDto`):**
  ```csharp
  public class RegistrarGastoRequestDto
  {
      public string EmpleadoId { get; set; } = string.Empty;
      public string Concepto { get; set; } = "Gasolina";
      public decimal Importe { get; set; }
      public string MetodoPago { get; set; } = "Efectivo";
      public string? Observaciones { get; set; }
  }
  ```

---

## 11. Módulo de Devoluciones (`DevolucionesController`)

### `POST /api/v1/devoluciones`
- **Pantalla:** `app/(tabs)/mas/devoluciones.tsx`
- **Request DTO (`RegistrarDevolucionRequestDto`):**
  ```csharp
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
  ```

---

## 12. Módulo de Sincronización Fuera de Línea (`SyncController`)

### `POST /api/v1/sync/lote`
- **Servicio:** `services/offlineSyncQueueService.ts`
- **Descripción:** Recepción y procesamiento en lote de operaciones generadas en camioneta sin conexión.
- **Request DTO (`SyncBatchRequestDto`):**
  ```csharp
  public class SyncBatchRequestDto
  {
      public string DispositivoId { get; set; } = string.Empty;
      public string EmpleadoId { get; set; } = string.Empty;
      public DateTime FechaEnvio { get; set; } = DateTime.Now;
      public List<SyncOperationItemDto> Operaciones { get; set; } = new();
  }

  public class SyncOperationItemDto
  {
      public string Id { get; set; } = string.Empty; // UUID
      public string Tipo { get; set; } = string.Empty; // "Venta", "Abono", "Gasto", "Devolucion"
      public string IdempotencyKey { get; set; } = string.Empty;
      public DateTime FechaGeneracion { get; set; }
      public string PayloadJson { get; set; } = string.Empty;
  }
  ```
- **Response DTO (`SyncBatchResponseDto`):**
  ```csharp
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
  ```

---

## 13. Módulo de Reportes y Exportación (`ReportesController`)

### `GET /api/v1/reportes/dashboard?periodo={periodo}`
- **Pantalla:** `app/(tabs)/mas/reportes.tsx`
- **Response DTO (`ReporteResumenDto`):**
  ```csharp
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
  ```

### `GET /api/v1/reportes/exportar-excel?periodo={periodo}`
- **Descripción:** Genera y descarga un archivo `.csv` estructurado con codificación **UTF-8 BOM** y delimitador punto y coma (`;`), abriéndose sin corrupción tipográfica directamente en Microsoft Excel.

## Aclaración de consumo frontend — 2026-11-08

Sin cambios en endpoints, DTOs de escritura ni reglas de negocio. El adaptador de GET clientes y GET cliente por ID expone ahora el campo existente preciosEspeciales como precioEspecial para los helpers del frontend. La vista Mosaicos/Lista es una preferencia web local por usuario, sin contrato de API ni sincronización entre dispositivos.

La UI de corte sigue sumando fondo inicial; el controlador actual calcula efectivo + abonos − gastos sin fondo. Esta discrepancia sigue pendiente y el rediseño no acredita conciliación. La entrada de peso decimal del frontend tampoco acredita soporte decimal integral del backend. Ver [alcance y limitaciones](docs/REDISENO_OLIVA_2026-11.md).

## Adenda de contratos — 2026-11-09

### GET /api/v1/clientes/{id}/cuenta

Nuevo endpoint de solo lectura. Acepta código o ID numérico; 404 si no existe. Respuesta:

```json
{"clienteId":"<codigo>","saldo":0,"limiteCredito":0,"movimientos":[]}
```

Cada movimiento contiene `id`, `fecha` ISO, `concepto`, `monto` numérico y `tipo` (`cargo` o `abono`). El saldo es el almacenado en Clientes; los movimientos son pagos a crédito de ventas no canceladas y abonos de cobranza. No se infiere saldo inicial ni se recalcula saldo a partir de esta lista. El consumidor usa el código canónico del cliente y rechaza respuestas incompletas o pertenecientes a otro cliente; error de red no significa saldo cero. Compilado, pendiente consulta integrada con SQL.

### Reportes

`TopProductoReporteDto` conserva `CantidadVendida` en unidades base y agrega `CantidadPresentaciones` (int, como la entidad actual), `Presentacion` y `Unidad`. La agrupación distingue producto y presentación. Se retiraron productos/métricas ilustrativos para resultados vacíos. La UI exporta CSV del reporte ya cargado (mismo periodo y contenido visible); no promete XLSX. El endpoint CSV anterior se conserva con escapado y semana desde lunes. Véase [incidencias](docs/INCIDENCIAS_UI_2026-11-09.md).
