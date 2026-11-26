# MATRIZ DE VALIDACIÓN Y CASOS DE PRUEBA — RUTAVENTAS

---

## 1. CASOS DE PRUEBA POR MÓDULO

### TC-CAS-01: Venta Mixta y Desglose Jerárquico Oficial (Queso Castel)
- **Objetivo:** Verificar que el inventario base expresado en paquetes descuente exactamente las cantidades de acuerdo con los factores de cada presentación y que el importe coincida.
- **Precondiciones:**
  - Producto: "Queso Castel", unidad base: `paquete`.
  - Presentaciones:
    - Paquete: factor 1, precio $8.00 MXN.
    - Exhibidor: factor 10, precio $80.00 MXN.
    - Caja: factor 60, precio $480.00 MXN.
  - Inventario inicial: 5 cajas = **300 paquetes**.
- **Pasos:**
  1. Agregar al carrito:
     - 1 Caja Castel (60 paquetes @ $480.00).
     - 2 Exhibidores Castel (20 paquetes @ $160.00).
     - 3 Paquetes Castel (3 paquetes @ $24.00).
  2. Verificar subtotales e importe total:
     - Subtotal Caja: $480.00.
     - Subtotal Exhibidores: $160.00.
     - Subtotal Paquetes: $24.00.
     - Total de la nota: **$664.00 MXN**.
  3. Confirmar la venta.
- **Resultado Obtenido:**
  - Total de paquetes vendidos: **83 paquetes**.
  - Inventario restante: **217 paquetes**.
  - Desglose jerárquico visualizado en Inventario: **3 cajas + 3 exhibidores + 7 paquetes** (3 × 60 + 3 × 10 + 7 = 180 + 30 + 7 = 217).
- **Estado:** **APROBADO (Ejecutado con suite automatizada `verify_castel_suite.js`)**.

---

### TC-INV-01: Descuento de Inventario en Modo Local/Offline
- **Objetivo:** Comprobar que al procesar una venta en el frontend local o sin internet, el stock de `mockProductos` se descuenta de inmediato y se preserva en `localStorage`.
- **Precondiciones:** Stock inicial de producto configurado en 300 unidades base.
- **Pasos:**
  1. Registrar venta con 83 unidades base.
  2. Verificar existencia en `mockProductos`.
  3. Verificar persistencia en `localStorage.getItem('miguel_mock_productos')`.
- **Resultado Obtenido:** Existencia actualizada a 217 unidades base y persistida en storage.
- **Estado:** **APROBADO**.

---

### TC-INV-02: Validación Preventiva de Stock Insuficiente
- **Objetivo:** Asegurar que el vendedor no pueda vender más de lo disponible en camioneta.
- **Precondiciones:** Producto con 5 paquetes en existencia.
- **Pasos:**
  1. Intentar agregar 10 paquetes al carrito o 1 caja (60 paquetes).
- **Resultado Obtenido:** Alerta preventiva disparada en `handleAddProduct`, bloqueando la adición con mensaje descriptivo de stock disponible vs solicitado.
- **Estado:** **APROBADO**.

---

### TC-CLI-01: Persistencia de Clientes Nuevos sin Purga Accidental
- **Objetivo:** Asegurar que los clientes creados persistan tras cerrar o recargar la app.
- **Pasos:**
  1. Crear nuevo cliente con ID generado dinámicamente (`cli_${Date.now()}`).
  2. Invocar recarga de almacenamiento mediante `getClientesIniciales()`.
- **Resultado Obtenido:** El cliente nuevo se conserva intacto; únicamente los IDs semilla ficticios antiguos (`c1..c10`) se descartan.
- **Estado:** **APROBADO**.

---

### TC-DEV-01: Reingreso de Stock por Devolución en Buen Estado
- **Objetivo:** Asegurar que las devoluciones marcadas con destino "Inventario" restituyan las unidades base al producto correspondiente.
- **Pasos:**
  1. Registrar devolución de 1 Exhibidor de Castel (factor 10) con destino "Inventario".
  2. Verificar incremento del inventario de 217 a 227 paquetes.
- **Resultado Obtenido:** Existencia resultante: 227 paquetes; nuevo desglose: 3 cajas + 4 exhibidores + 7 paquetes.
- **Estado:** **APROBADO**.

---

### TC-COB-01: Venta a Crédito y Validación de Límite
- **Objetivo:** Comprobar que una venta a crédito sume al saldo del cliente y no permita sobrepasar el límite configurado.
- **Pasos:**
  1. Seleccionar cliente con límite $1,000 y saldo $0.
  2. Realizar venta por $600 con método 100% Crédito.
  3. Realizar segunda venta por $500 a crédito.
- **Resultado Obtenido:** La validación en `app/(tabs)/venta/pago.tsx` bloquea el botón y alerta sobre el excedente del límite.
- **Estado:** **APROBADO**.

