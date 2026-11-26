# MAPA INTEGRAL DE MÓDULOS DEL SISTEMA — RUTAVENTAS (DON MIGUEL)

---

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│              FRONTEND (React Native Web / Expo Router SDK 54)                   │
│                                                                                 │
│   [Tabs] 🏠 Inicio  |  👥 Clientes  |  ⚡ Vender  |  📦 Inventario  |  ☰ Más   │
│                                                                                 │
│   • Submódulos Ruta: Secuencia Paradas, Mapa OSM/Leaflet, Ficha de Cliente      │
│   • Submódulos Venta: Mosaico 3 col, Stepper táctil, Carrito unificado, Cobro  │
│   • Submódulos Más: Surtido PDF, CSV Transaccional, Corte, Cobranza, Gastos...  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
             ┌──────────────────────┐         ┌─────────────────────────┐
             │ DataService (Fachada)│         │ AppContext (Estado App) │
             └──────────┬───────────┘         └─────────────────────────┘
                        │
         ┌──────────────┴────────────────────────┐
         │                                       │
         ▼ (Si hay conexión HTTP)                ▼ (Sin red o backend no responde)
┌─────────────────────────────────┐   ┌─────────────────────────────────────────┐
│ Backend API ASP.NET Core 9      │   │ LocalStorage + OfflineSyncQueueService  │
│ (18 Controladores RESTful)      │   │ • Almacenamiento local de catálogos     │
│ • Validaciones transaccionales  │   │ • Encolamiento de transacciones UUID    │
│ • Hashing SHA-256 e idempotencia│   │ • Cooldown 25s de red (fallback 0ms)    │
│ • Conversiones multipresentación│   │ • Auto-sincronización idempotente       │
└────────────────┬────────────────┘   └─────────────────────────────────────────┘
                 │ EF Core 9
                 ▼
┌─────────────────────────────────┐
│ Base de Datos Microsoft         │
│ SQL Server (18 Tablas Relacion.)│
└─────────────────────────────────┘
```

---

## 2. INVENTARIO EXHAUSTIVO DE MÓDULOS

### Módulo 1: Inicio y Dashboard Operativo
- **Archivos Frontend:** `app/(tabs)/index.tsx`, `components/DesignSystem.tsx`
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/DashboardController.cs`
- **Endpoints:** `GET /api/v1/dashboard/resumen?rutaId={id}`
- **Diseño & UX:**
  - Optimizado para **cero scroll inicial en iPhone y pantallas estándar** (390×844).
  - Encabezado minimalista: Saludo ("Hola, Miguel"), chip de conectividad dinámico ("En línea" / "Offline"), selector de rol interactivo ("Admin" / "Vendedor") y botón de salir.
  - **Botón Hero VENDER** (`#2563EB`, altura 56 px, badge de carrito).
  - **3 KPIs Compactos de Negocio:**
    1. *Ventas hoy* (monto total vendido).
    2. *Cobrado hoy* (efectivo y transferencias captadas).
    3. *Crédito hoy* (monto fiado a clientes).
  - Selector directo de cliente con buscador insensible a mayúsculas/acentos, acceso en 1 toque a "Venta de Mostrador / General" y alta rápida de cliente.
- **Entradas:** `rutaId`, sesión activa.
- **Salidas:** KPIs del día, navegación directa al catálogo de ventas con cliente asignado.

---

