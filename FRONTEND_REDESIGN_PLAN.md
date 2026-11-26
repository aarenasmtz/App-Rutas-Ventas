# PLAN DE REDISEÑO FRONTEND & EXPERIENCIA UX (FASE 1)
## Sistema de Ventas en Ruta de Miguel

**Continuación al 2026-11-09:** [relevo para Antigravity](docs/CONTINUIDAD_ANTIGRAVITY.md). Las fases previas son históricas. Prevalecen cuatro columnas en venta, fondo blanco/oliva y los límites documentados de SQL, GPS físico, impresión y sincronización.

---

### 1. Arquitectura Actual
- **Framework base:** Expo SDK 54 / React Native 0.81.4 / React 19.1.0 / React Native Web 0.21.0.
- **Enrutamiento:** Expo Router v6 (File-based routing con directorio `app/`).
  - Grupo principal: `app/(tabs)/` con pestañas: `index`, `ruta`, `venta`, `clientes`, `mas`.
  - Rutas anidadas: `app/(tabs)/venta/` (`index`, `carrito`, `pago`, `confirmacion`), `app/(tabs)/ruta/` (`index`, `mapa`, `cliente/[id]`), `app/(tabs)/mas/` (15 pantallas administrativas y operativas).
- **Estado Global:** React Context en `context/AppContext.tsx` (`AppProvider`, `useApp`):
  - Autenticación simulada: `loggedIn`, `user` (`{ nombre: string, rol: string }`).
  - Conectividad: `online`, `toggleOnline`, `conexionEstado`.
  - Venta en curso: `carrito: ItemCarrito[]`, `pagos: Pago[]`, `ventaTotal: number`, `clienteActivoId: string | null`.
- **Estilos y Tokens:** `constants/theme.ts` (paletas `primary`, `secondary`, `accent`, `success`, `warning`, `error`, `neutral`, `spacing`, `radius`, `fontSize`, `fontWeight`, `shadows`).
- **Iconografía:** `lucide-react-native`.

---

### 2. Pantallas Existentes
1. `app/login.tsx`: Inicio de sesión demo con credenciales mock y switch offline.
2. `app/(tabs)/index.tsx`: Dashboard inicial tipo feed/tarjetas administrativas (progreso de ruta, métricas, siguiente cliente).
3. `app/(tabs)/clientes.tsx`: Lista de clientes con búsqueda y filtros básicos.
4. `app/(tabs)/ruta/index.tsx`: Listado de secuencia de ruta del día.
5. `app/(tabs)/ruta/mapa.tsx`: Mapa y orden de visitas.
6. `app/(tabs)/ruta/cliente/[id].tsx`: Detalle de cliente con pestañas (resumen, sugerido, historial, cuenta).
7. `app/(tabs)/venta/index.tsx`: Catálogo de venta vertical con modal básico de piezas.
8. `app/(tabs)/venta/carrito.tsx`: Lista de compra con edición manual de precio.
9. `app/(tabs)/venta/pago.tsx`: Captura de métodos de pago (efectivo, transferencia, crédito).
10. `app/(tabs)/venta/confirmacion.tsx`: Resumen de venta exitosa.
11. `app/(tabs)/mas/index.tsx`: Menú administrativo y operativo con 13 enlaces.
12. `app/(tabs)/mas/inventario.tsx`: Existencias en camioneta en formato vertical simple.
13. `app/(tabs)/mas/corte.tsx`: Resumen diario con captura de efectivo contado.
14. `app/(tabs)/mas/productos.tsx`: Catálogo simple de productos.
15. `app/(tabs)/mas/` otros: `cobranza.tsx`, `creditos.tsx`, `devoluciones.tsx`, `carga.tsx`, `caja.tsx`, `gastos.tsx`, `reportes.tsx`, `empleados.tsx`, `bitacora.tsx`, `sincronizacion.tsx`.

---

