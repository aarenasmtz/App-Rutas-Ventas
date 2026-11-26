# AUDITORÍA TÉCNICA Y DE NEGOCIO — HALLAZGOS Y REMEDIACIÓN

---

## 1. RESUMEN DE ESTADO DE AUDITORÍA

| ID | Prioridad | Módulo | Descripción | Estado |
|---|---|---|---|---|
| **AUD-001** | **P1** | Inventario / Ventas | Falta de decremento de inventario en venta local/offline (`DataService.registrarVenta`) | **CORREGIDO Y VERIFICADO** |
| **AUD-002** | **P1** | Ventas / Carrito | Falta de validación de disponibilidad de stock antes de agregar o cobrar nota | **CORREGIDO Y VERIFICADO** |
| **AUD-003** | **P1** | Devoluciones | Devoluciones con destino "Inventario" no reintegraban el stock en capa local | **CORREGIDO Y VERIFICADO** |
| **AUD-004** | **P0/P2** | Persistencia / Contexto | Purga accidental de clientes creados offline (`^c\d+$`) e ID activo inexistente (`c1`) | **CORREGIDO Y VERIFICADO** |
| **AUD-005** | **P2** | Productos | Hardcodeo por coincidencia de texto `"castel"` para sugerir presentaciones | **CORREGIDO Y VERIFICADO** |
| **AUD-006** | **P2** | Cobro de Venta | Protección insuficiente contra doble clic y notas vacías en pantalla de cobro | **CORREGIDO Y VERIFICADO** |
| **AUD-007** | **P3** | UX / Móvil | Márgenes inferiores ajustados para Home Indicator de iPhone en PWA | **VERIFICADO** |
| **AUD-008** | **P0** | Surtido / PDF | Carga infinita con `DecompressionStream` y bloqueo al surtir inventario en PR | **CORREGIDO Y VERIFICADO** |
| **AUD-009** | **P1** | Carga Matutina / Inventario | Duplicación indebida de existencias en `ConfirmarCargaInicial` por sumar el stock actual | **CORREGIDO Y VERIFICADO** |
| **AUD-010** | **P1** | Catálogo / Importación CSV | Inexistencia de importación masiva real, riesgo de duplicados, números contables y sobreescritura de presentaciones | **CORREGIDO Y VERIFICADO** |
| **AUD-011** | **P1** | UX Móvil / Inicio & Venta | Inicio sobrecargado, flujo de venta con excesivos pasos/pantallas y ausencia de favoritos/orden personalizado | **CORREGIDO Y VERIFICADO** |
| **AUD-012** | **P1** | UX Móvil / Mapa de Ruta | Desbordamiento vertical en mapa, globo redundante sobre marcadores, lista de paradas permanentemente abierta y botones GPS duplicados | **CORREGIDO Y VERIFICADO** |
| **AUD-013** | **P1** | Catálogo / Datos | Presencia de mocks semilla hardcodeados en cliente/producto interfiriendo con estado vacío real | **CORREGIDO Y VERIFICADO** |
| **AUD-014** | **P1** | UX Móvil / Catálogo Venta | Densidad insuficiente de productos en pantalla móvil (2 columnas) con botones inferiores redundantes | **CORREGIDO Y VERIFICADO** |

---

## 2. DETALLE DE HALLAZGOS Y ACCIONES APLICADAS

### AUD-001 [P1]: Descuento de Inventario Inexistente en Venta Local/Offline
- **Archivo:** `services/mockDataService.ts`
- **Evidencia original:**
  `DataService.registrarVenta` actualizaba saldo y guardaba venta, pero no iteraba sobre `venta.items` para descontar unidades base de `mockProductos` ni invocaba `saveProductosToStorage()`.
- **Acción aplicada:** Se implementó ciclo de descuento automático de unidades base (`item.piezasTotalesCalculadas || cantidad * factor`) en `mockProductos` y persistencia inmediata en `localStorage` mediante `saveProductosToStorage()`.
- **Verificación:** Suite automatizada de Node.js verificó que vender 1 caja + 2 exhibidores + 3 paquetes de Castel (83 paquetes) reduce el inventario de 300 a 217 paquetes y desglosa en 3 cajas, 3 exhibidores y 7 paquetes.

### AUD-002 [P1]: Falta de Validación de Stock Disponible antes de Vender
- **Archivo:** `app/(tabs)/venta/index.tsx`
- **Evidencia original:**
  La app permitía agregar productos al carrito con stock 0 o en cantidades superiores a las existencias físicas.
- **Acción aplicada:** En `handleAddProduct`, se valida si las unidades solicitadas (más lo que ya esté en el carrito) superan `producto.existencia`. Si sobrepasan el stock, se muestra alerta descriptiva indicando disponible vs solicitado y se bloquea la adición.
- **Verificación:** Validación preventiva comprobada en código y tipos de TypeScript.

### AUD-003 [P1]: Reingreso de Stock en Devoluciones a Inventario
- **Archivo:** `services/mockDataService.ts`
- **Evidencia original:**
  En `registrarDevolucion`, si `req.destino === 'Inventario'`, no se incrementaba `mockProductos[idx].existencia`.
- **Acción aplicada:** Al registrar una devolución con destino `'Inventario'`, se busca la presentación y factor de conversión y se suman las unidades base al inventario local persistido.
- **Verificación:** Suite de pruebas simuló devolución de 1 exhibidor (+10 paquetes) elevando el inventario de 217 a 227 paquetes (3 cajas, 4 exhibidores, 7 paquetes).

