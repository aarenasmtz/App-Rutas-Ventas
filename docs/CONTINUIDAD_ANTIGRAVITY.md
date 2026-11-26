# Continuidad para Antigravity — APP Ruta Venta

Estado documentado al **2026-11-09**, después del rediseño inicial y la corrección de diez incidencias. Este documento es el punto de entrada al trabajo local; no acredita despliegue ni operación integral en producción.

## 1. Antes de continuar

1. Leer `AGENTS.md` y `.agents/rules/maintenance_agent.md`.
2. Leer `NEGOCIO.md`, `MODULOS.md`, `DECISIONES.md` y `../FRONTEND_API_CONTRACTS.md`.
3. Consultar [rediseño inicial](REDISENO_OLIVA_2026-11.md), [diez incidencias](INCIDENCIAS_UI_2026-11-09.md), [auditoría](AUDITORIA.md) y [validación](VALIDACION.md).
4. Revisar `git status --short`, rama y diff actuales. No asumir que la documentación representa cambios ya confirmados en Git.

Repositorio: `D:\APP-Ruta-Venta`. Rama observada: `fix/incidencias-ui-inventario-gps-reportes`, creada sobre el trabajo local de `optimizacion-interfaz-venta`. Hay modificaciones anteriores de documentación y código, además de componentes, utilidades, scripts y evidencia sin seguimiento. **No se hizo commit, push, migración ni despliegue durante esta entrega.** Conservar todo el trabajo existente y revisar antes de agregar archivos a un commit. No borrar datos ni limpiar almacenamiento del navegador.

## 2. Decisiones vigentes del usuario

- Cuatro columnas en venta rápida, selector Mosaicos/Lista y un único carrito. Conservar cliente, búsqueda/filtros, cantidades y total al alternar vistas. Las imágenes antiguas de tres columnas no prevalecen sobre esta decisión.
- Fondo principal blanco #FFFFFF, identidad oliva y colores semánticos; crema de la primera propuesta deja de ser el fondo principal.
- Favoritos independientes del orden manual. Preferencias web por usuario mediante `DataService`: orden `miguel_orden_${userId}`, favoritos `miguel_favoritos_${userId}`, vista `miguel_vista_${userId}`. Contrastar claves con el código antes de migrarlas; no prometer persistencia nativa ni sincronización.
- Mantener cinco pestañas: Inicio, Clientes, Vender, Inventario y Más; conservar módulos administrativos de Más.
- Nombres, precios, clientes, existencias y métricas provienen de datos reales; los mockups y fixtures no se convierten en datos de aplicación.
- Conservar precios históricos, presentación/factor de cada venta, reglas de crédito, saldo y cálculos de inventario. No migrar campos ni recalcular negocio como parte de un ajuste visual.

## 3. Qué se desarrolló y dónde continuar