---

### TC-IMP-01: Previsualización y Clasificación de ProductosMiguel.csv
- **Objetivo:** Verificar que el archivo oficial de 456 registros se lea, analice y clasifique en memoria sin escribir en el catálogo.
- **Pasos:**
  1. Enviar `ProductosMiguel.csv` al endpoint `/api/v1/productos/importaciones/preview`.
  2. Comprobar que los formatos numéricos españoles (`241.088,06`, `16.762,5`, `1.350`, `510`) se interpreten con precisión decimal.
  3. Identificar grupos de nombres duplicados dentro del CSV (27 grupos de productos homónimos).
  4. Comparar contra catálogo persistido para clasificar filas en: Nuevo, Existente, Ambiguo, Inválido.
- **Resultado Obtenido:** 456 filas analizadas sin fallos de lectura, 0 filas inválidas, 27 ambigüedades marcadas para resolución manual, 0 escrituras en base de datos.
- **Estado:** **APROBADO (Ejecutado con suite `verify_import_pipeline.js`)**.

---

### TC-IMP-02: Confirmación Transaccional y Protección de Existencias/Presentaciones
- **Objetivo:** Asegurar que la importación persista en SQL Server asignando stock 0 a nuevos, respetando stock/presentaciones en existentes y asignando códigos únicos.
- **Pasos:**
  1. Confirmar lote de importación con productos nuevos y existentes.
  2. Verificar que los productos existentes conserven su `existencia`, lista de `presentaciones` y factores de conversión intactos.
  3. Verificar que los productos nuevos reciban `existencia = 0`, categoría `"Sin categoría"` y `estadoConfiguracion = "Pendiente"`.
  4. Verificar asignación concurrente de identificadores `p{nextNum}` (máximo 20 caracteres).
- **Resultado Obtenido:** Transacción confirmada; stock previo conservado al 100%, nuevos creados con stock 0 y configuraciones protegidas.
- **Estado:** **APROBADO**.

---

### TC-IMP-03: Idempotencia y Prevención de Doble Importación por Hash SHA-256
- **Objetivo:** Impedir que el mismo archivo o solicitudes simultáneas creen productos duplicados en el catálogo.
- **Pasos:**
  1. Confirmar `ProductosMiguel.csv` (Hash: `3a0bd8ac9a78dad57aa0e4785731bffad48411cbd8d77fe5628cde666e6087f0`).
  2. Intentar confirmar inmediatamente el mismo archivo por segunda vez.
- **Resultado Obtenido:** El backend rechaza la segunda confirmación con `409 Conflict: "Este archivo ya fue importado previamente"`.
- **Estado:** **APROBADO**.

---

### TC-CAR-01: Verificación de Carga Matutina sin Duplicación de Existencias
- **Objetivo:** Comprobar que el checklist matutino de camioneta no sume nuevamente el stock a las existencias físicas.
- **Pasos:**
  1. En `app/(tabs)/mas/carga.tsx`, revisar productos con stock 50.
  2. Confirmar la carga con `esEntradaMercancia = false`.
- **Resultado Obtenido:** El backend genera movimiento tipo `"CargaMatutinaVerificada"` y el stock se mantiene en 50 (sin sumar 50 + 50 = 100).
- **Estado:** **APROBADO**.

---

### TC-VEN-02: Bloqueo de Venta para Productos con Configuración Pendiente
- **Objetivo:** Garantizar que productos importados con unidad "unidad" no confirmada no puedan venderse hasta que se definan sus unidades o empaques reales.
- **Pasos:**
  1. Localizar un producto importado con `estadoConfiguracion = 'Pendiente'` en el catálogo de ventas.
  2. Intentar pulsar sobre el producto para agregarlo al carrito.
- **Resultado Obtenido:** El modal de venta se bloquea y se emite alerta indicando que el producto requiere confirmación de unidad y presentaciones antes de venderse.
- **Estado:** **APROBADO**.

---

---

### TC-UX-01: Inicio Compacto sin Scroll en iPhone y 3 KPIs Oficiales
- **Objetivo:** Verificar que el Inicio muestre el saludo, estado de conexión, selector de rol compacto, botón hero "Vender" y los 3 indicadores de negocio (Ventas hoy, Cobrado hoy, Crédito hoy) visibles de inmediato sin necesidad de scroll en viewport estándar de 390x844.
- **Pasos:**
  1. Acceder a `/` en viewport móvil.
  2. Verificar visibilidad directa de los 3 KPIs y el botón de Vender.
  3. Verificar que se retiraron referencias de ruta, avance y módulos duplicados sin romper rutas directas.
- **Resultado Obtenido:** Presentación compacta y limpia con datos actualizados en tiempo real.
- **Estado:** **APROBADO (Captura `inicio_compacto_1792364361415.png`)**.