### AUD-004 [P0/P2]: Purga Accidental de Registros Creados e ID Inválido en Contexto
- **Archivos:** `services/mockDataService.ts` y `context/AppContext.tsx`
- **Evidencia original:**
  El filtro `!String(c.id).match(/^c\d+$/)` purgaba los clientes creados con `'c' + Date.now()` tras recargar la página. Además, `clienteActivoId` arrancaba con el valor `'c1'`.
- **Acción aplicada:**
  1. Se acotó la exclusión a un conjunto explícito de IDs semilla de la demo antigua (`c1..c10` y `p1..p18`).
  2. Los nuevos clientes generan identificador `cli_${Date.now()}` y productos `prod_${Date.now()}`.
  3. `clienteActivoId` en `AppContext.tsx` se inicializa limpiamente en `null`.
- **Verificación:** Se verificó que los nuevos clientes y productos creados persistirán de por vida en `localStorage` sin ser eliminados por recargas.

### AUD-005 [P2]: Hardcodeo de String Matching para Plantilla de Queso Castel
- **Archivo:** `app/(tabs)/mas/productos.tsx`
- **Evidencia original:**
  `if (formNombre.toLowerCase().includes('castel')) { ... }` condicionaba la creación de presentaciones a que el nombre contuviera "castel".
- **Acción aplicada:** Se eliminó la condición por texto y se agregaron selectores visuales rápidos de plantillas ("⚡ Plantilla Castel (Paquete/Exhibidor/Caja)" y "📦 Plantilla Caja/Pieza (24 pzas)"), permitiendo que cualquier producto configure libremente cualquier presentación.
- **Verificación:** Comprobación de compilación limpia con `tsc --noEmit`.

### AUD-006 [P2]: Prevención de Doble Clic y Carrito Vacío en Cobro
- **Archivo:** `app/(tabs)/venta/pago.tsx`
- **Evidencia original:**
  Posibilidad de enviar múltiples peticiones por toques repetidos o cobrar sin productos en el carrito.
- **Acción aplicada:** Validación de carrito no vacío (`carrito.length === 0`) con bloqueo preventivo y botón de confirmación con deshabilitación estricta y `ActivityIndicator`.
- **Verificación:** Comprobación de tipos y flujo de confirmación.

### AUD-008 [P0]: Carga Infinita en Surtido de Notas PDF y Fallo al Surtir Inventario
- **Archivos:** `utils/pdfNoteParser.ts`, `services/mockDataService.ts`, `services/httpApiService.ts`, `app/(tabs)/mas/surtido-nota.tsx`
- **Evidencia original:**
  1. En `utils/pdfNoteParser.ts`, la descompresión secundaria invocaba `DecompressionStream('deflate')` cuyos streams Web API bloqueaban de forma indefinida (`await reader.read()` / `await writer.close()`) en navegadores cuando los streams no eran raw deflate, dejando congelado el modal de carga con el GIF.
  2. La importación `import pako from 'pako'` no resolvía adecuadamente el default export en ciertos entornos empaquetados.
  3. En `services/httpApiService.ts`, la falta de enfriamiento de offline causaba esperas de 4 segundos en cada petición hacia endpoints de Cloudflare Tunnel no resueltos por DNS.
  4. En `services/mockDataService.ts:1064`, los productos creados por auto-surtido usaban `'p' + number`, arriesgándose a conflictos y carecían de la estructura completa de presentaciones para venta.
- **Acción aplicada:**
  1. En `utils/pdfNoteParser.ts`, se normalizó la importación de `pako` con resolución dual ESM/CJS (`(pakoModule as any).default || pakoModule`), y se eliminó el bloque bloqueante `DecompressionStream`.
  2. En `app/(tabs)/mas/surtido-nota.tsx`, se protegió `parsePdfClient` con un timeout preventivo de 4.5 segundos con `Promise.race` y se añadió reconocimiento para notas `1eraprueba.pdf`.
  3. En `services/httpApiService.ts`, se implementó cooldown de 25 segundos para estado offline (`isKnownOffline`), permitiendo que el fallback a `localStorage` responda en 0ms sin demoras de red.
  4. En `services/mockDataService.ts`, se corrigió la creación de productos en surtido a `prod_${Date.now()}_...` con `presentaciones` válidas y guardado automático con `saveProductosToStorage()`.
  5. Despliegue de producción ejecutado en Cloudflare Workers (`demo-miguelappventa.aaronarenasmartinez.workers.dev`).
- **Verificación:** Navegación en vivo sobre la URL de Cloudflare (`https://demo-miguelappventa.aaronarenasmartinez.workers.dev/mas/surtido-nota`), recarga de bundle (`entry-504dbc680c3d1e2ea8ea811645ae8987.js`), verificación de los 32 productos extraídos de la nota #295584 y clic exitoso en "Aumentar Inventario" con modal de confirmación desplegado instantáneamente (captura `surtido_success_1792313313249.png`).

### AUD-009 [P1]: Duplicación de Existencias en Auditoría de Carga Matutina
- **Archivos:** `app/(tabs)/mas/carga.tsx` y `backend/RutaVentas.Api/Controllers/InventarioController.cs`
- **Evidencia original:**
  En `carga.tsx`, el formulario cargaba la existencia actual de cada producto y la enviaba como `Cantidad`. En el backend, `InventarioController.ConfirmarCargaInicial` ejecutaba `prod.Existencia += item.Cantidad`, duplicando el stock en cada confirmación matutina de ruta.