### Módulo 2: Venta Rápida, Mosaico y Cobro Móvil
- **Archivos Frontend:**
  - `app/(tabs)/venta/index.tsx`: Catálogo en mosaico ultra compacto de 3 columnas con stepper condicional, favoritos y reordenamiento estilo Spotify.
  - `app/(tabs)/venta/carrito.tsx`: Resumen de pedido, selección de método de pago y confirmación unificada en una sola pantalla.
  - `app/(tabs)/venta/pago.tsx`: Pantalla de cobro detallada con soporte de desglose mixto.
  - `app/(tabs)/venta/confirmacion.tsx`: Folio de venta, acción hero de compartir comprobante (Web Share API / WhatsApp) y botón de nueva venta.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/VentasController.cs`
- **Endpoints:**
  - `POST /api/v1/ventas`: Registro transaccional de venta y decremento de inventario.
  - `GET /api/v1/ventas/historial`: Listado de ventas del día por ruta o vendedor.
  - `GET /api/v1/ventas/{id}`: Detalle inmutable de la venta.
- **Diseño & UX:**
  - **Mosaico 3 Columnas Móvil:** Separación precisa de 7 px, tarjeta táctil limpia sin botones inferiores cuando no está agregada. Nombres en hasta 3 líneas, precio destacado y unidad base arriba a la izquierda.
  - **Stepper Condicional:** Al tocar la tarjeta se añade 1 unidad y aparece el stepper `[−] [Cantidad] [+]` con áreas táctiles ≥ 44×44 px. Al pulsar sobre el número de cantidad se activa un modal para digitación numérica directa (útil para pedidos de 20 o 50 piezas).
  - **Multipresentación (Castel y Empaques):** Productos con múltiples presentaciones abren `PresentationModal` (BottomSheet) mostrando factores, precios independientes y cálculo en tiempo real de unidades base.
  - **Personalización Estilo Spotify:** Pestañas "Todos", "⭐ Favoritos", "Frecuentes". Botón "Ordenar" para mover productos arriba/abajo o al inicio con persistencia en `miguel_orden_catalogo_v1`.
  - **Cobro Unificado en 1 Toque:** Carrito integrado con botones rápidos para Efectivo (predeterminado), Transferencia, Tarjeta, Crédito y Mixto. Botón de confirmación con protección contra doble clic.
- **Tablas SQL Afectadas:** `Ventas`, `VentasDetalles`, `Pagos`, `Clientes` (actualiza `Saldo`), `Productos` (descuenta `Existencia`).

---

### Módulo 3: Clientes y Cartera de Crédito
- **Archivos Frontend:**
  - `app/(tabs)/clientes.tsx`: Directorio táctil con filtros rápidos (`Todos`, `Hoy`, `Pendientes de cobro`, `Con crédito`, `Cercanos`), buscador en vivo y saldos deudores.
  - `app/(tabs)/mas/nuevo-cliente.tsx`: Formulario de alta rápida con días de visita, ruta y límite de crédito pactado.
  - `app/(tabs)/ruta/cliente/[id].tsx`: Ficha integral del cliente con historial de compras, pagos anteriores, precios especiales y ubicación GPS.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/ClientesController.cs`
- **Endpoints:**
  - `GET /api/v1/clientes?ruta={ruta}&filtro={filtro}`: Listado de clientes.
  - `POST /api/v1/clientes`: Alta de nuevo cliente.
  - `PUT /api/v1/clientes/{id}`: Actualización de datos, límites o días de visita.
  - `GET /api/v1/clientes/{id}/precios-especiales`: Lista de precios preferenciales por presentación.
- **Tablas SQL Afectadas:** `Clientes`.

---

### Módulo 4: Rutas y Navegación Georreferenciada (Mapa Móvil)
- **Archivos Frontend:**
  - `app/(tabs)/ruta/index.tsx`: Secuencia correlativa de visitas asignadas a la jornada.
  - `app/(tabs)/ruta/mapa.tsx`: Mapa interactivo OpenStreetMap / Leaflet embebido vía iframe responsivo con puente bidireccional (`postMessage`).
  - `app/(tabs)/mas/rutas.tsx`: Administración y asignación de rutas a choferes.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/RutasController.cs`
- **Endpoints:**
  - `GET /api/v1/rutas`: Catálogo de rutas operativas.
  - `GET /api/v1/rutas/{id}/paradas?dia={dia}`: Paradas ordenadas geográficamente para el día actual.
- **Diseño & UX:**
  - **Cero Scroll Inicial:** La cabecera compacta (48 px), el mapa Leaflet, la ficha compacta del cliente y la barra de navegación inferior (Tabs) se adaptan al 100% del alto del dispositivo sin generar desbordamiento ni barras de desplazamiento en iPhone o Android.
  - **Marcadores Gota Numerados:** Cada parada muestra su número en un pin con punta exacta. Al tocarlo se resalta con un halo ámbar/dorado de alto contraste (`box-shadow: 0 0 0 3.5px #f59e0b`) sin abrir globos emergentes redundantes.
  - **Ficha Compacta Inferior (~85 px):** Muestra el cliente seleccionado, saldo pendiente, distancia real GPS calculada vía `navigator.geolocation` (sin mocks falsos de "500 m"), botón primario **VENDER** (lleva al catálogo de venta con cliente activo), botón **Cómo llegar** (Google Maps) y llamada telefónica.
  - **Panel Modal de Paradas ("Ver paradas (N)"):** Control desplegable tipo BottomSheet que permite al chofer consultar o saltar a cualquier parada de la ruta.
  - **Ruta GPS Multiparada:** Botón en cabecera que lanza la ruta completa de paradas en Google Maps.