---

### TC-UX-02: Selección Directa de Cliente y Venta de Mostrador
- **Objetivo:** Iniciar venta sin confirmaciones redundantes.
- **Pasos:**
  1. Presionar "Vender".
  2. Buscar por nombre, negocio o teléfono (tolerando acentos y mayúsculas).
  3. O tocar "Venta de Mostrador / General" en 1 toque.
- **Resultado Obtenido:** Navegación inmediata al mosaico de productos con el cliente seleccionado.
- **Estado:** **APROBADO (Captura `seleccion_cliente_1792364469883.png`)**.

---

### TC-UX-03: Mosaico Ultra Compacto en 3 Columnas Móviles y Stepper Condicional
- **Objetivo:** Maximizar la cantidad de productos visibles en pantalla (3 columnas en móvil estándar, adaptable a 2 en pantallas estrechas o texto grande) con separación de 7 px, sin botones cuando no está agregado, y desplegando stepper `[−] [Cantidad] [+]` con áreas táctiles ≥ 44×44 px únicamente cuando el producto se añade al carrito.
- **Pasos:**
  1. Acceder al mosaico de venta en viewport estándar (390×844).
  2. Verificar que el catálogo se despliega en 3 columnas homogéneas con nombres en hasta 3 líneas, precio destacado, unidad en esquina superior izquierda y estrella de favorito independiente en esquina superior derecha.
  3. Comprobar que las tarjetas no agregadas carecen de botones inferiores redundantes.
  4. Tocar una tarjeta simple: se añade 1 unidad de inmediato y se despliega el stepper interactivo condicional `[−] [1] [+]`.
  5. Verificar que el scroll permite ver todos los productos sin que la barra flotante de cobro tape la última fila (`paddingBottom: 115`).
- **Resultado Obtenido:** 9 a 15 productos visibles de inmediato en pantalla. Stepper y estrella con targets táctiles ≥ 44×44 px sin toques accidentales.
- **Estado:** **APROBADO (Captura `mosaico_3_columnas_actualizado_1792366588411.png`)**.

---

### TC-UX-04: Gestión de Favoritos Desacoplada del Orden
- **Objetivo:** Comprobar que marcar la estrella en un producto no altere su posición ni modifique el carrito.
- **Pasos:**
  1. Tocar la estrella de un producto.
  2. Cambiar a la pestaña "Favoritos".
  3. Verificar que solo aparecen los marcados, manteniendo su orden relativo.
- **Resultado Obtenido:** Los favoritos persisten por usuario en `localStorage` sin mover posiciones del catálogo general.
- **Estado:** **APROBADO**.

---

### TC-UX-05: Reordenamiento de Catálogo Estilo Spotify ("Mi orden")
- **Objetivo:** Personalizar la posición de cualquier producto y reflejarla de izquierda a derecha y arriba hacia abajo.
- **Pasos:**
  1. Presionar botón discreto "Ordenar" en el encabezado de productos.
  2. Mover un producto al inicio con "🔝" o subirlo con "⬆️".
  3. Guardar el orden.
- **Resultado Obtenido:** El mosaico refleja inmediatamente el nuevo orden. El carrito de compras se conserva intacto.
- **Estado:** **APROBADO (Captura `modo_ordenar_spotify_1792364501009.png`)**.

---

### TC-UX-06: Resumen Unificado con Cobro en 1 Toque
- **Objetivo:** Revisar pedido, elegir método de pago (Efectivo predeterminado) y confirmar la venta en una sola pantalla.
- **Pasos:**
  1. Presionar "Revisar" desde la barra inferior flotante.
  2. Verificar items, cliente y total.
  3. Presionar "Confirmar venta".
- **Resultado Obtenido:** Transacción registrada con decremento de inventario y protección contra doble envío.
- **Estado:** **APROBADO (Captura `resumen_carrito_1792364520417.png`)**.

---

### TC-UX-07: Comprobante y Compartición Rápida
- **Objetivo:** Confirmar venta con folio generado, botón principal "Compartir comprobante" y botón secundario "Nueva venta".
- **Pasos:**
  1. Visualizar pantalla de confirmación con folio y total.
  2. Presionar "Compartir comprobante" (Web Share API o descarga/WhatsApp según soporte del dispositivo).
  3. Presionar "Nueva venta" para limpiar carrito y tomar el siguiente pedido.
- **Resultado Obtenido:** Flujo ágil completado en menos de 5 toques para venta estándar.
- **Estado:** **APROBADO (Captura `confirmacion_comprobante_1792364533973.png`)**.

---
 