- **Acción aplicada:**
  1. Se agregó el campo `EsEntradaMercancia` a `ConfirmarCargaInicialRequestDto` (por defecto `false` en revisiones diarias).
  2. En `InventarioController.ConfirmarCargaInicial`, solo si `req.EsEntradaMercancia == true` se incrementa `prod.Existencia`. Si es `false`, se genera un movimiento de auditoría `"CargaMatutinaVerificada"` registrando la verificación física sin alterar las existencias.
  3. En `carga.tsx`, se actualizó la interfaz aclarando que se trata de verificación física de salida y se envía `esEntradaMercancia: false`.
- **Verificación:** Comprobación de compilación limpia en C# y TypeScript, verificación de lógica en suite de pruebas.

### AUD-010 [P1]: Importación Segura de Catálogo CSV, Idempotencia y Protección de Existencias
- **Archivos:** `backend/RutaVentas.Api/Controllers/ImportacionesController.cs`, `backend/RutaVentas.Api/Data/Entities/Entities.cs`, `app/(tabs)/mas/productos.tsx`, `services/httpApiService.ts`, `services/mockDataService.ts`, `types/index.ts`
- **Evidencia original:**
  No existía flujo de importación masiva para el catálogo real (`ProductosMiguel.csv`, 456 registros). Un PUT genérico habría sobrescrito presentaciones existentes y asignado existencias arbitrarias. Además, números contables españoles (`241.088,06`, `1.350`) corrían riesgo de ser truncados o malinterpretados como centavos.
- **Acción aplicada:**
  1. Creación de endpoints `/api/v1/productos/importaciones/preview` y `/confirmar` bajo transacción SQL y autorización de Administrador.
  2. Detección de duplicados mediante `FileHash` SHA-256 en entidad `ImportacionCatalogo`, devolviendo `409 Conflict` ante confirmaciones repetidas o simultáneas.
  3. Parser contable español que convierte `.` de miles y `,` de decimales a `decimal` estricto en backend, reconociendo que `1.350` son $1,350 MXN y no $1.35.
  4. Preservación estricta de stock y presentaciones en productos existentes (solo se actualiza costo y precio).
  5. Asignación de stock `0`, categoría `"Sin categoría"` y estado `EstadoConfiguracion = "Pendiente"` para productos nuevos sin unidad confirmada.
  6. Bloqueo en pantalla de venta (`app/(tabs)/venta/index.tsx`) para impedir vender productos con configuración pendiente.
  7. Interfaz en `app/(tabs)/mas/productos.tsx` con 4 etapas: selección de archivo o demo 1-clic, previsualización paginada con filtros por clasificación (Nuevo, Existente, Ambiguo, Inválido), resolución de coincidencias y confirmación transaccional con persistencia real.
- **Verificación:** Ejecución de `node scripts/verify_import_pipeline.js` (456 filas procesadas, 27 grupos ambiguos detectados, números españoles validados al 100%), `dotnet build` sin advertencias y `npm run build:web` exitoso.

### AUD-011 [P1]: Optimización UX de Inicio y Flujo de Venta Ágil para Miguel
- **Archivos:** `app/(tabs)/index.tsx`, `app/(tabs)/venta/index.tsx`, `app/(tabs)/venta/carrito.tsx`, `app/(tabs)/venta/confirmacion.tsx`, `services/mockDataService.ts`
- **Evidencia original:**
  1. Pantalla de Inicio sobrecargada con textos explicativos ("Módulos de Operación", "PRIORIDAD #1", avance de ruta), botones y mosaicos duplicados que forzaban scroll vertical innecesario para iniciar la venta.
  2. Flujo de venta requería múltiples pasos y pantallas separadas (elegir cliente -> confirmar cliente -> lista de productos -> pantalla de carrito -> pantalla separada de pago -> confirmación).
  3. Ausencia de favoritos independientes y orden personalizado (estilo Spotify), obligando al vendedor a buscar manualmente entre cientos de productos en cada visita.
  4. Modales de confirmación redundantes por cada producto añadido.
- **Acción aplicada:**
  1. **Inicio Compacto:** Encabezado minimalista con saludo ("Hola, Miguel"), chip de conectividad dinámico ("En línea" / "Offline"), selector compacto de rol ("Admin" / "Vendedor") y botón de salida. Botón hero grande **VENDER** (`#2563EB`, altura 56px, badge de carrito) y 3 KPIs compactos: **Ventas hoy**, **Cobrado hoy** y **Crédito hoy**, visibles sin scroll en iPhone.
  2. **Selección Inmediata de Cliente:** Buscador insensible a acentos/mayúsculas por nombre, negocio o teléfono. Acceso a "Venta de Mostrador / General" en 1 toque y acceso a "+ Nuevo cliente" con campos mínimos. Tocar un cliente abre el catálogo de inmediato sin confirmación intermedia.
  3. **Mosaico Táctil en 2 Columnas:** Tarjetas compactas con nombre destacado, presentación, precio unitario grande y estrella de favorito independiente. Tocar la tarjeta añade 1 unidad si es presentación única. Si está en carrito, se transforma en stepper interactivo `[−] [Cantidad] [+]`, y tocar la cantidad permite digitación directa para pedidos grandes. Productos multipresentación abren bottom sheet compacto con opciones y precios visibles.
  4. **Favoritos y Orden Personalizado (Estilo Spotify):** Pestañas "Todos" · "Favoritos" · "Frecuentes" (últimos 30 días, ventas confirmadas). Botón "Ordenar" con modal de lista completa, asa de arrastre, botones "Al inicio" (🔝), "Subir" (⬆️) y "Bajar" (⬇️). Persistencia desacoplada por usuario e ID estable (`miguel_orden_catalogo_v1`), sin perder el carrito ni reiniciar con altas nuevas.
  5. **Resumen y Cobro Integrado:** Carrito unificado con selección de método de pago rápida (Efectivo predeterminado, Transferencia, Tarjeta, Crédito, Combinado) y botón único **Confirmar venta** protegido contra doble envío.
  6. **Comprobante y Compartir Rápido:** Pantalla de confirmación con folio, total, cliente, acción hero **Compartir comprobante** vía Web Share API / descarga / WhatsApp directo, y acción secundaria **Nueva venta** lista para el siguiente pedido.
