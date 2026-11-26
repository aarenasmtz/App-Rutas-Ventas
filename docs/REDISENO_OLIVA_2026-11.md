# Rediseño oliva y crema — 8 de noviembre de 2026

**Registro histórico de la primera entrega.** Continuación al 2026-11-09 en [CONTINUIDAD_ANTIGRAVITY.md](CONTINUIDAD_ANTIGRAVITY.md) y [corrección de incidencias](INCIDENCIAS_UI_2026-11-09.md). El fondo principal actual es blanco/oliva; el backend recibió cambios de lectura posteriores. Las pruebas de esta primera entrega no acreditan los pendientes integrados de la segunda.

Rama: `optimizacion-interfaz-venta`. Implementación local, sin commit, push, despliegue, migraciones ni operaciones contra datos reales. Los cambios de documentación que ya estaban presentes se conservaron; esta entrega añade aclaraciones fechadas sin reemplazar el registro anterior.

## Alcance y criterios

- **Regla confirmada:** cuatro columnas en móvil, cinco accesos inferiores, venta de mostrador, mismo carrito al alternar vistas y cambiar cliente. Los importes y productos de las imágenes son ilustrativos.
- **Comportamiento observado:** frontend Expo 54 / React Native Web, estado de venta en `AppContext`, fachada `DataService`, adaptador HTTP y cola de sincronización existentes. Backend ASP.NET Core 9 / EF Core / SQL Server.
- **Pendiente:** aprobación visual en teléfono físico, validación integrada con API/SQL y corrección de discrepancias de negocio ya existentes. La compilación y las capturas no certifican esos procesos.

## Cobertura por pantalla

| Pantalla | Cambios implementados y archivos | Evidencia y límite de validación |
|---|---|---|
| Inicio | `app/(tabs)/index.tsx`: Nueva venta, ventas de hoy/cobrado/crédito, accesos Clientes/Cobrar, tres ventas recientes con fecha y estado; recarga al enfocar, estados de carga/error/vacío | Navegador 390×844; datos del servicio de prueba. Se conserva la definición actual de KPIs del servicio |
| Navegación | `app/(tabs)/_layout.tsx`: cinco pestañas, Vender destacado, área segura, marco común hasta 960 px | Navegación móvil y escritorio 1280×900 |
| Cliente de venta | `app/(tabs)/venta/index.tsx`: selección y mostrador, fila compacta, cambio conservando carrito; precios recalculados con el cliente recién seleccionado | Cambio A→B conservó búsqueda y cantidades; precio especial cambió 7→6, total 34.40→33.40 en prueba aislada |
| Venta rápida | Cuatro columnas con celdas porcentuales y separación de 7 px; Mosaicos/Lista; búsqueda por código/nombre; categorías del catálogo; favoritos y organización existentes; carga/error/vacío | 390×844 y 360×800: cuatro controles en la misma fila, altura de acción 44 px, sin desbordamiento horizontal de página. Escritorio: cuatro columnas dentro del marco de 960 px |
| Cantidad y presentaciones | `SaleProduct.tsx`, `SaleProductEditor.tsx`: nombre completo, estrella independiente, selector de presentación y cantidad en panel compartido | Nombre largo, paquete/exhibidor/caja con precios independientes, 0.450 kg; producto pendiente bloqueado. No se registró venta |
| Resumen y cobro | `venta/carrito.tsx`, `WorkflowSteps.tsx`, `utils/ventaResumen.ts`: paso Resumen, cantidades agrupadas por presentación/peso, pie en el flujo de layout | Carrito y métodos de pago abiertos; no se confirmó cobro ni se generó ticket real |
| Más opciones | `mas/index.tsx`: filas compactas; conserva módulos existentes y expone páginas adicionales ya disponibles | Menú administrador y vendedor inspeccionados. No equivale a autorización segura del backend |
| Detalle de ventas | `mas/ventas.tsx`: KPIs compactos, periodo semanal desde lunes, vendedores obtenidos de ventas, estados de pago | Tres comprobantes de prueba visibles con filtros; no se cancelaron ventas |
| Gastos | `mas/gastos.tsx`: formulario compacto y teclado adaptable, categoría/monto/concepto/pago/observaciones conservados | Abierto y cancelado en 390×844 y 360×500; último campo accesible. No prueba teclado nativo |
| Devoluciones | `mas/devoluciones.tsx`: destino físico y resolución separados visualmente, formulario y acciones conservados | Campos del formulario inspeccionados; no se guardaron devoluciones |
| Surtido PDF | `mas/surtido-nota.tsx`, `utils/readSupplyPdf.ts`: estado de nota/archivo, Pendientes/Todos, vinculación y cantidades; se elimina carga automática de ejemplos, historial fijo y sustitución de PDFs fallidos por notas fijas | Estado vacío verificado. Pruebas del lector: conserva resultado real y rechaza vacío/error/timeout. Sin carga ni aplicación de PDF real |
| Catálogo y categorías | `mas/productos.tsx`, `mas/categorias.tsx`: estilos compartidos, secciones de identidad/unidad/precios, sin precio/costo/stock de ejemplo precargado al crear; stock con unidad correcta | Catálogo y alta abiertos; alta sin guardar. Importación CSV y edición real pendientes |
| Cobranza | `mas/cobranza.tsx`: saldo y clientes con saldo, cliente compacto y acción Registrar abono, formulario en panel | Lista y formulario con métodos existentes inspeccionados; sin registrar abono |
| Corte | `mas/corte.tsx`: efectivo a entregar destacado, conserva fondo, trabajador/ruta, desglose, arqueo, cierre y ticket | Lectura de desglose con API de prueba; no se cerró jornada. Diferencia de fórmula con backend sigue pendiente |
| Trabajadores, rutas, revisión, bitácora, sincronización, instalación | Estilos/tamaños táctiles/ancho/formularios en pantallas existentes; sin nuevos procesos | Revisión de código y compilación. No todas las pantallas tienen QA visual individual ni pruebas de escritura |
| Clientes e inventario | Estilos compartidos, controles/formularios y marco común; se conservan rutas/servicios | Compilación; no se certifican altas, precios ni movimientos reales |
| Mapa | `ruta/mapa.tsx`: conserva Leaflet/OSM y atribución; elimina clientes y coordenadas inventados, distingue paradas sin ubicación, colores oliva, panel compacto y acciones | Mapa y atribución visibles, un marcador con coordenadas y otra parada sin ubicación. GPS/contacto externos no ejecutados |

