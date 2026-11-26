# REGISTRO DE DECISIONES DE ARQUITECTURA Y NEGOCIO (ADR)

---

## ADR-001: Arquitectura Offline-First con Fachada Unificada (`DataService`)
- **Estado:** Aprobado y en vigor.
- **Contexto:** Las camionetas de reparto recorren colonias periféricas, carreteras o locales comerciales donde la señal de datos móviles (4G/5G) es intermitente o nula.
- **Decisión:** Toda la aplicación interactúa exclusivamente a través de la fachada `DataService`. Esta intenta comunicarse con el backend en la nube (.NET 9 ASP.NET Core); si no hay conectividad o el servidor no responde, opera fluidamente contra `localStorage` y encola las transacciones en `offlineSyncQueueService`.
- **Restricción:** Ninguna pantalla debe invocar `fetch` o `axios` directamente ni asumir conectividad permanente.

---

## ADR-002: Inventario Unificado por Unidad Base con Conversión Dinámica
- **Estado:** Aprobado y en vigor.
- **Contexto:** Vender el mismo producto en distintas presentaciones (Caja, Exhibidor, Paquete) provocaba intentos de crear productos separados en el catálogo (ej. "Castel Caja", "Castel Paquete"), lo que duplicaba el catálogo y desincronizaba el stock real de la camioneta.
- **Decisión:** Cada producto tiene un único registro en catálogo con su `existencia` expresada estrictamente en su **unidad base** (ej. `paquete` para Queso Castel). Las presentaciones se definen en una tabla/lista secundaria con su factor multiplicador (`piezasEquivalentes`).
- **Restricción:** El inventario se descuenta siempre multiplicando la cantidad vendida por el factor de la presentación seleccionada:
  $$\text{Unidades Base a Descontar} = \text{Cantidad} \times \text{Factor de Conversión}$$

---

## ADR-003: Inmutabilidad de Notas de Venta Históricas
- **Estado:** Aprobado y en vigor.
- **Contexto:** Si el día de mañana se ajusta el precio de una caja de Castel de $480 a $500, o cambia el empaque de un proveedor, las ventas realizadas el mes pasado no deben recalcularse ni alterar los cortes de caja pasados.
- **Decisión:** La entidad `VentaDetalle` almacena una fotografía congelada de la venta:
  - `PresentacionTipo` y `PresentacionNombre`
  - `FactorConversion` aplicado en ese instante
  - `CantidadPresentaciones`
  - `PiezasTotales` descontadas
  - `PrecioUnitario` congelado
  - `Subtotal`
- **Restricción:** Queda estrictamente prohibido recalcular ventas pasadas con base en las tablas maestras de productos o presentaciones vigentes.

---

## ADR-004: Precios Independientes por Presentación y Precios Especiales por Cliente
- **Estado:** Aprobado y en vigor.
- **Contexto:** En el comercio de mayoreo y medio mayoreo, el precio de una caja no siempre es exactamente $60 \times \text{precio paquete}$. Además, clientes preferenciales reciben precios especiales por presentación.
- **Decisión:** Cada presentación define su propio precio comercial. Al cotizar un producto para un cliente, el orden de resolución es:
  1. Precio especial pactado para esa presentación específica (`productoId:presentacionTipo`).
  2. Si no maneja presentaciones, precio especial general del cliente (`productoId`).
  3. Precio de la presentación configurado en catálogo.
  4. Precio base del producto.
- **Restricción:** No aplicar descuentos o conversiones de precio asumidas sin configuración explícita.

---