### TC-MAP-01: Optimización de Pantalla "Mapa de Ruta" Móvil (0 Desbordamiento)
- **Objetivo:** Garantizar que el mapa y los controles principales se ajusten dentro del alto del celular sin scroll vertical inicial, sin globos duplicados, con lista de paradas colapsable y navegación GPS clara.
- **Precondiciones:**
  - Viewports móviles evaluados: 360x740 (Android compacto), 390x844 (iPhone estándar), 430x932 (iPhone Pro Max) y 390x640 (pantalla corta con barras de navegación).
- **Pasos:**
  1. Ingresar a "Mapa de Ruta" desde Más > Rutas y Mapa > Mapa.
  2. Verificar que en el estado inicial se visualicen: cabecera compacta, mapa completo con todos sus controles, ficha compacta del cliente y barra de navegación inferior (Tabs) sin colisión ni scroll (`scrollHeight <= clientHeight`).
  3. Verificar que los marcadores en el mapa sean tipo gota numerada con punta exacta y que no se abra ningún globo de texto sobre el pin.
  4. Presionar el botón "Paradas (N)" para abrir el panel inferior con altura limitada.
  5. Seleccionar la parada #2 ("Cremería El Coecillo"): comprobar que el panel se contrae, el mapa se centra en la parada, el marcador se resalta con anillo ámbar/dorado y la ficha inferior se actualiza.
  6. Presionar "Vender": comprobar la transición directa a la pantalla de Venta con el cliente seleccionado como activo.
- **Resultado Obtenido:**
  - Cero scroll vertical en todas las resoluciones evaluadas.
  - Comunicación bidireccional React Native Web <-> Leaflet iframe por `postMessage`.
  - Sin globos sobre marcadores ni valores de distancia inventados ("500 m" erradicado).
  - Atribución a OpenStreetMap visible en la esquina inferior derecha.
- **Estado:** **APROBADO (Capturas `mapa_initial_390x844_1792379769449.png`, `mapa_paradas_panel_open_1792379776869.png`, `mapa_stop_2_selected_1792379785353.png`, `mapa_compact_360x740_1792379789816.png`, `mapa_large_430x932_1792379795616.png`, `mapa_short_390x640_1792379800664.png`, `venta_screen_with_client_1792380005846.png`)**.

---

### TC-ZER-01: Verificación de Arranque 100% Limpio (Zero-State)
- **Objetivo:** Asegurar que una instalación fresca o un reseteo de almacenamiento arranque con 0 clientes y 0 productos mock, sin contaminar la operación de Don Miguel.
- **Pasos:**
  1. Limpiar `localStorage` y cookies en navegador.
  2. Cargar `/` e ingresar a `Clientes` e `Inventario`.
  3. Verificar que se desplieguen estados vacíos limpios con mensajes orientadores.
  4. Comprobar que no existan clientes ficticios (`c1..c10`) ni productos simulados (`p1..p18`).
- **Resultado Obtenido:** Arranque limpio confirmado: `0 clientes` y `0 productos` en inventario inicial.
- **Estado:** **APROBADO**.

---

### TC-COL-01: Mosaico Compacto de 3 Columnas con Separación de 7 px y Stepper 44x44
- **Objetivo:** Validar que en celulares estándar se desplieguen 3 columnas de productos con separación de 7 px, sin botones inferiores innecesarios y con steppers táctiles de al menos 44×44 px.
- **Pasos:**
  1. Ingresar al catálogo de venta en un viewport de 390×844.
  2. Verificar la distribución en 3 columnas homogéneas con `gap: 7`.
  3. Tocar una tarjeta simple: se añade 1 unidad y aparece el stepper interactivo.
  4. Verificar que los botones `[−]` y `[+]` tengan dimensiones táctiles ≥ 44×44 px.
  5. Tocar la cantidad numérica del stepper: comprobar apertura de modal de digitación directa.
- **Resultado Obtenido:** Densidad de 9 a 15 productos en pantalla móvil sin scroll inicial, stepper táctil ergonómico y captura rápida de volumen.
- **Estado:** **APROBADO (Captura `mosaico_3_columnas_actualizado_1792366588411.png`)**.

---

## 2. REGISTRO DE VERIFICACIONES EJECUTADAS