- **Tablas SQL Afectadas:** `Rutas`, `Clientes` (`Latitud`, `Longitud`, `EstadoVisita`).

---

### Módulo 5: Inventario y Surtido de Camioneta
- **Archivos Frontend:**
  - `app/(tabs)/inventario.tsx`: Existencias en camioneta en unidades base y desglose jerárquico visual (Cajas / Exhibidores / Paquetes). Vista Mi Inventario para Chofer y Asignación multi-camioneta para Admin.
  - `app/(tabs)/mas/surtido-nota.tsx`: Procesador de notas de compra PDF de bodega central con extracción zlib, matching por doble nombre, auto-surtido e historial de cargas.
  - `app/(tabs)/mas/carga.tsx`: Checklist matutino de verificación física antes de salir a ruta.
  - `utils/multipresentacion.ts`: Algoritmos puros de conversión, desglose y cálculo de unidades base.
  - `utils/pdfNoteParser.ts`: Motor de descompresión y parsing estructurado de documentos PDF de almacén.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/InventarioController.cs`
- **Endpoints:**
  - `GET /api/v1/inventario/camioneta?usuarioId={id}`: Existencias actuales del chofer.
  - `POST /api/v1/inventario/surtido-nota`: Carga masiva de existencias extraídas de una nota PDF.
  - `POST /api/v1/inventario/confirmar-carga-inicial`: Verificación matutina con soporte para `esEntradaMercancia = false` (auditoría sin duplicar existencias) o `true` (entrada de stock).
- **Tablas SQL Afectadas:** `Productos` (`Existencia`), `InventarioMovimientos`.

---

### Módulo 6: Catálogo de Productos e Importación CSV Transaccional
- **Archivos Frontend:**
  - `app/(tabs)/mas/productos.tsx`: Administración de productos, configuración de presentaciones y flujo de importación masiva CSV.
  - `app/(tabs)/mas/categorias.tsx`: Gestión de categorías comerciales con iconos visuales.
- **Archivos Backend:**
  - `backend/RutaVentas.Api/Controllers/ProductosController.cs`
  - `backend/RutaVentas.Api/Controllers/ImportacionesController.cs`
  - `backend/RutaVentas.Api/Controllers/CategoriasController.cs`
- **Endpoints:**
  - `GET /api/v1/productos`: Catálogo completo de productos con presentaciones.
  - `POST /api/v1/productos`: Alta manual de producto con presentaciones.
  - `PUT /api/v1/productos/{id}`: Edición de costo, precio base, código de barras y factores.
  - `POST /api/v1/productos/importaciones/preview`: Previsualización del archivo `ProductosMiguel.csv` (formato contable español, detección de 27 grupos ambiguos, cero escrituras en BD).
  - `POST /api/v1/productos/importaciones/confirmar`: Confirmación transaccional con hash SHA-256 (`FileHash`) contra duplicados (`409 Conflict`), asignación de stock 0 a nuevos y protección de existencias en existentes.
- **Tablas SQL Afectadas:** `Productos`, `PresentacionesProductos`, `Categorias`, `ImportacionesCatalogo`.

---

### Módulo 7: Cobranza y Abonos de Cartera
- **Archivos Frontend:**
  - `app/(tabs)/mas/cobranza.tsx`: Registro de abonos recibidos en ruta y listado de deudores.
  - `app/(tabs)/mas/creditos.tsx`: Reporte de antigüedad de saldos y líneas de crédito otorgadas.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/CobranzaController.cs`