## ADR-005: Eliminación Total de Semillas Mock Hardcodeadas
- **Estado:** Aprobado y en vigor.
- **Contexto:** La aplicación contenía datos de prueba (gastos de gasolina falsos, clientes de fantasía, ventas simuladas) incrustados en archivos como `constants/mockData.ts`, lo que interfería con la operación real de Miguel.
- **Decisión:** Todos los catálogos arrancan con arreglos vacíos `[]`. Se implementó una purga automática en arranque para eliminar residuos de llaves antiguas (`miguel_mock_clientes`, `miguel_mock_productos`, etc.) que contengan IDs obsoletos (`p1..p18`, `c1..c10`).
- **Restricción:** Ningún cambio futuro debe volver a inyectar registros mock estáticos en la ejecución operativa.

---

## ADR-006: Compatibilidad Móvil iPhone y PWA
- **Estado:** Aprobado y en vigor.
- **Contexto:** Miguel utiliza un iPhone para la operación en campo.
- **Decisión:** Las pantallas deben incorporar márgenes seguros inferiores (`paddingBottom` / `SafeAreaView`) para que los botones de cobro y navegación no colisionen con la barra de gestos de inicio de iOS (Home Indicator).
- **Restricción:** Toda barra flotante o pie de página fijo debe reservar al menos 24px de resguardo inferior en dispositivos móviles.

---

## ADR-007: Importación Transaccional de Catálogo CSV e Idempotencia
- **Estado:** Aprobado y en vigor.
- **Contexto:** La carga del catálogo oficial de Miguel (`ProductosMiguel.csv`, 456 filas) requería evitar duplicación de productos, proteger las existencias en camioneta y no destruir las configuraciones de multipresentación existentes.
- **Decisión:**
  - Endpoint de previsualización (`/api/v1/productos/importaciones/preview`): No escribe en base de datos. Detecta ambigüedades dentro del archivo y busca candidatos por coincidencia normalizada en base de datos.
  - Endpoint de confirmación (`/api/v1/productos/importaciones/confirmar`): Ejecuta bajo transacción SQL (`IDbContextTransaction`) con autorización estricta de Administrador.
  - Idempotencia: Se computa el hash SHA-256 del contenido (`FileHash`) y se registra en `ImportacionesCatalogo`. Si se intenta confirmar exactamente el mismo archivo, el servidor responde `409 Conflict`.
  - Asignación de Códigos: Generación concurrente y segura de códigos de catálogo `p{nextNum}` (máximo 20 caracteres), preservando el código original en `CodigoOrigen`.
  - Protección de Stock y Presentaciones: Para productos existentes, la actualización se limita exclusivamente a `PrecioCompra` y `PrecioBase`. El inventario (`Existencia`), las presentaciones (`ProductoPresentacion`) y precios especiales de clientes permanecen inalterados.
  - Existencias Cero: Los productos nuevos se crean con `Existencia = 0`, categoría `"Sin categoría"` y estado `EstadoConfiguracion = "Pendiente"`.

---

## ADR-008: Separación entre Auditoría Matutina de Camioneta y Entrada de Mercancía
- **Estado:** Aprobado y en vigor.
- **Contexto:** `app/(tabs)/mas/carga.tsx` cargaba la existencia actual y el backend en `InventarioController.ConfirmarCargaInicial` sumaba de nuevo esa cantidad a `prod.Existencia`, provocando la duplicación progresiva del inventario en cada verificación matutina.
- **Decisión:** Se incorporó el parámetro `EsEntradaMercancia` en `ConfirmarCargaInicialRequestDto`.
  - Cuando `EsEntradaMercancia == false` (valor por omisión en la revisión matutina de carga): se genera el movimiento de auditoría tipo `"CargaMatutinaVerificada"` sin incrementar las existencias de los productos.
  - Solo cuando `EsEntradaMercancia == true` (recepción de compras de almacén o surtido formal con nota): se incrementa físicamente `prod.Existencia`.
- **Restricción:** Ninguna pantalla de checklist diario debe sumar stock como si fuera una compra.

---

