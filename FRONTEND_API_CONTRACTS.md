# ESPECIFICACIÓN DE CONTRATOS API Y DTOs (FASE 2)
## Sistema de Ventas en Ruta de Miguel
### Entrada de Requerimientos para Backend .NET 9 y Base de Datos SQL Server

Este documento define con precisión los contratos HTTP, modelos DTO (Request/Response), endpoints REST sugeridos y códigos de estado esperados para sustituir limpiamente la capa de servicios mock (`services/mockDataService.ts`) por servicios reales en la Fase 2.

---

## 1. Módulo de Autenticación y Perfil

### `POST /api/v1/auth/login`
- **Pantalla:** `app/login.tsx`
- **Descripción:** Inicio de sesión con credenciales y retorno de token JWT con rol del operador (Administrador o Vendedor).
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
      public string Rol { get; set; } = string.Empty; // "Administrador" | "Vendedor"
      public string RutaId { get; set; } = string.Empty;
      public string RutaNombre { get; set; } = string.Empty;
  }
  ```
- **Códigos de Estado:**
  - `200 OK`: Autenticación exitosa.
  - `401 Unauthorized`: Credenciales inválidas.
  - `403 Forbidden`: Usuario inactivo o sin ruta asignada.

---

## 2. Módulo de Home / Dashboard

### `GET /api/v1/dashboard/resumen?rutaId={rutaId}`
- **Pantalla:** `app/(tabs)/index.tsx`
- **Descripción:** Obtiene los indicadores rápidos (KPIs) del día actual para la camioneta/vendedor o consolidados para el administrador.
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
- **Códigos de Estado:**
  - `200 OK`: Datos consolidados.
  - `500 Internal Server Error`: Falla de cálculo en SQL Server.

---

## 3. Módulo de Venta y Catálogo

### `GET /api/v1/productos?categoria={cat}&search={q}&activo=true`
- **Pantalla:** `app/(tabs)/venta/index.tsx`, `app/(tabs)/mas/productos.tsx`
- **Descripción:** Listado de catálogo con presentaciones y factores de conversión de piezas.
- **Response DTO (`List<ProductoDto>`):**
  ```csharp
  public class ProductoDto
  {
      public string Id { get; set; } = string.Empty;
      public string Nombre { get; set; } = string.Empty;
      public string? Marca { get; set; }
      public string Categoria { get; set; } = string.Empty;
      public decimal PrecioBase { get; set; }
      public decimal? PrecioCompra { get; set; }
      public int ExistenciaPiezas { get; set; }
      public string Sku { get; set; } = string.Empty;
      public string CodigoBarras { get; set; } = string.Empty;
      public bool Favorito { get; set; }
      public bool Activo { get; set; }
      public List<PresentacionConfigDto> Presentaciones { get; set; } = new();
  }

  public class PresentacionConfigDto
  {
      public string Tipo { get; set; } = string.Empty; // "pieza" | "paquete" | "caja" | "exhibidor"
      public string Nombre { get; set; } = string.Empty;
      public int PiezasEquivalentes { get; set; } // Factor multiplicador a inventario
      public decimal Precio { get; set; }
      public string? DescripcionEquivalencia { get; set; }
  }
  ```

### `POST /api/v1/ventas`
- **Pantalla:** `app/(tabs)/venta/pago.tsx`
- **Descripción:** Registro de la venta, descuento de inventario por piezas y generación de saldos a crédito.
- **Request DTO (`RegistrarVentaRequestDto`):**
  ```csharp
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
      public string Folio { get; set; } = string.Empty; // Ej. "FOL-2026-0915-084"
      public DateTime FechaHora { get; set; }
      public decimal TotalVenta { get; set; }
      public decimal TotalPagado { get; set; }
      public decimal CreditoOtorgado { get; set; }
      public decimal NuevoSaldoCliente { get; set; }
      public string Estado { get; set; } = "Completada";
  }
  ```
- **Códigos de Estado:**
  - `201 Created`: Venta registrada con éxito.
  - `400 Bad Request`: Discrepancia en suma de pagos o stock insuficiente.
  - `409 Conflict`: Venta duplicada (folio o id idempotente ya registrado).
  - `422 Unprocessable Entity`: El crédito supera el límite autorizado.

---

## 4. Módulo de Clientes

### `GET /api/v1/clientes?filtro={filtro}&search={q}`
- **Pantalla:** `app/(tabs)/clientes.tsx`
- **Filtros aceptados:** `Todos`, `Hoy`, `Pendientes de cobro`, `Con crédito`, `Cercanos`.
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
      public Dictionary<string, decimal>? PreciosEspeciales { get; set; }
  }
  ```