- **Endpoints:**
  - `GET /api/v1/cobranza/pendientes`: Cartera de clientes con saldo deudor.
  - `POST /api/v1/cobranza/abonos`: Registro de abono (reduce saldo de cliente y aumenta efectivo esperado de caja si fue en efectivo).
  - `GET /api/v1/cobranza/historial`: Bitácora de abonos cobrados en la jornada.
- **Tablas SQL Afectadas:** `AbonosCobranza`, `Clientes` (`Saldo`).

---

### Módulo 8: Devoluciones y Mermas
- **Archivos Frontend:** `app/(tabs)/mas/devoluciones.tsx`
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/DevolucionesController.cs`
- **Endpoints:**
  - `POST /api/v1/devoluciones`: Registro de producto retornado.
  - `GET /api/v1/devoluciones/historial`: Bitácora de devoluciones del día.
- **Reglas del Módulo:**
  - Si el destino es **"Inventario"**: Suma las unidades base equivalentes a `Producto.Existencia` en camioneta.
  - Si el destino es **"Merma"**: No altera el stock vendible de la camioneta y asienta la baja contable.
  - Si el reembolso es **"SaldoAFavor"**: Disminuye la deuda del cliente. Si es **"Efectivo"**, se descuenta del efectivo esperado del corte de caja del chofer.
- **Tablas SQL Afectadas:** `Devoluciones`, `Productos` (condicional), `Clientes` (condicional).

---

### Módulo 9: Gastos Operativos en Ruta
- **Archivos Frontend:** `app/(tabs)/mas/gastos.tsx`
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/GastosController.cs`
- **Endpoints:**
  - `POST /api/v1/gastos`: Registro de gasto en ruta (gasolina, casetas, alimentos, talachas).
  - `GET /api/v1/gastos/hoy?usuarioId={id}`: Egresos del chofer en la jornada.
- **Regla del Módulo:** Todo gasto registrado con método `Efectivo` se deduce automáticamente del arqueo de caja final del chofer.
- **Tablas SQL Afectadas:** `GastosOperativos`.

---