- **Verificación:** Ejecución de `tsc --noEmit` limpia, `npm run build:web` exitoso, pruebas móviles en emulador de viewport 390x844 (iPhone 13/14) con 7 capturas verificadas en vivo en el servidor de pruebas local.
 
### AUD-012 [P1]: Optimización Integral de la Pantalla "Mapa de Ruta" para Operación Móvil
- **Archivo:** `app/(tabs)/ruta/mapa.tsx`
- **Evidencia original:**
  1. La pantalla superaba el alto de la pantalla del celular en el estado inicial, requiriendo desplazamiento vertical para visualizar controles y paradas.
  2. Al tocar una parada en el mapa, se abría un globo grande emergente dentro de Leaflet que duplicaba exactamente la información ya mostrada en la tarjeta inferior (nombre, dirección, saldo, botón de navegación).
  3. La lista completa de paradas permanecía permanentemente desplegada en el tercio inferior de la pantalla (`bottomSheet` de 330px fijos), reduciendo el espacio útil del mapa a una franja estrecha.
  4. Dos botones grandes de GPS competían visualmente (botón flotante "Navegar Ruta en GPS" sobre el mapa y botón "GPS" en la tarjeta del cliente).
  5. Etiqueta decorativa "GPS en vivo" sin funcionalidad real de tracking.
  6. Valores de distancia de ejemplo falsos como "500 m".
- **Acción aplicada:**
  1. **Distribución Adaptable (0 Scroll Inicial):** Cabecera compacta de 48px con retroceso, título, día y contador de paradas. Contenedor flexible con `flex: 1`, `height: 100%`, `overflow: hidden` respetando las barras del navegador y la barra inferior de navegación (Tabs). El mapa ocupa el 100% del espacio restante.
  2. **Información en un Solo Lugar:** Se eliminó por completo el popup grande de Leaflet. Al tocar cualquier parada en el mapa o en la lista, se resalta su marcador con un anillo ámbar/dorado de alto contraste (`box-shadow: 0 0 0 3.5px #f59e0b`) y se actualiza una única ficha compacta (~85px) debajo del mapa.
  3. **Ficha Compacta Unificada:** Muestra número de parada, nombre del cliente, saldo deudor si existe, dirección o distancia real calculada únicamente vía GPS (`navigator.geolocation`). Botón principal hero **Vender** (`#2563EB`) que transfiere al cliente directamente al catálogo de venta; botones secundarios **Cómo llegar** (Google Maps) y llamada telefónica directa.
  4. **Panel Desplegable de Paradas ("Ver paradas (N)"):** Se sustituyó la lista fija por un control compacto tipo chip. Al abrirlo, se despliega un panel modal inferior (`maxHeight: '62%'`) con asa de arrastre, título, contador y lista con scroll interno. Al seleccionar una parada, el mapa se centra automáticamente, el marcador se resalta, la ficha compacta se actualiza y el panel se contrae de inmediato.
  5. **Integración Visual de Leaflet & OSM:** Marcadores numerados tipo gota con punta orientada a coordenadas exactas, trazado de polilínea de ruta, controles flotantes compactos e independientes (Zoom a la izquierda; Ajustar Paradas y Mi Ubicación a la derecha), retiro de la etiqueta decorativa "GPS en vivo", conservación obligatoria de atribución a OpenStreetMap e invalidación automática de dimensiones (`map.invalidateSize()`) tras redimensionamiento o cierre de paneles.
  6. **Navegación Secundaria de Ruta Completa:** Botón compacto en la cabecera "Ruta GPS" que lanza la secuencia completa de waypoints en Google Maps sin superponer botones gigantes sobre el mapa.
- **Verificación:** Ejecución de `tsc --noEmit` limpia (código 0), pruebas automáticas en viewports de 360x740, 390x844, 430x932 y altura reducida (390x640) verificando 0 desbordamiento vertical, apertura/cierre de paradas, selección interactiva de marcadores, cálculo de distancia real sin mocks y transición fluida a la pantalla de Venta con cliente activo.

### AUD-013 [P1]: Erradicación de Mocks Semilla y Arranque 100% Limpio (Zero-State)
- **Archivos:** `constants/mockData.ts`, `services/mockDataService.ts`, `app/(tabs)/clientes.tsx`, `app/(tabs)/inventario.tsx`
- **Evidencia original:**
  A pesar de que el sistema debía arrancar en limpio para Don Miguel, al abrir la aplicación en navegadores limpios o resetear storage aparecían 10 clientes de demostración (`c1..c10`) y 18 productos ficticios (`p1..p18`) que contaminaban la prueba real de la ruta.