### 3. Componentes Reutilizables Existentes
- `components/ui.tsx`: `Card`, `Badge`, `SectionTitle`, `PrimaryButton`, `SecondaryButton`, `StatCard`, `EmptyState`.
- `components/shared.tsx`: `ConnectivityBanner`, `ConnectivityIndicator`, `ScreenHeader`, `BottomSheet`.
- `utils/helpers.ts`: `formatCurrency`, `formatCantidad`, `getEstadoColor`, `getStockEstado`, `todayDia`.

---

### 4. Datos Mock / localStorage Existentes
- Ubicación: `constants/mockData.ts`
- Entidades:
  - `productos`: 18 productos base (jamones, quesos, salchichas, abarrotes).
  - `clientes`: 10 clientes con direcciones, saldos, límites, historiales y sugeridos.
  - `empleados`: 3 empleados (Miguel como Admin, Juan y Pedro como Vendedores).
  - `gastos`, `bitacora`, `bitacoraErrores`, `movimientosSync`, `devoluciones`, `cargaInicial`, `dashboardData`.
- Necesidad de mejora:
  - Agregar soporte de marcas, SKU, código de barras, imágenes/avatares y presentaciones por producto (pieza, paquete, caja, exhibidor con factor de conversión a piezas).
  - Centralizar acceso a datos en capa de servicios (`services/mockDataService.ts`) para desacoplar UI de arrays directos.

---

### 5. Componentes que Serán Reemplazados o Refactorizados
1. `app/(tabs)/index.tsx`: Se transforma de listado vertical administrativo a **Home Mosaico táctil mobile-first** con accesos directos grandes, métricas instantáneas y filtrado dinámico por rol (Admin vs Vendedor) con selector rápido para pruebas.
2. `app/(tabs)/_layout.tsx`: La barra inferior se reorganiza a **Inicio | Clientes | Vender | Inventario | Más**, con `Vender` destacado visualmente en posición central.
3. `app/(tabs)/venta/index.tsx`: Se rediseña por completo:
   - Cabecera con cliente activo, aviso de proximidad `📍 Cerca de ABTS ARENAS` y selector rápido.
   - Buscador universal (nombre, marca, SKU, código de barras).
   - Carrusel horizontal `⭐ Tus frecuentes`.
   - Grid de categorías visuales interactivas.
   - Grid responsive de `ProductCard` (con botón favorito, badge stock, selector de presentaciones).
4. Selector de cantidad y presentación:
   - Se crea `PresentationModal` (BottomSheet) que calcula en tiempo real piezas equivalentes (ej. `2 cajas = 12 piezas`) antes de agregar al carrito.
5. `app/(tabs)/venta/carrito.tsx`: Se moderniza con visualización de presentación, piezas totales calculadas, subtotales, crédito proyectado y botón flotante de cobro.
6. `app/(tabs)/venta/pago.tsx`: Se mejora con soporte para Efectivo, Transferencia, Tarjeta, Crédito y Pago Combinado con asignación rápida y control contra doble envío.
7. `app/(tabs)/venta/confirmacion.tsx`: Se actualiza con folio, ticket simulado, desglose de pagos y accesos a nueva venta.
8. `app/(tabs)/clientes.tsx`: Se implementa `ClientCard` táctil con filtros rápidos (`Todos`, `Hoy`, `Pendientes de cobro`, `Con crédito`, `Cercanos`), distancia simulada y accesos directos [Vender], [Cobrar], [Ver].
9. `app/(tabs)/inventario.tsx` (nueva vista de tab): Soporta vista Vendedor (`MI INVENTARIO` con equivalencias) y vista Admin (selector de Bodega / Trabajadores, Asignar mercancía, Revisar inventario).
10. `app/(tabs)/mas/corte.tsx`: Rediseño con vista Admin por trabajador (Miguel, Juan, Pedro) y detalle de desglose de efectivo, tarjetas, créditos, abonos e inventarios.
11. `app/(tabs)/mas/revision.tsx` (nueva vista): Pantalla de revisión rápida de inventario con barra de progreso `X / Y revisados`, conteo físico vs sistema, cálculo de faltantes/sobrantes y comentarios.
12. `app/(tabs)/mas/productos.tsx`: Catálogo administrativo con marca, SKU, código de barras, precio de compra/venta y presentaciones.

