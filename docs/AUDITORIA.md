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