## ADR-009: Mosaico Compacto de 3 Columnas Móvil con Stepper Condicional y Separación de 7 px
- **Estado:** Aprobado y en vigor.
- **Contexto:** En la pantalla de venta móvil, las listas verticales de productos y las cuadrículas de 2 columnas requerían demasiado desplazamiento vertical para localizar artículos, ralentizando la atención a los clientes en cada parada.
- **Decisión:**
  - Decisión histórica: **3 columnas** con separación de **7 px**. Sustituida por ADR-015: cuatro columnas y Mosaicos/Lista por petición expresa del usuario.
  - Tarjetas compactas sin botones inferiores innecesarios cuando el producto no está en el carrito.
  - Al pulsar una tarjeta, se añade 1 unidad de inmediato y se despliega un stepper interactivo condicional `[−] [Cantidad] [+]` con áreas táctiles mínimas de **44×44 px**.
  - Al presionar el número central del stepper se abre un modal de digitación directa para capturar pedidos de gran volumen rápidamente.
- **Restricción:** El `paddingBottom` de la vista de productos debe ser de al menos 115 px para garantizar que la barra flotante de cobro nunca cubra la última fila de tarjetas.

---

## ADR-010: Ordenamiento de Catálogo Estilo Spotify ("Mi orden") y Favoritos Desacoplados
- **Estado:** Aprobado y en vigor.
- **Contexto:** Cada vendedor tiene hábitos distintos y productos clave que vende con mayor frecuencia. Buscar manualmente entre cientos de productos en cada parada provocaba fatiga y demoras.
- **Decisión:**
  - Se desacopló la marcación de favoritos del ordenamiento del catálogo: tocar la estrella de un producto lo marca/desmarca como favorito sin cambiar su posición en la lista ni alterar el carrito.
  - Se implementó el modo "Ordenar" (estilo lista de reproducción de Spotify) con modal inferior, asas de arrastre y botones táctiles rápidos ("🔝 Al inicio", "⬆️ Subir", "⬇️ Bajar").
  - La clave histórica documentada era `miguel_orden_catalogo_v1`. El código actual usa `miguel_orden_${userId}`, con IDs estables; no migrar ni borrar preferencias basándose solo en el registro histórico.
- **Restricción:** El reordenamiento no debe recargar el catálogo, reiniciar el carrito de compras ni perderse ante nuevas importaciones.

---

## ADR-011: Mapa de Ruta Móvil Adaptable con Cero Scroll Inicial y Panel Modal de Paradas
- **Estado:** Aprobado y en vigor.
- **Contexto:** La pantalla de mapa superaba la altura del celular, requiriendo scroll vertical; además, los globos emergentes dentro de Leaflet tapaban el mapa y competían con la tarjeta inferior.
- **Decisión:**
  - El mapa se ajusta con `flex: 1`, `height: 100%`, `overflow: hidden`, respetando las barras del sistema y los tabs inferiores para lograr **0 scroll vertical inicial**.
  - Se eliminaron por completo los popups de Leaflet: al tocar un pin en el mapa, este se resalta con un halo ámbar/dorado (`box-shadow: 0 0 0 3.5px #f59e0b`) y se actualiza una única **Ficha Compacta Inferior (~85 px)**.
  - La ficha compacta contiene el número de parada, nombre del cliente, saldo, distancia real GPS (`navigator.geolocation`), botón hero **Vender** (que transfiere el cliente al catálogo) y botón de navegación por Google Maps.
  - La lista de paradas se transformó en un panel modal deslizable ("Ver paradas (N)") con altura máxima del 62%, que se contrae automáticamente al seleccionar una parada.
- **Restricción:** No mostrar distancias falsas o simuladas ("500 m") ni superponer controles sobre el botón de Vender.

---