### `POST /api/v1/cobranza/abonos`
- **Pantalla:** `app/(tabs)/mas/cobranza.tsx`, botón [Cobrar] en ClienteCard
- **Descripción:** Registra un abono para reducir el saldo pendiente del cliente.
- **Request DTO (`RegistrarAbonoRequestDto`):**
  ```csharp
  public class RegistrarAbonoRequestDto
  {
      public string ClienteId { get; set; } = string.Empty;
      public decimal Monto { get; set; }
      public string MetodoPago { get; set; } = string.Empty; // "Efectivo" | "Transferencia"
      public string? Comentario { get; set; }
  }
  ```

---

## 5. Módulo de Inventario (Vendedor y Administrador)

### `GET /api/v1/inventario?ubicacion={bodega|trabajadorId}`
- **Pantalla:** `app/(tabs)/inventario.tsx`
- **Descripción:** Consulta de existencias en piezas y equivalencias configuradas.
- **Response DTO (`InventarioUbicacionDto`):**
  ```csharp
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
      public int ExistenciaPiezas { get; set; }
      public decimal PrecioBase { get; set; }
      public string EstadoStock { get; set; } = string.Empty; // "Normal" | "Bajo" | "Agotado"
      public List<PresentacionConfigDto> Presentaciones { get; set; } = new();
  }
  ```

### `POST /api/v1/inventario/transferencias`
- **Descripción:** Traspaso de mercancía entre Bodega Central y Camioneta de Vendedor.
- **Request DTO (`TransferenciaInventarioDto`):**
  ```csharp
  public class TransferenciaInventarioDto
  {
      public string OrigenId { get; set; } = "Bodega";
      public string DestinoId { get; set; } = string.Empty; // Camioneta / Trabajador
      public List<ItemTransferenciaDto> Lotes { get; set; } = new();
  }

  public class ItemTransferenciaDto
  {
      public string ProductoId { get; set; } = string.Empty;
      public int Piezas { get; set; }
  }
  ```

---

## 6. Módulo de Cortes por Trabajador (Admin)

### `GET /api/v1/cortes/diario?fecha={yyyy-MM-dd}`
- **Pantalla:** `app/(tabs)/mas/corte.tsx`
- **Descripción:** Listado de cortes y cuadre de caja por cada vendedor/ruta.
- **Response DTO (`List<CorteTrabajadorDto>`):**
  ```csharp
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
  ```

---

## 7. Módulo de Revisión Rápida de Inventario (Admin)

### `GET /api/v1/inventario/revision?rutaId={rutaId}`
- **Pantalla:** `app/(tabs)/mas/revision.tsx`
- **Descripción:** Carga de productos en ruta con existencias teóricas para cotejo físico.
- **Response DTO (`List<RevisionItemDto>`):**
  ```csharp
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
  ```

### `POST /api/v1/inventario/revision/autorizar`
- **Descripción:** Miguel autoriza las diferencias detectadas (merma, faltante o sobrante) para ajustar el inventario real en SQL Server.
- **Request DTO (`AutorizarAjusteInventarioDto`):**
  ```csharp
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
  ```

---

## 8. Arquitectura de Transición: Mock a HTTP en Fase 2

En el frontend, el archivo `services/mockDataService.ts` implementa interfaces homogéneas:
```typescript
export interface IDataService {
  getProductos(filtro?: { categoria?: string; search?: string }): Promise<Producto[]>;
  getClientes(filtro?: string): Promise<Cliente[]>;
  registrarVenta(venta: RegistrarVentaRequestDto): Promise<VentaRegistradaResponseDto>;
  getCortes(): Promise<CorteTrabajador[]>;
  getRevisionInventario(): Promise<RevisionItem[]>;
}
```

En la **Fase 2**, bastará con cambiar la implementación a `services/httpApiService.ts` mediante `fetch` o `axios` contra los endpoints de ASP.NET Core 9, sin necesidad de modificar ningún componente visual ni la navegación construida en esta Fase 1.