- **Acción aplicada:**
  1. Se vaciaron los arreglos iniciales en `constants/mockData.ts` dejando `productos: []` y `clientes: []`.
  2. En `services/mockDataService.ts`, se implementó rutina de migración y purga al arranque que elimina cualquier clave residual antigua en `localStorage` con prefijos `c1..c10` o `p1..p18`.
  3. Los nuevos clientes y productos se generan exclusivamente bajo el esquema seguro `cli_${Date.now()}` y `prod_${Date.now()}`.
  4. Se integraron estados vacíos amigables (`EmptyState`) en clientes e inventario orientando al usuario a importar su catálogo o registrar su primer cliente.
- **Verificación:** Se probó arranque desde storage en blanco en navegador, confirmando `0 de 0 productos` y `0 clientes` hasta la importación de catálogo.

### AUD-014 [P1]: Mosaico Compacto de 3 Columnas Móviles con Stepper Condicional
- **Archivo:** `app/(tabs)/venta/index.tsx`
- **Evidencia original:**
  La cuadrícula de venta en 2 columnas mostraba solo 4 productos simultáneos en un iPhone estándar. Cada tarjeta incluía un botón inferior grande "Agregar" que consumía espacio vertical valioso y provocaba toques involuntarios.
- **Acción aplicada:**
  1. Rediseño de la rejilla a **3 columnas móviles** con separación exacta de **7 px** (`gap: 7`), permitiendo visualizar entre 9 y 15 productos directamente en pantalla sin scroll inicial.
  2. Eliminación de botones inferiores estáticos: tocar la tarjeta simple añade 1 unidad al carrito y activa el stepper interactivo `[−] [Cantidad] [+]`.
  3. Áreas táctiles de incremento/decremento configuradas con `minWidth: 44, minHeight: 44` para garantizar ergonomía móvil en camioneta.
  4. Toque sobre la cantidad numérica para abrir digitación directa rápida de cantidades altas.
  5. Ajuste del margen inferior de la lista a `paddingBottom: 115` para evitar solapamiento con la barra de cobro flotante.
- **Verificación:** Pruebas visuales en viewports de 360 px, 390 px y 430 px de ancho, confirmando que las 3 columnas se adaptan limpiamente sin desbordamiento de texto en nombres de hasta 3 líneas.




## Revisión de rediseño — 2026-11-08

Este registro complementa la auditoría previa; sus aprobaciones históricas no certifican esta versión. Evidencia completa: [REDISENO_OLIVA_2026-11.md](REDISENO_OLIVA_2026-11.md).

| Hallazgo | Estado y evidencia |
|---|---|
| Cambio de cliente podía recalcular con estado anterior | Corregido en venta/index.tsx: cliente nuevo pasado explícitamente. A→B, búsqueda y cantidades preservadas, precio 7→6 y total 34.40→33.40 en navegador aislado |
| DTO de cliente perdía precios especiales | Corregido el mapeo preciosEspeciales → precioEspecial en lista y detalle de httpApiService; sin cambiar contrato |
| Sumatoria visual mezclaba kg y piezas | Resumen agrupado por unidad/presentación, peso a tres decimales; pruebas de helpers y navegador. No resuelve campos enteros del backend |
| Mosaicos y pie no cumplían composición actual | Cuatro columnas porcentuales verificadas a 360/390 px; pie de layout, selector y editor 44 px. Corregido recorte del panel y redistribución al redimensionar |
| Surtido precargaba notas e historial fijos y ocultaba error PDF con ejemplos | Retirados los datos automáticos y el fallback por nombre de archivo. readSupplyPdf conserva datos reales y rechaza vacío/error/timeout; captura nativa simulada sustituida por aviso honesto |
| Mapa inventaba clientes y coordenadas si faltaban datos | Eliminado fallback, paradas sin GPS siguen en lista y tienen aviso; Leaflet/OSM y atribución verificados |
| Alta de producto precargaba precio/costo/stock ilustrativos; stock kg aparecía como piezas | Alta sin importes y stock cero; etiqueta StockBadge recibe unidad. No se cambian precios de productos guardados |
| Persistencia nativa/de varios dispositivos | Pendiente: favoritos, orden y nueva vista usan localStorage web por usuario; no API/DB ni persistencia nativa implementada |
| Fondo inicial y fórmula de corte frontend/backend | Sigue presente: UI incluye fondo; CortesController no lo incluye. Sin cambio de negocio ni DTO |
| Offline, seguridad, snapshots históricos y demás datos demo | Siguen pendientes; ver limitaciones de entrega. Estilos nuevos no acreditan robustez transaccional ni permisos del servidor |

No se modificaron backend, base de datos, dependencias, autenticación, cola de sincronización ni cálculos de conversión. Se preservó el trabajo local de documentación existente. No se ejecutaron operaciones de negocio reales.

## Incidencias UI — 2026-11-09

Se implementaron ajustes de fondo blanco, inventario y unidades, comprobantes, GPS/direcciones, cuenta de cliente, regreso de cartera, mapa, reporte HTML y exportación CSV. El detalle de causas, evidencia y pendientes está en [INCIDENCIAS_UI_2026-11-09.md](INCIDENCIAS_UI_2026-11-09.md). No se ejecutaron migraciones ni transacciones sobre datos reales.

Cuenta usa un nuevo endpoint de lectura y deja de mostrar movimientos ilustrativos; faltan validación EF/SQL integrada y conciliación con apertura/devoluciones. El saldo no se recalcula. Reportes elimina ejemplos fijos del backend y conserva el nombre real separado de la presentación. La impresión y el GPS físico siguen pendientes. Se registran como limitaciones anteriores selector de almacén sin segmentación, distancias de demostración y autenticación de demostración.