---

### 6. Design System Propuesto
Se construirán componentes consistentes y modulares en `components/`:
- `AppShell`: Contenedor responsive (máximo ancho móvil en pantallas grandes, safe areas, status bar).
- `BottomNavigation`: Barra de navegación inferior móvil persistente con `Vender` con mayor jerarquía.
- `PageHeader`: Cabecera unificada con títulos, botones de retroceso, estado online y acciones.
- `DashboardTile`: Mosaicos grandes con gradientes sutiles, microinteracciones táctiles, badges e iconos.
- `SearchBar`: Campo de búsqueda de alta respuesta con debounce visual y botón para limpiar.
- `CategoryCard`: Selector visual tipo mosaico para categorías de productos con conteo.
- `ProductCard`: Tarjeta táctil con imagen/icono, marca, stock en piezas, favoritos y botón rápido `+`.
- `ClientCard`: Tarjeta de cliente con nombre, contacto, distancia mock, estado de crédito y acciones rápidas.
- `InventoryItem`: Elemento de inventario con conversión pieza/paquete/caja y stock badge.
- `QuantitySelector`: Selector táctil de cantidad con botones grandes `+` y `-`.
- `StockBadge`: Indicador visual (`Normal`, `Stock bajo`, `Agotado`) con colores semánticos claros.
- `MoneyDisplay`: Tipografía y color semántico para montos monetarios.
- `CartBar`: Barra flotante inferior persistente `🛒 Ver carrito · X productos · $Y`.
- `PresentationModal`: BottomSheet de selección de presentación (Pieza, Paquete, Caja, Exhibidor) con cálculo automático de piezas.
- `ConfirmDialog`: Modal accesible para confirmaciones críticas sin bloquear accidentalmente.
- `EmptyState`: Ilustración/icono y mensaje amigable para estados sin datos.
- `LoadingSkeleton`: Bloques pulsantes para carga asíncrona simulada.

---

### 7. Nueva Navegación
- **Tab Bar (5 accesos):**
  1. **Inicio** (`/`): Mosaicos táctiles según rol (Admin vs Vendedor).
  2. **Clientes** (`/clientes`): Directorio con filtros rápidos y acciones [Vender] / [Cobrar].
  3. **Vender** (`/venta`): Experiencia principal destacada visualmente.
  4. **Inventario** (`/inventario`): Mi inventario (vendedor) o Gestión multi-camioneta/bodega (admin).
  5. **Más** (`/mas`):
     - Rol ADMIN: Productos, Cortes, Cobranza, Rutas, Revisión de inventario, Auditoría, Configuración.
     - Rol VENDEDOR: Cobranza, Mi ruta, Perfil/Configuración.

---

### 8. Plan de Migración Visual por Fases
- **Fase A (Fundamentos):**
  - Actualizar `types/index.ts` con presentaciones y metadatos ampliados.
  - Implementar servicio centralizado `services/mockDataService.ts`.
  - Crear biblioteca de componentes del Design System en `components/`.
  - Actualizar `app/(tabs)/_layout.tsx` y `AppShell`.
  - Rediseñar Home Mosaico en `app/(tabs)/index.tsx` con soporte de roles.
- **Fase B (Flujo Vender):**
  - Rediseñar `app/(tabs)/venta/index.tsx` (cliente actual, buscador, frecuentes, categorías, productos mosaico).
  - Implementar modal de presentaciones y equivalencias (Pieza, Paquete, Caja, Exhibidor).
  - Rediseñar `app/(tabs)/venta/carrito.tsx` con desglose y conversión visual.
  - Rediseñar `app/(tabs)/venta/pago.tsx` con pago combinado y protección contra doble envío.
  - Rediseñar `app/(tabs)/venta/confirmacion.tsx` con folio, ticket simulado y navegación fluida.
