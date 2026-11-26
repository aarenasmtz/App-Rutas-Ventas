# Corrección de incidencias de interfaz — 2026-11-09

Rama: `fix/incidencias-ui-inventario-gps-reportes`. Se conservó el rediseño y la documentación local existentes. No se ejecutaron migraciones, despliegues, push ni transacciones de negocio. Los datos de las capturas y archivos de prueba son sintéticos, servidos por una API local de lectura separada (8092/8912); no son datos incorporados a la aplicación.

## Resultado por incidencia

| Incidencia | Causa encontrada | Corrección | Validación real | Pendiente |
|---|---|---|---|---|
| 1. Fondo blanco | El fondo global neutral y algunas superficies principales seguían crema | Neutral principal #FFFFFF, login y contenedor de pestañas blancos; oliva y colores semánticos conservados | Tipos/exportación; inspección móvil de inventario, clientes, cuenta, mapa y reportes | Revisión exhaustiva en dispositivos físicos de todos los módulos |
| 2. Inventario | Encabezado competía con roles; tarjetas y desglose saturados; suma mezclaba unidades; detalle decía piezas para kg | Roles separados, acción principal ancha, dos acciones secundarias, tarjetas legibles, desglose colapsable, contador de referencias, unidad real también en detalle | 360 px, 390×844 y escritorio 1280×900; expandir/cerrar; 12,345.678 kg y detalle; escritorio sin desbordamiento horizontal | Selector de bodega/trabajador sigue sin segmentar existencias: limitación anterior, no corregida con datos ficticios |
| 3. Comprobante de venta | Canvas azul con RFC/teléfono fijos, nombres truncados y altura fija | Modelo común para HTML y canvas blanco/oliva, nombres completos, altura según contenido, identidad opcional configurada y leyenda no fiscal | Regresión y render real del canvas 920×1530; HTML con 70 nombres completos en 58/80 mm | Impresión física, guardado PDF del diálogo y paginación del controlador; identidad oficial aún no proporcionada |
| 4. Colonia/GPS | Reverse geocoding no reconocía quarter/residential; captura podía sobrescribir campos | Normalización compartida, prioridad neighbourhood/quarter/suburb/residential, conservar entrada manual, timeout y errores, coordenadas validadas al guardar | Regresiones de variantes/sin colonia y coordenadas; consulta pública de Nominatim devolvió quarter=Zona Centro | Permiso/timeout GPS real y guardar/reconsultar un cliente desde celular; no se modificaron clientes para probar |
| 5. Cómo llegar | Construcción repetida con campos incompletos y comprobaciones que descartaban cero | Helper único: coordenadas válidas primero, dirección parcial limpia después, sin undefined/null; edición si falta ubicación | Casos 0,0, fuera de rango y dirección parcial; consumidor ficha/mapa revisado | Apertura de Google Maps en dispositivo con el cliente real seleccionado |
| 6. Cuenta | Formato monetario asumía número y se mostraban movimientos de ejemplo | Formateador seguro; endpoint de lectura; saldo autoritativo, créditos/abonos reales; carga/error/reintento y cero separados | Navegador: carga, saldo cero sin movimientos, saldo120 con cargo170/abono50, respuesta incompleta y HTTP503; regresión de cliente incorrecto | Consulta EF/SQL contra base de prueba y conciliación con apertura/devoluciones; no se ejecutó API contra datos reales |
| 7. Regreso de cartera | Entrada desde Más se trataba como pestaña; redirección global impedía enlaces directos | Parámetro de origen, regresar a Más, pestaña Clientes limpia origen, conservar búsqueda en navegación; redirección de sesión solo donde corresponde | Más→Cartera→Regresar→Más; pestaña Clientes sin flecha y búsqueda conservada; recarga de enlace directo conserva ruta | Caducidad/autenticación real, fuera del alcance de este ajuste |
| 8. Mapa | Controles dispersos, selección recargaba iframe y línea recta parecía ruta calculada | Agrupación de controles, ficha/lista compactas, estado de carga/error/reintento, coordenadas inválidas en lista, sin línea de ruta inventada | Leaflet/OSM y atribución; zoom/lista; 390×844 sin desbordamiento de página; se observó error de mosaicos externos con reintento visible | Cobertura/permiso GPS, conectividad real y navegación externa; mosaicos dependen del servicio público |
| 9. Reporte imprimible | Vista previa monoespaciada; presentación usada como nombre en fallback | HTML compartido 58/80 mm, periodo/generación, nombre real y presentación/cantidad, sin registros ilustrativos de backend | Vista previa móvil ambos anchos; HTML extenso conserva70 productos, 58mm sin desbordamiento de contenido | Impresora y PDF multipágina del sistema operativo |
| 10. CSV | Abría endpoint externo sin asegurar descarga ni coincidencia con lo visto | Exportar el reporte cargado, BOM UTF-8, comillas/escape, nombre con periodo, progreso/error y enlace de descarga; endpoint legado sin ejemplos | Archivo realmente descargado y leído:525 bytes/21 filas, BOM, acentos, comillas, salto de línea, Caja/2/960; parser independiente | En nativo se comparte contenido CSV como texto; archivo adjunto requiere integración nativa; no hay XLSX |