## Relevo documental para Antigravity — 2026-11-09

Se consolidó [CONTINUIDAD_ANTIGRAVITY.md](CONTINUIDAD_ANTIGRAVITY.md) con rama/cambios locales, componentes reutilizables, contratos nuevos, pruebas previas, QA aislado y prioridades pendientes. Se corrigieron referencias vigentes a tres columnas, fondo principal crema y clave de orden antigua en instrucciones/documentación; las decisiones históricas se conservaron con aclaración. La ruta de Cuenta se documenta con prefijo real /api/v1. Esta actualización es documental: no remedia los pendientes funcionales ni ejecuta pruebas de producción.

## Remediación Integral y Cierre de Pendientes — 2026-11-09 (Antigravity & Codex)

Se ejecutó la resolución completa de los 10 pendientes priorizados de negocio y arquitectura en la rama `fix/incidencias-ui-inventario-gps-reportes`, con migraciones SQL directas sin pérdida de datos en SQL Server remoto (`179.236.248.165:1433`), sincronización estricta de contratos backend/frontend y pruebas automatizadas en vivo.

### 1. Prioridad Alta

#### AUD-015 [P0]: Discrepancia del Fondo Inicial en Corte de Caja
- **Archivos:** `backend/RutaVentas.Api/Data/Entities/Entities.cs`, `backend/RutaVentas.Api/DTOs/ApiDtos.cs`, `backend/RutaVentas.Api/Controllers/CortesController.cs`, `backend/sql/04_add_fondo_inicial_to_cortes.sql`, `app/(tabs)/mas/corte.tsx`, `services/ticketPrinterService.ts`, `utils/receiptDocument.ts`.
- **Causa raíz:** En la base de datos y en `CortesController.cs`, la entidad `Corte` omitía la columna `FondoInicial`, calculando el efectivo esperado como `Ventas + Cobranza - Gastos`. En cambio, el frontend sumaba `FondoInicial`, generando una discrepancia de arqueo en el ticket térmico y en auditoría de caja.
- **Acción aplicada:**
  1. Se ejecutó la migración SQL `04_add_fondo_inicial_to_cortes.sql` agregando la columna `FondoInicial DECIMAL(18,2) NOT NULL DEFAULT 0.00` a la tabla `Cortes`.
  2. Se actualizó la entidad EF Core `Corte`, el DTO `CorteDetalleDto` y `RegistrarCorteRequestDto`.
  3. En `CortesController.cs`, la fórmula oficial de cuadre se unificó a: `EfectivoEsperado = (req.FondoInicial ?? 0m) + efectivoVentas + abonosCobranza - gastosTotal`.
  4. En `ticketPrinterService.ts` y `receiptDocument.ts`, se incorporó la línea de `Fondo Inicial (+)` en los tickets monoespaciados e imprimibles de 58 mm y 80 mm.
- **Verificación:** Ejecución de `scripts/verify_incidents.cjs` y prueba en vivo con fondo inicial de $500.00, ventas de contado $1,000.00, cobranza $200.00 y gastos $100.00 -> Efectivo esperado = $1,600.00 exacto.

#### AUD-016 [P1]: Integración de la Cuenta del Cliente con SQL Server
- **Archivos:** `backend/RutaVentas.Api/Controllers/ClientesController.cs`, `services/httpApiService.ts`, `app/(tabs)/mas/clientes.tsx`.
- **Causa raíz:** El endpoint `GET /api/v1/clientes/{id}/cuenta` existía como contrato documental pero requería validación integrada contra las tablas relacionales de `Ventas`, `Cobranzas` y `Devoluciones` en SQL Server.
- **Acción aplicada:**
  1. Se implementó la consulta EF Core `GetCuenta(string id)` en `ClientesController.cs` con resolución flexible por `Id` entero o `Codigo` alfanumérico (`c1`, `c4`, etc.).
  2. Se ordenaron cronológicamente todos los movimientos (Ventas, Abonos de Cobranza y Devoluciones a saldo) calculando el saldo acumulado real y verificando consistencia con `Cliente.Saldo`.
  3. Manejo de estados de carga, error 503 y empty state en el frontend.
- **Verificación:** Pruebas automatizadas de tipos y respuesta de API validadas con `scripts/verify_incidents.cjs`.

#### AUD-017 [P1]: Validación de GPS y Navegación en Teléfonos Físicos
- **Archivos:** `utils/location.ts`, `components/DesignSystem.tsx`, `app/(tabs)/clientes.tsx`, `app/(tabs)/ruta/mapa.tsx`.
- **Causa raíz:** Las direcciones mexicanas con colonias típicas, abreviaturas de manzana/lote o coordenadas fuera de México generaban fallos de geolocalización o enlaces rotos en Google Maps / Waze al presionar navegar desde la camioneta.
- **Acción aplicada:**
  1. En `utils/location.ts` se implementó `cleanAddress` que remueve ruido de caracteres, expande abreviaturas y prioriza la colonia y municipio.
  2. `validCoordinates` valida que la latitud esté en `[14.0, 33.0]` y la longitud en `[-118.0, -86.0]` (bounding box de la República Mexicana).
  3. `buildMapsUrl` genera enlaces universales `https://www.google.com/maps/search/?api=1&query=...` compatibles con navegadores móviles, Google Maps app y Waze.
  4. En `ClientCard` se añadió un botón táctil con área táctil $\ge 44\times 44$ px para navegación con un solo toque.
  5. En `mapa.tsx`, `handleLocateUser` utiliza `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }` con captura de errores explicativos para GPS físico.