- **Fase C (Clientes y Cobranza):**
  - Rediseñar `app/(tabs)/clientes.tsx` con `ClientCard` y filtros rápidos.
  - Ajustar detalle de cliente y flujo de cobranza visual.
- **Fase D (Inventario Vendedor & Admin):**
  - Crear `app/(tabs)/inventario.tsx` con vista Mi Inventario (vendedor) y Asignación/Bodega (admin).
- **Fase E (Módulos Admin: Corte, Revisión, Productos):**
  - Rediseñar `app/(tabs)/mas/corte.tsx` con vista por trabajador y detalle.
  - Crear `app/(tabs)/mas/revision.tsx` con barra de progreso y diferencias físico vs sistema.
  - Mejorar `app/(tabs)/mas/productos.tsx` con presentaciones y precios.
- **Fase F (Responsive, Estados UX y Contratos API):**
  - Validar responsive en móvil, tablet y web.
  - Probar estados de carga, vacíos y errores.
  - Generar `FRONTEND_API_CONTRACTS.md`.

---

### 9. Riesgos y Mitigaciones
1. **Riesgo:** Incompatibilidad de tipos al extender `Producto` o `ItemCarrito`.
   - *Mitigación:* Mantener propiedades existentes como base y agregar nuevos campos (`presentacion`, `piezasTotales`) como opcionales con valores predeterminados seguros.
2. **Riesgo:** Ruptura de navegación de Expo Router al reorganizar tabs.
   - *Mitigación:* Mantener rutas de stack existentes y agregar alias/tabs limpios sin eliminar rutas requeridas por el router.
3. **Riesgo:** Duplicación de lógica de conversión de unidades.
   - *Mitigación:* Centralizar cálculos de unidades en `services/mockDataService.ts` y helpers reutilizables.

---

### 10. Archivos a Crear / Modificar
- **A Crear:**
  - `FRONTEND_REDESIGN_PLAN.md` (este documento).
  - `FRONTEND_API_CONTRACTS.md` (documento de especificación para Fase 2).
  - `services/mockDataService.ts` (capa de servicios centralizada para desacoplar componentes).
  - `components/DesignSystem.tsx` (componentes nucleares: AppShell, SearchBar, CategoryCard, ProductCard, ClientCard, InventoryItem, PresentationModal, DashboardTile, CartBar, LoadingSkeleton, etc.).
  - `app/(tabs)/inventario.tsx` (pantalla de inventario directo en tab bar).
  - `app/(tabs)/mas/revision.tsx` (pantalla de revisión física de inventario para admin).
- **A Modificar:**
  - `types/index.ts` (tipos de presentación, rol de usuario, productos enriquecidos).
  - `constants/mockData.ts` (enriquecer productos con presentaciones y marcas, clientes con distancias mock).
  - `context/AppContext.tsx` (soporte para cambio de rol Admin/Vendedor, cliente activo y persistencia temporal).
  - `app/(tabs)/_layout.tsx` (nueva distribución de tabs con Vender elevado).
  - `app/(tabs)/index.tsx` (Home Mosaico táctil con rol dinámico).
  - `app/(tabs)/venta/index.tsx` (Nueva experiencia visual de venta).
  - `app/(tabs)/venta/carrito.tsx` (Carrito enriquecido con presentaciones y piezas).
  - `app/(tabs)/venta/pago.tsx` (Cobro mixto, tarjeta, efectivo, transferencia, crédito).
  - `app/(tabs)/venta/confirmacion.tsx` (Pantalla de confirmación con folio y ticket).
  - `app/(tabs)/clientes.tsx` (Directorio táctil con ClientCards y filtros rápidos).
  - `app/(tabs)/ruta/cliente/[id].tsx` (Detalle de cliente enriquecido).
  - `app/(tabs)/mas/index.tsx` (Menú filtrado por rol).
  - `app/(tabs)/mas/corte.tsx` (Corte multi-trabajador para admin).
  - `app/(tabs)/mas/productos.tsx` (Catálogo administrativo enriquecido).