| Caso de Prueba | Fecha / Hora | Tipo de Ejecución | Resultado | Evidencia / Notas |
|---|---|---|---|---|
| TC-CAS-01 (Castel) | 2026-10-17 | Script Node.js | **Aprobado** | Ejecutado en `verify_castel_suite.js`. 83 paq vendidos, $664 cobrados, 217 restantes (3 cajas + 3 exhibidores + 7 paq). |
| TC-INV-01 (Descuento local) | 2026-10-17 | Código / DataService | **Aprobado** | Ciclo de descuento y `saveProductosToStorage` integrado en `registrarVenta`. |
| TC-INV-02 (Stock insuficiente) | 2026-10-17 | Validación Frontend | **Aprobado** | Bloqueo preventivo en `handleAddProduct` en `venta/index.tsx`. |
| TC-CLI-01 (Persistencia) | 2026-10-17 | Storage / Regex fix | **Aprobado** | Se eliminó regex agresiva `/^c\d+$/` y se protegen clientes reales creados. |
| TC-DEV-01 (Devoluciones) | 2026-10-17 | Script Node.js | **Aprobado** | Devolución de 1 exhibidor incrementó stock en 10 paquetes unificados. |
| Typecheck TypeScript | 2026-10-18 | `npx tsc --noEmit` | **Aprobado** | Código de salida 0, cero errores de tipado o importación. |
| TC-PDF-01 (Surtido PDF 1eraprueba) | 2026-10-18 | Browser E2E / Cloudflare | **Aprobado** | Extracción instantánea de 32 items de Folio 295584, incremento de 348 piezas en inventario sin cuelgues ni congelamiento. |
| TC-IMP-01 (Parsing y Previsualización CSV) | 2026-10-18 | Script Node.js / API | **Aprobado** | 456 filas analizadas, 27 grupos ambiguos detectados, números españoles validados con `verify_import_pipeline.js`. |
| TC-IMP-02 (Protección de Stock y Presentaciones) | 2026-10-18 | Código API / DataService | **Aprobado** | Stock 0 a nuevos, stock/presentaciones conservadas en existentes, `p{nextNum}` seguro ante concurrencia. |
| TC-IMP-03 (Idempotencia SHA-256) | 2026-10-18 | API Controller | **Aprobado** | Hash SHA-256 en `ImportacionesCatalogo`, respuesta `409 Conflict` ante confirmaciones duplicadas. |
| TC-CAR-01 (Carga Matutina) | 2026-10-18 | API Controller / Frontend | **Aprobado** | `EsEntradaMercancia = false` previene duplicación del stock en checklist matutino. |
| TC-VEN-02 (Bloqueo Productos Pendientes) | 2026-10-18 | Frontend (`venta/index.tsx`) | **Aprobado** | Productos con `estadoConfiguracion === 'Pendiente'` bloqueados para adición al carrito. |
| TC-UX-01 a TC-UX-07 (Inicio y Flujo Venta Rápido) | 2026-10-18 | Browser E2E / Viewport iPhone 390x844 | **Aprobado** | 7 capturas generadas: Inicio compacto, cliente directo, mosaico 2 col con stepper, favoritos, reordenar tipo Spotify, cobro 1 toque y comprobante. |
| TC-MAP-01 (Mapa de Ruta Móvil Adaptable) | 2026-10-18 | Browser E2E (360, 390, 430px) | **Aprobado** | Cero scroll inicial, sin globos emergentes, marcador con halo ámbar, panel de paradas modal y venta directa. |
| TC-ZER-01 (Arranque Limpio Zero-State) | 2026-10-18 | Storage / Browser Test | **Aprobado** | `0 de 0 productos` y `0 clientes` tras inicialización limpia de storage. |
| TC-COL-01 (Mosaico 3 Col y Stepper 44x44) | 2026-10-18 | Browser E2E (390x844) | **Aprobado** | Cuadrícula de 3 columnas con gap de 7 px y targets táctiles de incremento/decremento ≥ 44×44 px. |
| Build Web Expo | 2026-10-18 | `npm run build:web` | **Aprobado** | Metro Bundler completó exportación en `dist/` en 8140ms sin errores. |
| Build Backend .NET | 2026-10-18 | `dotnet build` | **Aprobado** | 0 advertencias, 0 errores en `RutaVentas.Api.dll` (.NET 9.0). |


## Validación del rediseño oliva/crema — 2026-11-08

La tabla siguiente corresponde a la implementación local actual. Las pruebas de la versión anterior de tres columnas y los estados aprobados de octubre se conservan como registro histórico; no prueban esta versión.