## Componentes y servicios reutilizados

El rediseño usa `constants/theme.ts`, `AppShell`, `PageHeader`, `FormSectionTitle`, `BottomSheet`, botones y tarjetas existentes. Los nuevos `WorkflowSteps`, `SaleProduct` y `SaleProductEditor` componen el mismo flujo de venta; no hay un segundo carrito. Se conservan `AppContext`, `multipresentacion.ts`, DataService, validaciones de stock/crédito y rutas de cobro.

`httpApiService.ts` ahora entrega `precioEspecial` a partir del DTO existente `preciosEspeciales` tanto en lista como en detalle del cliente. No cambia endpoints ni payloads. El cambio de cliente utiliza explícitamente el nuevo cliente al recalcular, evitando una captura obsoleta del estado.

## Persistencia real

- Favoritos, orden manual y modo de orden conservan las funciones existentes por usuario en `localStorage`.
- Preferencia nueva: `miguel_vista_${userId}` (`mosaicos` / `lista`), con valor inicial mosaicos y recuperación ante un valor inválido o almacenamiento no disponible.
- Comprobado en navegador: mover producto 03 al inicio, guardar, marcar favorito y elegir Lista; tras recargar y volver a venta se conservaron las tres preferencias.
- Es almacenamiento del navegador/dispositivo. No se sincroniza entre equipos ni persiste de forma definitiva en React Native nativo. No se añadió API ni base de datos ficticia para preferencias.
- Carrito, cliente y filtros se conservan al alternar vistas; la persistencia del carrito completo tras cerrar/recargar la aplicación no es parte de esta preferencia nueva.

## Diferencias deliberadas frente a los mockups

1. Se aplican **cuatro** columnas, según la petición expresa, aunque la tercera imagen diga tres. El editor de cantidad se abre desde el mosaico para conservar áreas táctiles de al menos 44 px.
2. Los productos con varias presentaciones aparecen una vez en el catálogo y se editan en el panel existente; no se duplica cada producto por presentación en una venta paralela.
3. Cobranza muestra saldo y cantidad de clientes: no se inventa el indicador “cobrado hoy” que el contrato de esa pantalla no proporciona.
4. El PDF conserva la regla actual de creación de productos no vinculados al aplicar; no se incorpora el bloqueo “faltan todos los vínculos” del ejemplo visual. La eliminación de notas automáticas evita introducir mercadería de ejemplo en el flujo normal.
5. Se mantienen formularios completos y desplazamiento vertical. El mapa conserva su proveedor y todos los módulos administrativos siguen accesibles.