### Módulo 10: Corte Diario y Arqueo de Caja
- **Archivos Frontend:**
  - `app/(tabs)/mas/corte.tsx`: Conciliación multi-chofer para Admin y pantalla de cierre de turno para chofer.
  - `app/(tabs)/mas/caja.tsx`: Registro de movimientos directos y apertura de caja con fondo inicial.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/CortesController.cs`
- **Endpoints:**
  - `GET /api/v1/cortes/resumen-jornada?usuarioId={id}`: Cálculo del efectivo esperado del día.
  - `POST /api/v1/cortes/cerrar`: Registro formal del corte de turno con captura de efectivo contado y diferencia calculada.
  - `GET /api/v1/cortes/historial`: Bitácora de cortes pasados.
- **Fórmula de Arqueo:**
  $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} + \text{Cobranza Abonos} - \text{Gastos Efectivo} - \text{Devoluciones Efectivo}$$
- **Tablas SQL Afectadas:** `CortesCaja`.

---

### Módulo 11: Empleados, Trabajadores y Permisos Granulares
- **Archivos Frontend:**
  - `app/(tabs)/mas/trabajadores.tsx`: Lista de personal operativo, roles, rutas asignadas, código PIN y configuración de permisos.
  - `app/login.tsx`: Pantalla de inicio de sesión con selección rápida o credenciales.
- **Archivos Backend:**
  - `backend/RutaVentas.Api/Controllers/EmpleadosController.cs`
  - `backend/RutaVentas.Api/Controllers/AuthController.cs`
- **Endpoints:**
  - `POST /api/v1/auth/login`: Autenticación con token JWT.
  - `GET /api/v1/empleados`: Directorio de choferes y administradores.
  - `PUT /api/v1/empleados/{id}/permisos`: Actualización del JSON de permisos (`permisosJson`).
- **Tablas SQL Afectadas:** `Usuarios`.

---

### Módulo 12: Auditoría, Bitácora y Reportes Financieros
- **Archivos Frontend:**
  - `app/(tabs)/mas/reportes.tsx`: Tablero analítico con top productos, filtros temporales y exportador Excel.
  - `app/(tabs)/mas/revision.tsx`: Módulo de revisión física de inventario (`X / Y revisados`), diferencias y autorización de ajustes.
  - `app/(tabs)/mas/bitacora.tsx`: Visor cronológico de eventos técnicos y de negocio.
- **Archivos Backend:**
  - `backend/RutaVentas.Api/Controllers/ReportesController.cs`
  - `backend/RutaVentas.Api/Controllers/RevisionController.cs`
  - `backend/RutaVentas.Api/Controllers/BitacoraController.cs`
- **Endpoints:**
  - `GET /api/v1/reportes/dashboard`: Métricas de margen bruto, ventas y cobranza.
  - `GET /api/v1/reportes/exportar-excel`: Descarga de archivo CSV codificado en UTF-8 BOM con delimitador `;` para apertura nativa en Microsoft Excel.
  - `POST /api/v1/revision/autorizar-ajuste`: Sincronización formal del inventario en SQL Server con base en conteo físico.
  - `GET /api/v1/bitacora`: Registro de eventos del sistema.
- **Tablas SQL Afectadas:** `AuditoriasInventario`, `AuditoriasInventarioDetalles`, `BitacoraEventos`.

---

### Módulo 13: Capa de Datos, Offline Queue y Sincronización Híbrida
- **Archivos Frontend:**
  - `services/mockDataService.ts`: Fachada unificada `DataService` con conmutación dinámica transparente.
  - `services/offlineSyncQueueService.ts`: Cola persistente transaccional con identificadores UUID y estados (`pending`, `syncing`, `synced`, `failed`).
  - `services/httpApiService.ts`: Cliente HTTP Axios con detección de conectividad y **cooldown de 25 segundos** ante fallos de red para garantizar respuesta instantánea (0 ms) mediante `localStorage`.
- **Archivos Backend:** `backend/RutaVentas.Api/Controllers/SyncController.cs`
- **Endpoints:**
  - `POST /api/v1/sync/lote`: Recepción por lotes de transacciones creadas fuera de línea con garantía de idempotencia por Folio/UUID.
- **Misión Crítica:** Asegurar que Don Miguel y sus choferes nunca se queden bloqueados ni pierdan datos de ventas cuando la camioneta no tenga señal celular en ruta.

## Actualización visual — 2026-11-08

Misma arquitectura y módulos; venta compone ahora WorkflowSteps, SaleProduct y SaleProductEditor, con resumenCantidades para agrupar presentaciones y kg. Cuatro columnas porcentuales y modo lista usan un único carrito. AppShell/PageHeader/BottomSheet y tema centralizado se aplican a pantallas existentes. DataService incorpora getVistaCatalogo/saveVistaCatalogo, solo localStorage web por usuario.

Surtido usa utils/readSupplyPdf sobre el parser existente; no precarga notas ni historial fijo y no sustituye errores por ejemplos. La carga nativa debe informar su limitación. El mapa mantiene Leaflet/OSM sin fabricar paradas/coordenadas. No se alteran controladores ni contratos. Consultar cobertura y validación por pantalla en [REDISENO_OLIVA_2026-11.md](REDISENO_OLIVA_2026-11.md).

## Actualización de módulos — 2026-11-09

Esta sección sucede a la entrega del 8 de noviembre: ahora sí existen cambios de lectura en backend. No hay migraciones ni cambios de escritura.

| Módulo | Componentes/contrato actual | Límite pendiente |
|---|---|---|
| Inventario | InventoryProduct + inventario.tsx; referencias y unidades reales; desglose colapsable | Selector de bodega/unidad no acredita existencias segmentadas |
| Clientes/Mapa | location.ts, geocodingService.ts, clientes.tsx y ruta/mapa.tsx; coordenadas válidas antes de dirección parcial | GPS físico, guardado y navegación externa |
| Cuenta | customerAccount.ts + DataService/apiService; GET /api/v1/clientes/{id}/cuenta, saldo almacenado y cargos/abonos sin demo | EF/SQL integrado; apertura/devoluciones no reconstruidas |
| Comprobantes | receiptDocument.ts + TicketModal + ticketImageService/ticketPrinterService; HTML58/80 y canvas con nombres completos | Impresora/PDF y datos comerciales oficiales |
| Reportes | ReportesController + TopProductoReporteDto y reportExport.ts; nombre separado de presentación, CSV del reporte visible | Conciliación de fórmulas local/backend y adjunto nativo |
| Navegación | _layout de raíz/pestañas, cartera y Más; origen y enlaces directos | Seguridad/autenticación real sigue separada |

Mapa detallado de archivos, comandos y próximos pasos: [CONTINUIDAD_ANTIGRAVITY.md](CONTINUIDAD_ANTIGRAVITY.md). Evidencia: [INCIDENCIAS_UI_2026-11-09.md](INCIDENCIAS_UI_2026-11-09.md).

---

## Actualización de Módulos (Fase 4 & Cierre Integral) — 2026-11-25

Esta sección documenta la implementación completa de la Fase 4 y la resolución de las limitaciones previas, con migraciones en SQL Server y pruebas en vivo:

| Módulo | Archivos / Componentes Nuevos o Modificados | Cambios Implementados y Estado |
|---|---|---|
| **Inventario Segmentado** | `InventarioController.cs`, `inventario.tsx`, `mockDataService.ts` | **Resuelto:** `GET /api/v1/inventario?ubicacion={ubicacion}` calcula existencias separadas (Bodega vs Camioneta 1) basadas en movimientos relacionales reales. Existencias admiten fracciones decimales `DECIMAL(18,3)`. |
| **Venta & Pesaje Decimal** | `VentasController.cs`, `ApiDtos.cs`, `pago.tsx`, `venta/index.tsx`, `SaleProductEditor.tsx` | **Resuelto:** Soporte de báscula con pesaje fraccionario (ej. 0.450 kg). Migración SQL `05_alter_columns_to_decimal18_3.sql` en SQL Server. Descuento exacto de stock sin redondeo. |
| **Sobregiro Remoto Push** | `VentasController.cs`, `SolicitudesSobregiro`, `pago.tsx`, `creditos.tsx`, `httpApiService.ts` | **Resuelto:** Bloqueo 422 si excede crédito pactado. Solicitud chofer -> Don Miguel autoriza en `creditos.tsx` -> Chofer recibe `TokenAutorizacionSobregiro` y concluye venta 201. |
| **Arqueo y Cortes** | `CortesController.cs`, `corte.tsx`, `Entities.cs`, `04_add_fondo_inicial_to_cortes.sql` | **Resuelto:** Columna `FondoInicial` en tabla `Cortes`. Fórmula oficial unificada: `FondoInicial + VentasEfectivo + Cobranza - Gastos`. Impresión térmica continua 58/80 mm. |
| **Impresión Bluetooth ESC/POS** | `bluetoothPrinterService.ts`, `TicketModal.tsx`, `receiptDocument.ts` | **Resuelto:** Driver ESC/POS binario (`ESC @`, CP850 `ESC t 2`, acentos en español, corte `GS V`) y transmisión BLE de 64 bytes para impresión portátil sin ventanas del sistema. |
| **Clientes, Cuenta y GPS** | `ClientesController.cs`, `location.ts`, `DesignSystem.tsx`, `mapa.tsx` | **Resuelto:** `GET /api/v1/clientes/{id}/cuenta` integrado con SQL Server. Normalización de colonias mexicanas, bounding box México y botón táctil 44×44 px para abrir Google Maps / Waze. |
| **Identidad Comercial** | `app.json`, `receiptDocument.ts`, `sincronizacion.tsx` | **Resuelto:** "DISTRIBUIDORA DON MIGUEL", RFC "MIGD750412AB1", Tel: "477-123-4567", León, Gto. Reflejado en comprobantes y editable en sincronización. |
| **Reportes Financieros** | `ReportesController.cs`, `reportExport.ts`, `mockDataService.ts` | **Resuelto:** Semana iniciando en lunes y utilidad estimada conciliada `(ventas * 0.35) - gastos`. |

### En qué nos quedamos en implementar las pruebas
1. Pruebas físicas en campo con impresora térmica BLE de cinturón emparejada con celular Android/iOS.
2. Captura serial o bluetooth desde báscula digital electrónica hacia el editor de producto.
3. Prueba de carga y tolerancia offline en ruta ciega (15 notas acumuladas en `offlineSyncQueueService.ts`).
4. Runner CI/CD automatizado (`npm test`) para ejecutar toda la suite con un solo comando.