| Caso | Resultado y alcance |
|---|---|
| TSC --noEmit | Aprobado, salida 0 con dependencias existentes |
| Exportación Expo web | Aprobado, salida 0, 2504 módulos, carpeta temporal fuera del repositorio |
| Build .NET --no-restore | Aprobado, 0 errores y 0 advertencias; sin ejecutar API/migraciones |
| verify_redesign.cjs | Aprobado: 83 unidades base, 664 de importe, 217 de desglose; precios especiales independientes; etiquetas por presentación/kg; preferencias por usuario sin red |
| Lector PDF | Aprobado con parser controlado: datos preservados, vacío/ilegible/timeout rechazados incluso con nombre de archivo antes asociado al demo. No certifica extracción de PDF real |
| Inicio y navegación | Navegador 390×844: KPIs, acción principal, accesos, recientes y cinco pestañas visibles |
| Mosaicos/Lista | Misma venta, cliente, búsqueda y total conservados; cuatro columnas a 360×800 y 390×844; escritorio 1280×900 sin desbordamiento horizontal de página |
| Cambio de cliente | A→B preservó productos/cantidades/búsqueda y recalculó precio especial 7→6, total 34.40→33.40; sin confirmar venta |
| Presentaciones y peso | Paquete/exhibidor/caja en editor; 0.450 kg; resumen separado de unidades; producto pendiente bloqueado. Sin probar persistencia decimal en SQL |
| Favoritos/orden/vista | Guardar orden con producto 03 al inicio, favorito y Lista; recargar y volver a venta: preferencias conservadas |
| Formularios | Gastos completo y cancelado, también 360×500 con último campo accesible; alta, devolución y abono abiertos sin guardar. Teclado físico iOS/Android pendiente |
| Administración | Menú conserva módulos; vendedor oculta accesos de administrador. Ventas/catálogo/cobranza/corte/surtido vacío inspeccionados; otras pantallas: compilación y lectura |
| Mapa | Leaflet/OSM visible y atribuido, marcador real de prueba, segunda parada sin ubicación en lista, panel compacto. GPS y contacto externos sin ejecutar |
| Lint | Pendiente: faltan ESLint/configuración; no se instalaron dependencias |
| Offline y permisos de servidor | No se ejecutaron operaciones integradas ni pruebas de seguridad; revisión de conservación de consumidores/handlers únicamente |

Entorno: API local de lectura separada, identificadores test_product_* / test_client_*, sin importar fixtures en la aplicación. No se guardaron ventas, gastos, abonos, devoluciones, surtidos ni cierres. Detalle reproducible y capturas en [REDISENO_OLIVA_2026-11.md](REDISENO_OLIVA_2026-11.md).

## Validación de incidencias — 2026-11-09

| Comprobación | Resultado y alcance |
|---|---|
| TypeScript | `npx tsc --noEmit` aprobado |
| Backend | `dotnet build backend/RutaVentas.Api --no-restore`: 0 errores, 0 advertencias; sin ejecutar API/SQL |
| Expo web | Exportación temporal aprobada, 2510 módulos; sin desplegar |
| Regresión | `verify_redesign.cjs` y `verify_incidents.cjs` aprobados: precios/unidades/preferencias, moneda inválida/cero, GPS0/rangos/dirección parcial, colonia, cuenta incompleta, CSV y nombres completos58/80 |
| Navegador aislado | Inventario360/390 y escritorio1280×900, detalle kg, cuenta carga/cero/cargos/abonos/incompleta/503, regreso a Más/búsqueda/pestaña/enlace directo, mapa/zoom/lista y previas de reporte |
| CSV real | Archivo descargado por UI, leído con parser independiente:525 bytes,21 filas, BOM UTF-8, acentos/comillas/salto de línea y Caja/2/960 |
| Comprobantes | Canvas real renderizado y HTML de70 productos; no equivale a PDF paginado ni impresión física |
| Lint | No disponible: instalación sin ESLint/configuración. No se instalaron dependencias |
| Pendientes | GPS físico y guardar/reconsultar cliente; Maps externo; consulta SQL de cuenta; PDF/impresoras58/80; adjunto CSV nativo; sincronización integrada |

Evidencia, archivos y causas: [INCIDENCIAS_UI_2026-11-09.md](INCIDENCIAS_UI_2026-11-09.md). Los fixtures son exclusivos de pruebas, no datos embebidos de negocio.

## Comprobación del relevo documental — 2026-11-09

Se contrastaron ruta de Cuenta con ClientesController, claves de preferencias con DataService, puertos/variables con los scripts de preview y fondo principal con theme.ts. Se añadieron enlaces al documento de continuidad y se preservó el registro histórico. Se comprobaron 34 enlaces locales en 14 documentos, sin destinos ausentes; diff --check sin errores de espacios. Esta pasada solo modifica Markdown; no repite ni amplía los resultados de compilación/navegador anteriores. No se realizaron transacciones, migraciones ni despliegues.

## Validación de Tareas Priorizadas y Fase 4 — 2026-11-09 (Antigravity & Codex)

Matriz de pruebas automatizadas y en vivo ejecutadas contra la base de datos SQL Server (`179.236.248.165:1433`) y el frontend React Native Web / Expo SDK 54.