## Validación ejecutada

| Comprobación | Resultado |
|---|---|
| `node_modules/.bin/tsc.cmd --noEmit` | Código 0 |
| `node scripts/verify_redesign.cjs` | Código 0; unidades base 83, total 664, desglose 217; precios especiales independientes; etiquetas mixtas; preferencias aisladas sin red; lectura PDF válida/vacía/ilegible/timeout |
| `dotnet build backend/RutaVentas.Api/RutaVentas.Api.csproj --no-restore --nologo` | Código 0; 0 errores, 0 advertencias; sin ejecutar API ni migraciones |
| Expo `export --platform web --max-workers 2` | Código 0, 2504 módulos; salida temporal fuera del checkout. Avisos de baseline-browser-mapping antiguo y variables de color del terminal; no se actualizaron dependencias |
| Lint | No ejecutable con las dependencias actuales: ESLint y su configuración no están instalados. `expo lint` propondría instalarlos; no se instaló ni alteró el proyecto |
| Navegador | Inicio, mosaico/lista, cambio de cliente, resumen, favoritos/orden/preferencia tras recarga, Más por rol, ventas, alta de producto, gastos, devolución, cobranza, corte, surtido vacío y mapa |
| Teclado | Contenedores adaptables y formulario de gastos probado a altura reducida; teclado iOS/Android real pendiente |
| Offline, permisos y transacciones | Revisión de consumidores y conservación de rutas/handlers; sin validación integrada de API, colas, seguridad ni escrituras reales |

Las capturas están en [evidencia-redisenio](evidencia-redisenio/). Los nombres `Cliente de prueba` y `Producto de prueba` proceden de un servidor local independiente; no se importan en la aplicación. Las capturas del estado vacío del surtido no usan una nota inventada. `corte-390.jpg` conserva la captura anterior al ajuste final del campo de fondo; consultar la captura `corte-final-390.jpg` para el layout final.

## Reproducción de la previsualización aislada

Desde la raíz, con dependencias ya existentes, ejecutar en dos terminales:

```powershell
node scripts/preview_redesign_api.cjs
node scripts/preview_redesign.cjs
```

Abrir `http://127.0.0.1:8091`. El lanzador pasa la URL de prueba únicamente al proceso de Expo y no modifica `.env`. La API de prueba escucha en loopback, admite lecturas y rechaza escrituras HTTP. No confirmar ventas, abonos ni movimientos: el fallback local anterior de la aplicación puede registrar operaciones en su propio almacenamiento. Esta herramienta sirve para QA visual y de estado, no para certificar transacciones.

## Pendientes que esta entrega no declara resueltos

- **Caja:** el frontend suma fondo inicial (valor previo 500) y el backend calcula ventas + abonos − gastos sin ese fondo. No se cambiaron fórmula, DTO ni valor inicial para simular conciliación.
- **Peso y ventas históricas:** existen campos enteros en backend y limitaciones de snapshots de presentación/factor. El editor decimal y las etiquetas no acreditan almacenamiento de 0.450 kg de punta a punta.
- **Offline:** los fallbacks existentes pueden tratar errores de negocio HTTP como venta local y no todas las operaciones tienen cola. La sincronización automática no queda probada ni prometida por el banner.
- **Seguridad:** menú por rol verificado visualmente; autenticación, demo/switchRole, permisos efectivos y autorización del backend requieren auditoría separada. No se certifica BCrypt por una afirmación antigua de documentación.
- **Datos anteriores:** siguen existiendo fallbacks ilustrativos fuera de este alcance (por ejemplo trabajadores/distancias en lista de rutas, reportes y precios de alta rápida de surtido). El arranque completo del sistema no puede declararse libre de datos demo por haber limpiado esta pantalla y el mapa.
- **Surtido:** probar documentos reales, equivalencias decimales, crear/vincular, historial guardado y aplicación transaccional en entorno autorizado. La carga nativa antes simulaba un PDF; ahora informa que se utilice la web o captura manual.
- **Operación:** cobro completo, tickets, WhatsApp, impresión física/Bluetooth, GPS real, instalación PWA, seguridad y reconexión con API/SQL pendientes de validación específica.

Las fases visuales están implementadas con la cobertura indicada. La liberación operativa requiere resolver/validar estos pendientes; no se hizo push ni despliegue.