---

### 11. Estado de Ejecución y Validación de Criterios (Fase 1 Completada)
- [x] **Flujo Completo de Venta:** Simulado y operable de inicio a fin:
  `Home mosaico` → `Vender` → `Cliente actual / selector modal` → `Buscador universal` → `Carrusel frecuentes` → `Categorías interactivas` → `ProductCard mosaico` → `Modal de presentaciones (Pieza / Paquete / Caja / Exhibidor con cálculo en tiempo real)` → `Carrito con stepper` → `Cobro mixto / combinado` → `Confirmación con folio y ticket digital`.
- [x] **Clientes:** Directorio táctil con filtros (`Todos`, `Hoy`, `Pendientes de cobro`, `Con crédito`, `Cercanos`), distancias mock y botones directos `[Vender]`, `[Cobrar]`, `[Ver]`.
- [x] **Inventario Dual:** Pestaña dedicada con selector `Bodega / Trabajadores` para Administrador y vista simplificada de consulta con equivalencias para Vendedor.
- [x] **Módulos Admin:** `Corte` por trabajador con desglose de caja/mercancía y `Revisión` rápida con progreso `X / Y`, cálculo físico vs sistema, faltantes/sobrantes y notas.
- [x] **Filtrado Dinámico por Rol:** Switch interactivo en cabecera para alternar al instante entre Miguel (Admin) y Vendedor (Juan).
- [x] **Barra Inferior:** Persistente, mobile-first, 5 accesos (`Inicio | Clientes | Vender | Inventario | Más`) con `Vender` destacado centralmente.
- [x] **Compilación y Tipos:** `npm run typecheck` (`tsc --noEmit`) verificado con 0 errores.
- [x] **Capa de Servicios y Mocks:** Centralizada en `services/mockDataService.ts`.
- [x] **Contratos de API:** Documento `FRONTEND_API_CONTRACTS.md` generado con DTOs y endpoints en C# .NET 9.

---

### 12. Fase 2 Ejecutada: Backend ASP.NET Core 9 y Base de Datos SQL Server
- [x] **Solución y Proyecto Backend:** Creada en `backend/RutaVentas.Api` con .NET 9.0 y C# 13.
- [x] **18 Controladores RESTful:** Implementados para Auth, Ventas, Clientes, Productos, Importaciones, Inventario, Cortes, Cobranza, Gastos, Devoluciones, Rutas, Empleados, Categorías, Bitácora, Reportes, Revisión y Sincronización.
- [x] **Modelos y Entidades EF Core 9:** 18 entidades relacionales con llaves foráneas, índices, restricciones y soporte de transacciones SQL (`IDbContextTransaction`).
- [x] **Seguridad y Criptografía:** Autenticación JWT HMAC-SHA256, contraseñas con hashing BCrypt, PIN numérico y control de idempotencia SHA-256 (`FileHash`) contra subidas repetidas de catálogos.
- [x] **Exportación Contable:** Endpoint `/api/v1/reportes/exportar-excel` con codificación UTF-8 BOM y delimitador `;` para compatibilidad transparente con Microsoft Excel.
- [x] **Fachada Unificada de Datos:** `services/httpApiService.ts` y `services/offlineSyncQueueService.ts` integrados en `mockDataService.ts` con conmutación transparente en vivo/fuera de línea.

---