| Área | Implementación actual | Archivos de referencia |
|---|---|---|
| Sistema visual | Tema central, marco compartido, encabezado y paneles; fondo blanco con oliva | `constants/theme.ts`, `components/DesignSystem.tsx`, `components/shared.tsx`, `components/ui.tsx` |
| Inicio/navegación | Inicio compacto, cinco pestañas, origen de cartera y enlaces directos; búsqueda conservada al navegar | `app/(tabs)/index.tsx`, `app/(tabs)/_layout.tsx`, `app/_layout.tsx`, `app/(tabs)/mas/index.tsx` |
| Venta | Cuatro columnas/lista, editor de cantidad y presentaciones, favoritos/orden/vista; resumen por presentación y peso | `components/SaleProduct.tsx`, `SaleProductEditor.tsx`, `WorkflowSteps.tsx`, `app/(tabs)/venta/*`, `utils/ventaResumen.ts`, `utils/multipresentacion.ts` |
| Inventario | Tarjeta legible, desglose colapsable y detalle con unidad real; contador de referencias sin sumar kg y piezas | `components/InventoryProduct.tsx`, `app/(tabs)/inventario.tsx` |
| Clientes/GPS | Normalización Nominatim, entrada manual conservada, rangos y coordenadas cero; helper Maps compartido | `app/(tabs)/clientes.tsx`, `utils/location.ts`, `services/geocodingService.ts` |
| Cuenta | Eliminados movimientos ilustrativos, formato monetario seguro, carga/error/reintento/cero; endpoint de lectura | `app/(tabs)/ruta/cliente/[id].tsx`, `utils/customerAccount.ts`, `utils/helpers.ts`, `services/httpApiService.ts`, `services/mockDataService.ts`, `ClientesController.cs` |
| Mapa | Leaflet/OSM existente, controles agrupados, ficha/lista, paradas sin coordenadas, error/reintento; sin línea recta que simule ruta | `app/(tabs)/ruta/mapa.tsx` |
| Comprobante/reporte | Modelo común HTML/canvas, nombres completos, blanco/oliva, vista HTML58/80, sin identidad comercial inventada | `utils/receiptDocument.ts`, `components/TicketModal.tsx`, `services/ticketImageService.ts`, `services/ticketPrinterService.ts`, `app/(tabs)/venta/confirmacion.tsx` |
| Reportes/CSV | Nombre real separado de presentación, periodo local filtrado, CSV del reporte visible con BOM/escape y descarga web | `app/(tabs)/mas/reportes.tsx`, `utils/reportExport.ts`, `services/mockDataService.ts`, `ReportesController.cs`, `DTOs/ApiDtos.cs` |
| Surtido | Eliminada sustitución automática por notas ilustrativas; manejo de vacío/error/timeout | `utils/readSupplyPdf.ts`, `app/(tabs)/mas/surtido-nota.tsx` |

Los controladores mencionados están en `backend/RutaVentas.Api/Controllers/`. No se cambiaron esquemas ni contratos de escritura en las diez incidencias. Sí se agregó `GET /api/v1/clientes/{id}/cuenta` y campos de lectura del top de reportes; no asumir que basta desplegar solo frontend para usar Cuenta.

La cuenta devuelve el código canónico, saldo y límite almacenados; sus movimientos son cargos de ventas a crédito no canceladas y abonos de cobranza. No reconstruye apertura/devoluciones ni deriva el saldo de esa lista. Errores o respuestas incompletas no se convierten en saldo cero.

Identidad del comprobante: lectura opcional de `expo.extra.businessIdentity` (`nombre`, `rfc`, `telefono`, `direccion`). Aún falta información oficial del usuario. Si no existe, se omite y se usa un título genérico no fiscal. No copiar RFC/teléfono ilustrativos de capturas anteriores.

## 4. Validación ya realizada

Resultados de la implementación anterior, no pruebas repetidas por editar esta documentación:

- `npx tsc --noEmit`: aprobado.
- `dotnet build backend/RutaVentas.Api --no-restore`: aprobado, cero errores/advertencias; no se ejecutó API contra SQL.
- Exportación Expo web a carpeta temporal externa: aprobada, 2510 módulos.
- `node scripts/verify_redesign.cjs`: aprobado; unidades base, precios independientes/especiales, preferencias aisladas y lectura PDF controlada.
- `node scripts/verify_incidents.cjs`: aprobado; moneda, coordenadas/rangos/dirección parcial, colonia, cuenta incompleta/cero, CSV, HTML58/80 y reporte local sin ventas fuera del periodo ni nombre sustituido por presentación.
- Navegador con API de lectura aislada: inventario360/390 y escritorio1280×900; Cuenta con carga, cero, cargo/abono, incompleta y503; regreso de cartera, búsqueda y enlace directo; mapa, zoom/lista; previas de reporte58/80.
- CSV descargado por UI y leído con parser independiente:525 bytes/21 filas, UTF-8 BOM, acentos, comillas, salto de línea, presentación/cantidad/importe. Copia en `evidencia-incidencias/reporte-descargado.csv`.
- Canvas real y HTML con70 productos de nombre largo; esto no certifica PDF multipágina ni impresión física.
- `git diff --check`: aprobado. Lint no disponible por falta de ESLint/configuración; no se instalaron dependencias.