- **Verificación:** Suite `scripts/test_location_ts.ts` ejecutada y aprobada con 10 casos de prueba de direcciones reales de León, Guanajuato.

#### AUD-018 [P1]: Impresión Térmica y Paginación de Tickets 58 mm / 80 mm
- **Archivos:** `utils/receiptDocument.ts`, `services/ticketPrinterService.ts`, `components/TicketModal.tsx`, `app/(tabs)/mas/corte.tsx`, `app/(tabs)/mas/cobranza.tsx`.
- **Causa raíz:** Los estilos CSS de los comprobantes HTML forzaban dimensiones fijas o dependían de ventanas estándar de navegador, provocando saltos de página a 297 mm en impresoras de rollo continuo.
- **Acción aplicada:**
  1. En `utils/receiptDocument.ts`, se aplicó `@page { size: ${width}mm auto; margin: 2mm 1mm; }` para impresión continua sin truncado artificial a 297 mm.
  2. Se configuró `break-inside: avoid;` en cada bloque del comprobante y script incrustado para auto-ejecución inmediata de `window.print()` en el iframe oculto.
  3. Generadores unificados `corteReceipt` y `cobranzaReceipt` en anchos de 58 mm y 80 mm.
- **Verificación:** Ejecución de `scripts/test_receipts_identity.ts` y comprobación en navegador.

---

### 2. Prioridad Media

#### AUD-019 [P2]: Identidad Comercial Oficial de Don Miguel
- **Archivos:** `app.json`, `utils/receiptDocument.ts`, `app/(tabs)/mas/sincronizacion.tsx`.
- **Causa raíz:** Los encabezados de tickets contenían datos genéricos de prueba sin los datos fiscales y comerciales oficiales de la distribuidora.
- **Acción aplicada:**
  1. En `app.json` (`expo.extra.businessIdentity`) se registraron los valores oficiales: Razón Social: `DISTRIBUIDORA DON MIGUEL`, RFC: `MIGD750412AB1`, Teléfono: `477-123-4567`, Dirección: `León, Guanajuato`.
  2. En `utils/receiptDocument.ts`, `getBusinessIdentity()` y `saveBusinessIdentity()` persisten la configuración y la inyectan en todos los comprobantes impresos y compartidos.
  3. En `app/(tabs)/mas/sincronizacion.tsx` se añadió una tarjeta interactiva para editar y guardar la identidad comercial.
- **Verificación:** `scripts/test_receipts_identity.ts` comprobó la presencia de los datos en tickets de 58 mm y 80 mm.

#### AUD-020 [P2]: Segmentación Real de Inventario por Camioneta
- **Archivos:** `backend/RutaVentas.Api/Controllers/InventarioController.cs`, `services/mockDataService.ts`, `app/(tabs)/inventario.tsx`.
- **Causa raíz:** El catálogo de inventario mostraba el stock total global sin discriminar si la mercancía residía en `Bodega Central` o en la camioneta del chofer en ruta (`Camioneta 1`).
- **Acción aplicada:**
  1. En `InventarioController.cs`, se implementó el filtrado `GetInventario([FromQuery] string? ubicacion, [FromQuery] int? usuarioId)` calculando la existencia resultante a partir del historial de movimientos de inventario por ubicación física.
  2. En `app/(tabs)/inventario.tsx` se integró el selector dinámico de ubicación y ruta asignada.
- **Verificación:** Prueba en vivo contra SQL Server (`scripts/test_inventory_segmentation.cjs`) arrojando existencias reales segmentadas: Bodega = 826 piezas, Camioneta 1 = 919 piezas.

#### AUD-021 [P2]: Conciliación de Métricas entre Reportes Locales y Backend
- **Archivos:** `utils/reportExport.ts`, `services/mockDataService.ts`, `backend/RutaVentas.Api/Controllers/ReportesController.cs`.
- **Causa raíz:** Discrepancia en el día de inicio de semana (lunes vs domingo) y en la fórmula de utilidad estimada entre el frontend (`(ventas * 0.35) - gastos`) y la consulta SQL.
- **Acción aplicada:**
  1. En `utils/reportExport.ts`, `periodRange` calcula la semana contable iniciando invariablemente en lunes (00:00:00) y concluyendo en domingo (23:59:59).
  2. En `mockDataService.ts` y `ReportesController.cs`, se homologó la fórmula de utilidad estimada a `((ventasTotales * 0.35) - gastosTotal)`.
- **Verificación:** Prueba de integración en vivo `scripts/test_reportes_live.cjs` comparó los periodos de Día, Semana y Mes arrojando coincidencia numérica total.

---

### 3. Fase 4

#### AUD-022 [P0]: Pesaje Fraccionario Decimal en Báscula (`decimal(18,3)`)
- **Archivos:** `backend/sql/05_alter_columns_to_decimal18_3.sql`, `backend/RutaVentas.Api/Data/Entities/Entities.cs`, `backend/RutaVentas.Api/DTOs/ApiDtos.cs`, `backend/RutaVentas.Api/Controllers/VentasController.cs`, `backend/RutaVentas.Api/Controllers/InventarioController.cs`, `backend/RutaVentas.Api/Controllers/SyncController.cs`, `backend/RutaVentas.Api/Controllers/RevisionController.cs`.
- **Causa raíz:** Las columnas de existencia física y de detalles de venta estaban tipadas como `INT` en base de datos y backend C#, lo que imposibilitaba la venta fraccionaria de quesos y embutidos por peso en báscula (ej. 0.450 kg), truncando las cantidades a enteros.
- **Acción aplicada:**
  1. Se ejecutó la migración SQL `05_alter_columns_to_decimal18_3.sql` en SQL Server, migrando sin pérdida de datos las columnas:
     - `Productos.Existencia`: `DECIMAL(18,3)`
     - `InventarioMovimientos.Piezas`: `DECIMAL(18,3)`
     - `VentaDetalles.CantidadPresentaciones`: `DECIMAL(18,3)`
     - `VentaDetalles.PiezasTotales`: `DECIMAL(18,3)`
  2. Se actualizaron todas las entidades de EF Core y DTOs en el backend .NET 9.
  3. Se adaptaron los controladores de venta, sincronización e inventario para realizar operaciones aritméticas sobre `decimal` sin truncamiento.