### 13. Fase 3 Ejecutada: Ergonomía Móvil y Robustecimiento Operativo en Ruta
- [x] **Mosaico Compacto de 3 Columnas:** Cuadrícula ultra compacta en móviles con separación de 7 px (`gap: 7`), mostrando hasta 15 productos en pantalla sin scroll inicial.
- [x] **Stepper Condicional:** Las tarjetas sin agregar ocultan botones inferiores. Al tocar la tarjeta, se agrega 1 unidad y se activa el stepper `[−] [Cantidad] [+]` con áreas táctiles ≥ 44×44 px y digitación directa en el contador para pedidos grandes.
- [x] **Orden Personalizado Tipo Spotify ("Mi orden"):** Modal reordenable con botones rápidos ("🔝 Al inicio", "⬆️ Subir", "⬇️ Bajar") y persistencia por usuario en `localStorage` (`miguel_orden_catalogo_v1`).
- [x] **Favoritos Desacoplados:** Estrella táctil independiente en la esquina superior derecha de cada tarjeta que filtra la vista sin alterar el orden general ni el carrito.
- [x] **Mapa de Ruta 0 Scroll:** Integración de OpenStreetMap + Leaflet ajustada al 100% de la altura de pantalla en iPhone y Android sin desbordamiento vertical, marcadores gota, halo ámbar en selección, ficha compacta (~85 px) con botón directo a Vender, cálculo de distancias reales por GPS (`navigator.geolocation`) y panel modal colapsable de paradas.
- [x] **Parser PDF Resiliente de Surtido:** Descompresión zlib con Pako (soporte dual ESM/CJS), reconocimiento estructurado de tablas multipágina, mapeo de nombres de almacén vs app, auto-creación de productos y timeout seguro de 4.5s.
- [x] **Importación CSV Transaccional de Catálogo:** Previsualización en memoria, soporte contable español (`.` miles, `,` decimales), detección de 27 grupos ambiguos, idempotencia SHA-256 y protección de existencias en catálogo.
- [x] **Arranque Limpio (Zero-State):** Catálogos vacíos al inicio (`0 productos`, `0 clientes`), purga de semillas demo antiguas y generación segura de IDs (`cli_${Date.now()}`, `prod_${Date.now()}`).

---

### 14. Roadmap Estratégico (Fase 4: Próximas Mejoras con Codex)
1. **Soporte de Pesaje Decimal en Báscula:** Migrar campos de stock y venta de `int` a `decimal(18,3)` para permitir venta fraccionaria de carnes frías (ej. 0.450 kg de jamón).
2. **Autorización Remota Push de Sobregiro:** Notificaciones en tiempo real al teléfono de Don Miguel cuando un chofer requiera vender a crédito excediendo el límite pactado.
3. **Impresión Térmica Bluetooth Nativa (ESC/POS):** Driver directo para impresoras portátiles de cinturón de 58 mm y 80 mm sin intermediarios de diálogo del navegador.
4. **Optimización Inteligente de Ruta (TSP):** Algoritmo de recálculo dinámico de la secuencia de paradas considerando tráfico y ventanas horarias de apertura de cremerías.



### 15. Rediseño oliva/crema implementado localmente — 2026-11-08

La petición actual sustituye la composición anterior de tres columnas por **cuatro columnas** y selector Mosaicos/Lista. Se implementaron sistema visual común, Inicio, navegación, flujo Cliente → Productos → Resumen, preferencias web, pantallas administrativas y mapa con la cobertura detallada en [REDISENO_OLIVA_2026-11.md](docs/REDISENO_OLIVA_2026-11.md).

El stepper dentro de la tarjeta se sustituye por un panel de cantidad/presentación con controles cómodos; el total ocupa una fila de layout encima de las pestañas. Se preservan los registros históricos de fases anteriores como evidencia de aquella versión, sin considerarlos prueba del estado nuevo. El roadmap de pesaje/backend, push y Bluetooth sigue pendiente. TypeScript, exportación web, pruebas aisladas y build .NET pasaron; no hay despliegue ni certificación operativa integral.

## Seguimiento — 2026-11-09

Se agregó la corrección de las10 incidencias posteriores al rediseño. Consulta [INCIDENCIAS_UI_2026-11-09.md](docs/INCIDENCIAS_UI_2026-11-09.md) para archivos, pruebas y pendientes. El fondo principal es ahora blanco, conservando oliva; inventario no usa mosaico de venta. No se incorporaron datos ilustrativos a producción.

---

### 16. Fase 4 Implementada y Validación Integral — 2026-11-25 (Antigravity & Codex)