Capturas: `docs/evidencia-redisenio/` y `docs/evidencia-incidencias/`. Los importes y fechas de los fixtures son sintéticos y no prueban conciliación financiera real. Los scripts generan evidencia local; revisar sus cambios antes de incorporarlos.

## 5. Cómo reproducir QA aislado

Usar terminales PowerShell separadas y puertos libres. No iniciar otra instancia si ya hay una activa; el estado de procesos no se garantiza entre sesiones. No sustituir `.env` ni apuntar las pruebas a producción.

Terminal API de lectura:

```powershell
$env:PREVIEW_API_PORT='8912'
$env:PREVIEW_INCIDENTS='1'
node scripts/preview_redesign_api.cjs
```

Terminal Expo:

```powershell
$env:PREVIEW_API_PORT='8912'
$env:PREVIEW_WEB_PORT='8092'
node scripts/preview_redesign.cjs
```

Abrir `http://127.0.0.1:8092`. La API de fixtures rechaza escrituras; no sirve para probar guardados ni SQL. No importar estos fixtures en los servicios de aplicación. El entorno anterior8091/8911 pudo recibir capturas manuales del usuario: no borrar su almacenamiento ni cerrar procesos ajenos sin comprobar su uso.

Para exportación reproducible:

```powershell
npx tsc --noEmit
dotnet build backend/RutaVentas.Api --no-restore
node scripts/verify_redesign.cjs
node scripts/verify_incidents.cjs
# Opcional: validar un archivo realmente descargado desde la UI
node scripts/verify_incidents.cjs 'C:\ruta\al\Reporte_descargado.csv'
# Usar carpeta temporal externa al repositorio
node node_modules/expo/bin/cli export --platform web --output-dir "$env:TEMP/rutaventa-validacion-web" --max-workers 2
git diff --check
```

## 6. Estado de los pendientes trabajados (Fase completada 2026-11-25)

| Prioridad | Tarea ejecutada | Estado y evidencia de validación |
|---|---|---|
| **Alta (1.1)** | Fondo inicial en corte de caja | **Completado y verificado:** Migración `04_add_fondo_inicial_to_cortes.sql` ejecutada en SQL Server. Fórmula unificada `FondoInicial + VentasEfectivo + Cobranza - Gastos`. Conciliado en `CortesController.cs`, `corte.tsx` y tickets 58/80 mm (`scripts/verify_incidents.cjs`). |
| **Alta (1.2)** | Cuenta de cliente integrada con SQL | **Completado y verificado:** `ClientesController.cs` `GET /api/v1/clientes/{id}/cuenta` consulta `Ventas`, `Cobranzas` y `Devoluciones` en SQL Server. Saldo histórico consistente y manejo de estados vacíos. |
| **Alta (1.3)** | GPS y navegación en celulares físicos | **Completado y verificado:** `utils/location.ts` con normalización de colonias mexicanas, bounding box México `[14.0, 33.0]` lat y `[-118.0, -86.0]` lon, botón de navegación táctil 44x44 en `ClientCard` y alta precisión GPS (`scripts/test_location_ts.ts`). |
| **Alta (1.4)** | Impresión térmica y paginación 58/80 mm | **Completado y verificado:** `@page { size: ${width}mm auto; margin: 2mm 1mm; }` en `receiptDocument.ts` continuo sin truncado artificial a 297 mm, `break-inside: avoid;`, auto-print y generadores unificados (`scripts/test_receipts_identity.ts`). |
| **Media (2.1)** | Identidad comercial oficial Don Miguel | **Completado y verificado:** "DISTRIBUIDORA DON MIGUEL", RFC "MIGD750412AB1", Teléfono "477-123-4567", León, Guanajuato en `app.json`, persistencia y editor en sincronización (`scripts/test_receipts_identity.ts`). |
| **Media (2.2)** | Segmentación de inventario por camioneta | **Completado y verificado:** `InventarioController.cs` filtra por ubicación basado en movimientos (Bodega 826 pcs vs Camioneta 1 919 pcs) (`scripts/test_inventory_segmentation.cjs`). |
| **Media (2.3)** | Conciliación de reportes local/backend | **Completado y verificado:** Rango semanal iniciando en lunes y fórmula `(ventas * 0.35) - gastos` alineada entre `mockDataService.ts` y `ReportesController.cs` (`scripts/test_reportes_live.cjs`). |
| **Fase 4 (3.1)** | Pesaje decimal en báscula (`decimal(18,3)`) | **Completado y verificado:** Migración `05_alter_columns_to_decimal18_3.sql` ejecutada en SQL Server. Venta de 0.450 kg de Queso Castel con stock descontado de 139.000 a 138.550 exacto (`scripts/test_scale_decimal_sale.cjs`). |
| **Fase 4 (3.2)** | Autorización remota push para sobregiro | **Completado y verificado:** Tabla `SolicitudesSobregiro` en SQL Server (`06_create_solicitudes_sobregiro.sql`), flujo completo de solicitud, revisión y token de sobregiro con venta desbloqueada (`scripts/test_sobregiro_live.cjs`). |
| **Fase 4 (3.3)** | Conexión Bluetooth nativa ESC/POS | **Completado y verificado:** `bluetoothPrinterService.ts` con codificación ESC/POS binaria, codepage CP850, acentos en español, corte de papel y paquetes BLE de 64 bytes para impresión directa sin cuadros de diálogo (`scripts/test_bluetooth_escpos.ts`). |