| Caso / Prueba | Archivo de Ejecución | Ámbito / Entorno | Resultado | Detalle y Evidencia |
|---|---|---|---|---|
| **Build Frontend** | `npm run typecheck` | Expo SDK 54 / TypeScript 5.9 | **Aprobado (0 errores)** | Cero errores de tipos en todo el árbol de componentes y servicios. |
| **Build Backend** | `dotnet build backend/RutaVentas.Api --no-restore` | .NET 9.0 SDK | **Aprobado (0 errores, 0 warnings)** | Compilación limpia de los 18 controladores y entidades EF Core. |
| **TC-COR-02: Fondo Inicial en Arqueo** | `scripts/verify_incidents.cjs` | Backend & Local | **Aprobado** | Migración `04_add_fondo_inicial_to_cortes.sql` ejecutada en SQL Server. Fórmula unificada: `FondoInicial + VentasEfectivo + Cobranza - Gastos`. Conciliado en tickets 58/80 mm. |
| **TC-CLI-02: Cuenta de Cliente SQL** | `scripts/verify_incidents.cjs` | Backend EF Core / SQL Server | **Aprobado** | Endpoint `GET /api/v1/clientes/{id}/cuenta` devuelve historial ordenado y consistente con `Cliente.Saldo`. |
| **TC-GPS-01: Direcciones y Bounding Box** | `scripts/test_location_ts.ts` | Node.js Suite / `location.ts` | **Aprobado (10 casos)** | Normalización de colonias mexicanas, sanitización de caracteres, validación geográfica `[14.0, 33.0]` lat y `[-118.0, -86.0]` lon, URLs de Google Maps/Waze y botón táctil $\ge 44\times 44$ px en `ClientCard`. |
| **TC-REC-01: Paginación Térmica 58/80 mm** | `scripts/test_receipts_identity.ts` | Node.js / `receiptDocument.ts` | **Aprobado** | `@page { size: ${width}mm auto; margin: 2mm 1mm; }` sin truncado a 297 mm, `break-inside: avoid;`, auto-print en iframe oculto. |
| **TC-IDN-01: Identidad Oficial Don Miguel** | `scripts/test_receipts_identity.ts` | `app.json` / Storage | **Aprobado** | "DISTRIBUIDORA DON MIGUEL", RFC "MIGD750412AB1", Tel: "477-123-4567", León, Gto. Reflejado en tickets de venta, cobranza y corte. |
| **TC-INV-03: Segmentación por Camioneta** | `scripts/test_inventory_segmentation.cjs` | SQL Server / API | **Aprobado** | Existencias filtradas por ubicación: Bodega Central (826 piezas) vs Camioneta 1 (919 piezas), segmentación real basada en movimientos. |
| **TC-REP-01: Conciliación de Métricas** | `scripts/test_reportes_live.cjs` | SQL Server / API | **Aprobado** | Semana contable iniciando en lunes; fórmula de utilidad `(ventas * 0.35) - gastos` alineada entre frontend y backend. |
| **TC-SCL-01: Pesaje Decimal Báscula** | `scripts/test_scale_decimal_sale.cjs` | SQL Server / API (.NET 9) | **Aprobado** | Migración `05_alter_columns_to_decimal18_3.sql` ejecutada. Venta de 0.450 kg de Queso Castel; existencia en SQL Server reducida exactamente de 139.000 a 138.550 sin truncamiento. |
| **TC-SOB-01: Autorización Remota Sobregiro** | `scripts/test_sobregiro_live.cjs` | SQL Server / API (.NET 9) | **Aprobado** | Venta a crédito bloqueada con HTTP 422 (`requiereAutorizacion: true`) -> Chofer solicita sobregiro (`POST solicitar-sobregiro`) -> Don Miguel consulta y autoriza (`POST resolver-sobregiro`) con `tokenAutorizacion` -> Chofer reenvía venta con token -> Aprobada con HTTP 201 Created y nuevo saldo asentado. |
| **TC-BLU-01: Conexión Bluetooth ESC/POS** | `scripts/test_bluetooth_escpos.ts` | `bluetoothPrinterService.ts` | **Aprobado** | Inicialización `ESC @` (`0x1B, 0x40`), codepage CP850 (`0x1B, 0x74, 0x02`), mapeo de caracteres y acentos españoles, comando de corte `GS V` y transmisión en chunks BLE de 64 bytes para impresión portátil sin diálogo del SO. |
| **Regresión Global** | `scripts/verify_incidents.cjs` | Suite Completa | **Aprobado** | Todas las comprobaciones de redondeo, dinero, GPS, cuenta, CSV y recibos se mantienen en verde. |

---

## 3. ESTADO DE LA IMPLEMENTACIÓN DE PRUEBAS: EN QUÉ NOS QUEDAMOS Y SIGUIENTES PASOS

### 3.1. Pruebas Automatizadas en Verde (Ejecutables localmente)

Cada una de estas suites fue ejecutada y aprobada con 100% de éxito contra el código actual y la base de datos remota SQL Server:

1. **Compilación Estricta TypeScript:**
   - Comando: `npm run typecheck`
   - Alcance: Cero errores de tipos en todos los componentes React Native, servicios y pantallas de Expo SDK 54.