## ADR-012: Doble Nombre de Producto (Nombre App vs Nombre Almacén) y Parser PDF Resiliente
- **Estado:** Aprobado y en vigor.
- **Contexto:** Las notas de remisión de bodega central utilizan descripciones abreviadas y técnicas (ej. `"QUESO CASTEL PZ"` o `"JAMON CORONA 1X24"`), distintas a las denominaciones comerciales que Don Miguel y sus clientes utilizan en la calle.
- **Decisión:**
  - Se incorporó la columna `NombreAlmacen` en la entidad `Producto`.
  - El motor de surtido de notas PDF (`pdfNoteParser.ts`) implementa extracción estructurada zlib mediante Pako (con soporte dual ESM/CJS) y busca coincidencias priorizando `NombreAlmacen`, luego `CodigoOrigen`, y finalmente coincidencia normalizada de texto.
  - Se incorporó un timeout de seguridad de 4.5 segundos (`Promise.race`) para evitar cualquier cuelgue de la interfaz durante el procesamiento de PDFs complejos.
- **Restricción:** Si un producto del PDF no existe en catálogo, se auto-crea con `EstadoConfiguracion = "Pendiente"` para permitir el surtido sin bloquear la operación de la camioneta.

---

## ADR-013: Permisos Granulares de Trabajadores y Fondo Inicial en Caja
- **Estado:** Aprobado y en vigor.
- **Contexto:** Don Miguel requería que los choferes no pudieran alterar precios a discreción ni autorizar créditos fuera de política, además de contemplar el fondo de dinero inicial entregado al chofer por la mañana para dar cambio.
- **Decisión:**
  - Se incorporó `PermisosJson` en la entidad `Usuario`, permitiendo configurar granularmente permisos como `puedeModificarPrecios`, `puedeAutorizarCredito` y `puedeAjustarInventario`.
  - En la apertura de caja y en el cálculo del corte diario, se incluye formalmente el **Fondo Inicial de Caja** en la fórmula de Efectivo Esperado:
    $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} + \text{Cobranza Abonos} - \text{Gastos Efectivo} - \text{Devoluciones Efectivo}$$
- **Restricción:** Los choferes no pueden alterar su propio fondo inicial una vez iniciado el turno.

---

## ADR-014: Cooldown de Red de 25 Segundos y Sincronización Idempotente
- **Estado:** Aprobado y en vigor.
- **Contexto:** Cuando la camioneta se encuentra en una zona sin cobertura celular o con DNS inaccesibles, cada llamada HTTP mediante fetch/axios esperaba hasta 4 o 10 segundos antes de fallar por timeout, congelando la interfaz visual del vendedor.
- **Decisión:**
  - En `services/httpApiService.ts`, se implementó un mecanismo de enfriamiento (`isKnownOffline`) de **25 segundos**.
  - Si una petición falla por falta de red o servidor no disponible, la bandera se activa y todas las peticiones subsecuentes durante los siguientes 25 segundos se desvían de inmediato al fallback de `localStorage` en **0 ms**.
  - Al transcurrir los 25 segundos, se realiza una prueba de ping pasiva en segundo plano para restablecer la conectividad si la red regresa.
- **Restricción:** El usuario nunca debe experimentar pantallas congeladas o demoras táctiles al registrar ventas en zonas sin señal.

## ADR-015 — Rediseño de venta y composición compartida (2026-11-08)

Por decisión expresa del usuario se adoptan cuatro columnas móviles, Mosaicos/Lista sobre el mismo carrito y panel de cantidad/presentación para conservar controles de 44 px. Se reutilizan AppContext, DataService y multipresentacion; no se duplican cálculos ni se cambia la API.

Paleta oliva/crema y marco común de hasta 960 px; pie del pedido en el flujo del layout. Vista/favoritos/orden quedan en almacenamiento web por usuario, sin prometer sincronización ni persistencia nativa. Las imágenes son referencia visual, no fuente de datos. Surtido/mapa dejan de rellenarse automáticamente con ejemplos; fallar la lectura de PDF debe producir un error, no otra nota fija. Los registros anteriores se conservan como historia, y el alcance verificado figura en [REDISENO_OLIVA_2026-11.md](REDISENO_OLIVA_2026-11.md).