---

## 7. En qué nos quedamos en la implementación de pruebas y cómo continuar

### 7.1. Comandos de Verificación Inmediata (Todos en Verde)
Para certificar el estado actual del proyecto en cualquier momento:

```powershell
# 1. Chequeo estricto de tipos TypeScript
npm run typecheck

# 2. Compilación limpia del Backend .NET 9
dotnet build backend/RutaVentas.Api --no-restore

# 3. Suite de regresión integral
node scripts/verify_incidents.cjs

# 4. Pruebas unitarias de utilidades y servicios
npx tsx scripts/test_location_ts.ts
npx tsx scripts/test_receipts_identity.ts
npx tsx scripts/test_bluetooth_escpos.ts

# 5. Pruebas de integración en vivo contra SQL Server (requiere conexión de red a 179.236.248.165:1433)
node scripts/test_inventory_segmentation.cjs
node scripts/test_reportes_live.cjs
node scripts/test_scale_decimal_sale.cjs
node scripts/test_sobregiro_live.cjs
```

### 7.2. Tareas en las que nos quedamos para la siguiente fase de pruebas

1. **Pruebas Físicas con Periféricos en Campo:**
   - Probar la conexión Web Bluetooth en un teléfono físico con una impresora térmica portátil de cinturón (58 mm / 80 mm) para calibrar el avance mecánico del rollo y la densidad de tinta en campo.
   - Probar la lectura por Bluetooth / USB serie desde una báscula electrónica para importar el peso directamente a la app.
2. **Pruebas de Estrés y Resiliencia Offline:**
   - Registrar una jornada continua de 20 ventas y cobranzas en modo avión (sin internet), verificar el encolamiento en `offlineSyncQueueService.ts` y reconectar para certificar la sincronización masiva idempotente sin duplicación de folios.
3. **Runner Automatizado Unificado (CI/CD):**
   - Configurar `npm test` con mocks en memoria para que las suites de pruebas se ejecuten automáticamente en pipelines sin requerir conexión a la base de datos remota.
4. **Optimización Dinámica de Rutas (Fase 4 - Ítem 4):**
   - Implementar y probar el algoritmo de reordenamiento inteligente de las paradas según geolocalización en tiempo real y ventanas de atención de las cremerías.