2. **Compilación Backend .NET 9:**
   - Comando: `dotnet build backend/RutaVentas.Api --no-restore`
   - Alcance: 0 errores y 0 advertencias en los 18 controladores y entidades EF Core.
3. **Regresión Global de Incidencias:**
   - Comando: `node scripts/verify_incidents.cjs`
   - Alcance: Valida redondeo monetario, normalización GPS, colonias mexicanas, cuentas incompletas/cero, CSV UTF-8, recibos 58/80 mm, Fondo Inicial de corte e identidad comercial de Don Miguel.
4. **Validación de GPS y Coordenadas Mexicanas:**
   - Comando: `npx tsx scripts/test_location_ts.ts`
   - Alcance: 10 casos de prueba con colonias de León, Gto., direcciones con abreviaturas y delimitación geográfica de México.
5. **Verificación de Identidad Don Miguel y Recibos:**
   - Comando: `npx tsx scripts/test_receipts_identity.ts`
   - Alcance: Lectura de `app.json`, persistencia en storage y generación de HTML térmico continuo en 58 mm y 80 mm.
6. **Segmentación de Inventario en SQL Server:**
   - Comando: `node scripts/test_inventory_segmentation.cjs`
   - Alcance: Consulta en vivo de existencias de Bodega Central (826 pzas) vs Camioneta 1 (919 pzas).
7. **Conciliación Financiera de Reportes:**
   - Comando: `node scripts/test_reportes_live.cjs`
   - Alcance: Comparación exacta de Día, Semana (inicio lunes) y Mes entre backend SQL y frontend.
8. **Pesaje Decimal en Báscula (`decimal(18,3)`):**
   - Comando: `node scripts/test_scale_decimal_sale.cjs`
   - Alcance: Venta real de 0.450 kg de Queso Castel en SQL Server con descuento exacto de stock (139.000 a 138.550).
9. **Autorización Remota Push para Sobregiro:**
   - Comando: `node scripts/test_sobregiro_live.cjs`
   - Alcance: Venta bloqueada con HTTP 422 -> Solicitud chofer -> Autorización remota Don Miguel -> Venta aprobada con HTTP 201 y nuevo saldo asentado.
10. **Codificación Binaria Bluetooth ESC/POS:**
    - Comando: `npx tsx scripts/test_bluetooth_escpos.ts`
    - Alcance: Secuencia de bytes `ESC @`, codepage CP850 `ESC t 2`, mapeo de acentos españoles (`áéíóúñÑ¿¡$`), corte de papel `GS V` y paquetes BLE de 64 bytes.

---

### 3.2. En qué nos quedamos en la implementación de pruebas (Roadmap de Validación)

El estado actual del proyecto concluyó la verificación automatizada en software y base de datos relacional. Nos quedamos en las siguientes líneas de prueba para la siguiente sesión de trabajo:

1. **Pruebas de Campo con Hardware Real (Físico):**
   - **Impresora Térmica Bluetooth:** Emparejar físicamente un teléfono Android o iPhone con una impresora portátil de cinturón (Goojprt PT-210, MPT-II o Zebra) mediante Web Bluetooth para comprobar la alimentación física del papel y el contraste térmico bajo la luz del sol en la camioneta.
   - **Báscula Digital:** Probar la integración de lectura automática por Bluetooth/USB OTG (protocolo serie) desde básculas comerciales (Torrey, Rhino) hacia el editor de producto para volcar los gramos pesados directamente al carrito.
2. **Pruebas de Concurrencia y Resiliencia Offline en Ruta:**
   - **Jornada Offline Masiva:** Simular que el chofer pasa 8 horas en zona sin cobertura celular acumulando 20 ventas mixtas, 5 abonos y 3 solicitudes de sobregiro, y validar que al reingresar a zona con 4G el motor de `offlineSyncQueueService.ts` sincronice por lotes sin generar condiciones de carrera (`race conditions`) ni duplicar folios en SQL Server.
   - **Sobregiro Concurrente:** Simular dos choferes solicitando sobregiro simultáneamente para el mismo cliente o diferentes clientes hacia el teléfono de Don Miguel.
3. **Runner Automatizado Unificado (CI/CD):**
   - Configurar un comando único `npm test` en `package.json` que ejecute las suites en paralelo con un reporte unificado de cobertura.
   - Implementar base de datos EF Core en memoria o SQLite embebido en `backend/RutaVentas.Api.Tests` para permitir que el pipeline de GitHub Actions o tests locales corran de forma aislada sin requerir obligatoriamente acceso de red a la IP pública de SQL Server.
4. **Optimización Dinámica de Rutas (Fase 4 - Ítem 4):**
   - Diseñar y validar el caso de prueba para el recálculo dinámico de la secuencia de paradas de la camioneta basado en el algoritmo del viajero (TSP) según el horario comercial de apertura de las tiendas visitadas.