## ADR-016 — Correcciones de interfaz y documentos compartidos (2026-11-09)

- **Estado:** Implementado localmente; validación integrada y física pendiente.
- **Decisión del usuario:** fondo principal blanco #FFFFFF con identidad oliva. Se conserva ADR-015: cuatro columnas exclusivamente en venta rápida y Mosaicos/Lista sin reiniciar estado.
- **Implementación:** InventoryProduct separa nombre, existencia/unidad y precio; desglose colapsable. location/geocodingService centralizan normalización y Maps. receiptDocument es el modelo común de comprobantes HTML/canvas; TicketModal usa el mismo HTML58/80 para previa e impresión. CSV exporta el reporte cargado con BOM UTF-8 y escape, sin prometer XLSX.
- **Lecturas públicas:** GET /api/v1/clientes/{id}/cuenta agrega saldo/límite y movimientos reales de crédito/abono, sin recalcular saldo. TopProductoReporteDto agrega presentación/unidad/cantidad comercial; no se modifican contratos de escritura ni esquemas.
- **Límites:** omitir identidad comercial no confirmada; no confundir error de cuenta con cero ni fixtures con datos operativos. Preferencias continúan locales web. GPS físico, SQL, PDF paginado e impresión térmica requieren evidencia propia.
- **Continuidad:** [CONTINUIDAD_ANTIGRAVITY.md](CONTINUIDAD_ANTIGRAVITY.md) y [detalle de incidencias](INCIDENCIAS_UI_2026-11-09.md). La mención oliva/crema de ADR-015 describe la primera propuesta; el fondo principal blanco corresponde a esta decisión posterior.

---

## ADR-017: Fondo Inicial en Esquema Relacional de Cortes y Conciliación SQL Server
- **Estado:** Aprobado e implementado en producción local/SQL Server (2026-11-25).
- **Contexto:** Existía una discrepancia entre el frontend (que sumaba el Fondo Inicial en el arqueo diario) y el backend (`CortesController.cs`), donde la tabla `Cortes` omitía la columna, calculando únicamente `Ventas + Cobranza - Gastos`.
- **Decisión:**
  - Se alteró la tabla `Cortes` en SQL Server: `ALTER TABLE Cortes ADD FondoInicial DECIMAL(18,2) NOT NULL DEFAULT 0.00;`.
  - Se actualizó la entidad EF Core `Corte` y los DTOs `CorteDetalleDto` y `RegistrarCorteRequestDto`.
  - Se unificó la fórmula oficial de arqueo en frontend y backend:
    $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} + \text{Cobranza} - \text{Gastos}$$
  - Los comprobantes de corte (58 mm y 80 mm) imprimen explícitamente el renglón de Fondo Inicial entregado por la mañana.
- **Restricción:** El fondo inicial no puede ser alterado unilateralmente al cierre sin dejar registro en auditoría.

---

## ADR-018: Pesaje Fraccionario Decimal en Báscula (`decimal(18,3)`)
- **Estado:** Aprobado e implementado en producción local/SQL Server (2026-11-25).
- **Contexto:** En el negocio de cremería y embutidos de Don Miguel, múltiples productos se venden al corte y se pesan en báscula electrónica digital en fracciones de kilo (ej. 0.450 kg de Queso Castel o Jamón). Las columnas de base de datos tipadas como `INT` truncaban estas fracciones a cantidades enteras o fallaban en deserialización JSON.
- **Decisión:**
  - Se ejecutó la migración SQL `05_alter_columns_to_decimal18_3.sql` alterando a `DECIMAL(18,3)`:
    - `Productos.Existencia`
    - `InventarioMovimientos.Piezas`
    - `VentaDetalles.CantidadPresentaciones`
    - `VentaDetalles.PiezasTotales`
  - Se actualizaron las entidades de EF Core y DTOs en C# (.NET 9) y TypeScript.
  - La lógica de stock y venta descuenta exactamente el peso fraccionario sin pérdida de precisión.