## Archivos principales

- `components/InventoryProduct.tsx`, `app/(tabs)/inventario.tsx`, `constants/theme.ts`.
- `utils/location.ts`, `services/geocodingService.ts`, `app/(tabs)/clientes.tsx`, `app/(tabs)/ruta/mapa.tsx`.
- `utils/customerAccount.ts`, `utils/helpers.ts`, `app/(tabs)/ruta/cliente/[id].tsx`, `services/httpApiService.ts`, `services/mockDataService.ts`, `backend/RutaVentas.Api/Controllers/ClientesController.cs`.
- `utils/receiptDocument.ts`, `components/TicketModal.tsx`, `services/ticketImageService.ts`, `services/ticketPrinterService.ts`, `app/(tabs)/venta/confirmacion.tsx`.
- `utils/reportExport.ts`, `app/(tabs)/mas/reportes.tsx`, `backend/RutaVentas.Api/Controllers/ReportesController.cs`, `backend/RutaVentas.Api/DTOs/ApiDtos.cs`.
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/mas/index.tsx`.

## Evidencia y reproducción

Ejecutado con dependencias existentes:

```
npx tsc --noEmit
dotnet build backend/RutaVentas.Api --no-restore
node scripts/verify_redesign.cjs
node scripts/verify_incidents.cjs
node node_modules/expo/bin/cli export --platform web --output-dir <carpeta-temporal> --max-workers 2
```

Tipos y compilación .NET aprobados (0 errores/0 advertencias .NET). Exportación web aprobada (2510 módulos). Los scripts usan almacenamiento aislado y no envían operaciones de negocio. `verify_incidents.cjs <CSV-descargado>` también valida un archivo descargado desde la UI. Lint no ejecutable con la instalación actual: faltan ESLint/configuración; no se instalaron dependencias. Las advertencias de antigüedad de baseline-browser-mapping y NO_COLOR no impidieron compilar.

Capturas en [evidencia-incidencias](evidencia-incidencias/): inventario móvil/escritorio/detalle kg, cuenta cero/incompleta/503, mapa y previas de reporte. `comprobante-imagen.jpg` muestra el canvas real. `venta-larga-58.html` y `venta-larga-80.html` tienen70 productos con nombres largos; verificar HTML no certifica paginación de un PDF impreso. `reporte-descargado.csv` es la copia comprobada de la descarga; los demás HTML/CSV son fixtures de regresión.

La identidad comercial puede configurarse en `expo.extra.businessIdentity` (`nombre`, `rfc`, `telefono`, `direccion`); solo se imprimen valores presentes. Al no haberse confirmado esa información se omite, sin reemplazarla por RFC, teléfono o razón social inventados.

## Límites y hallazgos adicionales

- **Regla confirmada:** no alterar ventas históricas, factores, precios ni saldos al rediseñar. Este cambio no recalcula ni persiste esos datos.
- **Comportamiento observado:** la cuenta presenta el saldo almacenado y movimientos de ventas a crédito no canceladas/abonos de cobranza; no reconstruye un libro contable completo ni inventa movimientos de apertura.
- **Comportamiento observado:** autenticación de demostración, distanciasMock de clientes, selector de almacén y diferencias en fórmulas financieras local/backend son anteriores y requieren trabajo separado. El mapa ya no dibuja una supuesta ruta calculada.
- **Hipótesis pendiente:** identidad legal/comercial definitiva, impresoras/controladores reales y política de adjuntos CSV nativos. GPS en celular y lectura del nuevo endpoint con SQL requieren validación integrada.
- Se conserva la cola de sincronización; no se certificó sincronización extremo a extremo. Ante error la cuenta informa el fallo, sin sustituirlo por saldo cero.

Referencias oficiales consultadas para estos cambios: [Nominatim Reverse](https://nominatim.org/release-docs/latest/api/Reverse/), [salidas de Nominatim](https://nominatim.org/release-docs/latest/api/Output/), [política del servicio público](https://operations.osmfoundation.org/policies/nominatim/), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) y [CSS Paged Media, tamaño de página](https://www.w3.org/TR/css-page-3/#page-size-prop). No se enviaron coordenadas privadas del usuario en las comprobaciones.

## Punto de relevo

La continuación y las prioridades posteriores están consolidadas en [CONTINUIDAD_ANTIGRAVITY.md](CONTINUIDAD_ANTIGRAVITY.md). La actualización documental posterior no vuelve a ejecutar las pruebas anteriores ni cambia su alcance.