Se completaron e integraron al 100% los requerimientos de la Fase 4 y las prioridades de negocio y arquitectura pendientes:

1. **Pesaje Fraccionario Decimal (`decimal(18,3)`):**
   - Migración SQL `05_alter_columns_to_decimal18_3.sql` ejecutada en SQL Server. Columnas de existencias y detalles de venta ahora admiten fracciones de kilo (ej. 0.450 kg de jamón o queso).
   - Backend EF Core y DTOs adaptados para cálculo exacto sin redondeo truncado.
   - Prueba de integración en vivo `scripts/test_scale_decimal_sale.cjs` aprobada con venta real descontada con exactitud.

2. **Autorización Remota Push para Sobregiro:**
   - Tabla `SolicitudesSobregiro` en SQL Server y endpoints de solicitud, consulta y resolución en `VentasController.cs`.
   - Venta a crédito bloqueada con HTTP 422 si excede el límite del cliente, con opción para que el chofer solicite autorización en tiempo real y Don Miguel apruebe desde su dispositivo con un toque.
   - Ciclo completo verificado en vivo mediante `scripts/test_sobregiro_live.cjs`.

3. **Impresión Térmica Bluetooth Nativa Directa (ESC/POS):**
   - Servicio `services/bluetoothPrinterService.ts` con codificación ESC/POS binaria (`ESC @`, CP850 `ESC t 2`, acentos en español, corte `GS V`) y transmisión BLE en paquetes de 64 bytes para impresoras de cinturón (58 mm / 80 mm).
   - Botón directo en `components/TicketModal.tsx` sin cuadros de diálogo del sistema operativo (`window.print()`).
   - Verificado mediante `scripts/test_bluetooth_escpos.ts`.

4. **Arqueo Cuadrado con Fondo Inicial de Caja:**
   - Columna `FondoInicial` en tabla `Cortes` de SQL Server.
   - Fórmula oficial de arqueo unificada en frontend y backend: `EfectivoEsperado = FondoInicial + VentasEfectivo + Cobranza - Gastos`.
   - Impreso en tickets continuos de 58 mm y 80 mm sin salto arbitrario a 297 mm.

5. **Identidad Comercial Don Miguel & Segmentación por Camioneta:**
   - Identidad comercial oficial registrada en `app.json`: "DISTRIBUIDORA DON MIGUEL", RFC "MIGD750412AB1", León, Gto.
   - `InventarioController.cs` segmenta existencias por `Ubicacion` (Bodega vs Camioneta 1), verificado contra SQL Server en `scripts/test_inventory_segmentation.cjs`.

---

### 17. En qué nos quedamos en la implementación de pruebas

- **Pruebas Automatizadas en Verde (100% PASS):**
  - `npm run typecheck` (0 errores en TypeScript).
  - `dotnet build backend/RutaVentas.Api --no-restore` (0 errores, 0 advertencias).
  - `scripts/verify_incidents.cjs` (suite completa de regresión aprobada).
  - Pruebas vivas contra SQL Server: `test_scale_decimal_sale.cjs`, `test_sobregiro_live.cjs`, `test_inventory_segmentation.cjs`, `test_reportes_live.cjs`, `test_location_ts.ts`, `test_receipts_identity.ts`, `test_bluetooth_escpos.ts`.
- **Pruebas Pendientes / Siguiente Fase:**
  1. *Hardware Físico:* Vinculación en vivo con impresora física de cinturón BLE (Goojprt/Zebra) y báscula electrónica para captura automática de peso.
  2. *Offline Extremo:* Prueba de encolamiento masivo en `offlineSyncQueueService.ts` durante 1 jornada sin internet con reconexión posterior.
  3. *Runner CI/CD Unificado:* Creación de `npm test` con mocks en memoria para ejecución continua independiente de red.
  4. *Optimización Dinámica de Ruta (TSP):* Algoritmo de ruteo eficiente por ventanas horarias de cremerías.