- **Restricción:** Queda prohibido truncar o redondear cantidades fraccionarias a enteros en controladores de backend o utilidades de frontend.

---

## ADR-019: Flujo Asíncrono de Autorización Remota Push para Sobregiro de Crédito
- **Estado:** Aprobado e implementado en producción local/SQL Server (2026-11-25).
- **Contexto:** Si un cliente solicita surtido a crédito superando su límite autorizado, la venta se bloqueaba sin opción de consulta en tiempo real, forzando llamadas telefónicas o cancelación de la venta en la camioneta.
- **Decisión:**
  - Se implementó la tabla `SolicitudesSobregiro` en SQL Server y endpoints dedicados:
    - `POST /api/v1/ventas/solicitar-sobregiro`: El chofer envía la petición desde `pago.tsx`.
    - `GET /api/v1/ventas/solicitudes-sobregiro`: Don Miguel consulta solicitudes pendientes en `creditos.tsx`.
    - `POST /api/v1/ventas/resolver-sobregiro`: Don Miguel autoriza/rechaza y emite token `AUTH-XXXXXX`.
    - `GET /api/v1/ventas/consultar-sobregiro/{token}`: El chofer consulta la resolución.
    - `POST /api/v1/ventas`: Valida el `TokenAutorizacionSobregiro` para permitir la transacción con sobregiro consentido.
- **Restricción:** Ninguna venta con exceso de crédito puede completarse sin un token de sobregiro válido emitido por el Administrador.

---

## ADR-020: Protocolo Binario ESC/POS para Impresión Térmica Directa Bluetooth (58/80 mm)
- **Estado:** Aprobado e implementado en producción local (2026-11-25).
- **Contexto:** Las impresoras térmicas de cinturón portátiles requieren una experiencia sin fricción para los choferes; abrir el cuadro de diálogo de impresión del sistema operativo (`window.print()`) es lento y propenso a errores en campo.
- **Decisión:**
  - Se implementó `services/bluetoothPrinterService.ts` con codificación ESC/POS directa:
    - `0x1B, 0x40` (Inicialización de cabezal `ESC @`).
    - `0x1B, 0x74, 0x02` (Code Page Latin CP850 `ESC t 2`).
    - Tabla de mapeo para acentos y caracteres españoles (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `Ñ`, `¿`, `¡`, `$`).
    - `0x1D, 0x56, 0x42, 0x00` (Comando de corte `GS V` para 80 mm).
    - Transmisión en paquetes BLE de 64 bytes para evitar desbordar el búfer de impresoras de cinturón.
  - Se integró el botón táctil "Imprimir Bluetooth (Directo ESC/POS)" en `TicketModal.tsx`, conservando la alternativa de guardado en PDF como respaldo.
- **Restricción:** Mantener compatibilidad transparente tanto para navegadores con Web Bluetooth como para dispositivos móviles.

---

## ADR-021: Segmentación Dinámica de Inventario por Ubicación (Bodega vs Camioneta)
- **Estado:** Aprobado e implementado en producción local/SQL Server (2026-11-25).
- **Contexto:** El chofer necesita ver únicamente lo disponible en su vehículo (`Camioneta 1`), mientras que Don Miguel requiere supervisar el stock central en `Bodega`.
- **Decisión:**
  - Se extendió `InventarioController.cs` con el parámetro `[FromQuery] string? ubicacion`, resolviendo las existencias a partir del historial relacional de movimientos por ubicación física.
  - En la vista de Inventario (`inventario.tsx`), el chofer visualiza por defecto el stock de su camioneta asignada, con posibilidad de alternar vista si cuenta con permisos de administrador.
- **Restricción:** Los traspasos de bodega a camioneta deben registrarse como movimientos formales para no duplicar ni perder trazabilidad del stock físico.