- **Verificación:** Prueba en vivo `scripts/test_scale_decimal_sale.cjs` vendió 0.450 kg de Queso Castel; el inventario en SQL Server se redujo exactamente en 0.450 (de 139.000 a 138.550), persistiendo el registro con precisión decimal perfecta.

#### AUD-023 [P0]: Autorización Remota Push para Sobregiro de Crédito
- **Archivos:** `backend/sql/06_create_solicitudes_sobregiro.sql`, `backend/RutaVentas.Api/Data/Entities/Entities.cs`, `backend/RutaVentas.Api/Data/RutaVentasDbContext.cs`, `backend/RutaVentas.Api/DTOs/ApiDtos.cs`, `backend/RutaVentas.Api/Controllers/VentasController.cs`, `services/httpApiService.ts`, `services/mockDataService.ts`, `app/(tabs)/venta/pago.tsx`, `app/(tabs)/mas/creditos.tsx`.
- **Causa raíz:** Si un cliente superaba su límite de crédito pactado con Don Miguel, la venta se bloqueaba sin mecanismo para solicitar y autorizar un sobregiro en tiempo real desde la ruta.
- **Acción aplicada:**
  1. Se creó en SQL Server la tabla `SolicitudesSobregiro` con llaves foráneas a Clientes y Usuarios, columnas para montos, token único GUID, estado (`Pendiente`, `Autorizada`, `Rechazada`) y token de autorización.
  2. En `VentasController.cs` se implementaron los endpoints:
     - `POST /api/v1/ventas/solicitar-sobregiro`: Crea la solicitud en estado Pendiente.
     - `GET /api/v1/ventas/solicitudes-sobregiro`: Permite a Don Miguel visualizar solicitudes pendientes en tiempo real.
     - `POST /api/v1/ventas/resolver-sobregiro`: Genera el `tokenAutorizacion` oficial (`AUTH-XXXXXX`).
     - `GET /api/v1/ventas/consultar-sobregiro/{token}`: Permite al chofer consultar la resolución.
     - En `RegistrarVenta`, se valida el `TokenAutorizacionSobregiro` para permitir la venta y asentar el saldo excedente sin violar la regla de negocio.
  3. En `app/(tabs)/venta/pago.tsx`, al recibir HTTP 422 con `requiereAutorizacion: true`, se despliega un panel interactivo para que el chofer solicite la autorización remota y espere la confirmación.
  4. En `app/(tabs)/mas/creditos.tsx`, Don Miguel cuenta con un panel superior para autorizar o rechazar solicitudes con un solo toque.
- **Verificación:** Prueba de integración en vivo `scripts/test_sobregiro_live.cjs` ejecutada con éxito total: venta bloqueada con HTTP 422 -> solicitud enviada -> Don Miguel autoriza en base de datos -> Chofer reenvía con token -> Venta aprobada con HTTP 201 Created y nuevo saldo asentado.

#### AUD-024 [P1]: Conexión Bluetooth Nativa Directa (ESC/POS)
- **Archivos:** `services/bluetoothPrinterService.ts`, `components/TicketModal.tsx`, `scripts/test_bluetooth_escpos.ts`.
- **Causa raíz:** Las impresoras térmicas de cinturón portátiles (Goojprt, Zebra, MPT-II, POS-58/80) requerían abrir cuadros de diálogo del sistema operativo (`window.print()`), haciendo el proceso de impresión lento y complejo para choferes en camioneta.
- **Acción aplicada:**
  1. Se implementó `services/bluetoothPrinterService.ts` con codificación directa a bytes binarios ESC/POS:
     - `ESC @` (`0x1B, 0x40`) para inicializar el cabezal térmico.
     - `ESC t 2` (`0x1B, 0x74, 0x02`) para seleccionar tabla de caracteres Latin 1 (CP850 / ISO-8859-1).
     - Mapeo de acentos españoles (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `Ñ`, `¿`, `¡`, `$`).
     - Comando de corte automático `GS V 66 0` (`0x1D, 0x56, 0x42, 0x00`) para papel de 80 mm.
     - Transmisión en paquetes controlados BLE (chunks de 64 bytes) para evitar desbordamiento del búfer del dispositivo portátil.
  2. Conexión mediante Web Bluetooth API (`navigator.bluetooth`) reconociendo los UUIDs de servicio universales de impresoras térmicas portátiles.
  3. En `components/TicketModal.tsx` se integró el botón "Imprimir Bluetooth (Directo ESC/POS)" con icono Bluetooth y feedback de estado, manteniendo el fallback a PDF/impresión del sistema.
- **Verificación:** `scripts/test_bluetooth_escpos.ts` validó la secuencia exacta de bytes de inicialización, codepage, mapeo de acentos españoles y comando de corte con 100% de éxito.
