# AGENTE PERSISTENTE DE MANTENIMIENTO, ARQUITECTURA Y VALIDACIÓN (RutaVentas - Don Miguel)
## Guía Oficial de Colaboración para Modelos de Inteligencia Artificial (Codex & Antigravity)

Este archivo define las directivas, principios de diseño y restricciones obligatorias para cualquier modelo o asistente de IA (incluyendo **Codex** y **Antigravity**) que trabaje en el repositorio `APP-Ruta-Venta`. Su objetivo es garantizar una visión compartida y una evolución coherente del producto.

---

## 1. MISIÓN Y ROLES DEL AGENTE

El agente opera simultáneamente como:
1. **Arquitecto de Software:** Asegura que los cambios respeten el stack tecnológico actual (React Native Web / Expo SDK 54, ASP.NET Core 9 / SQL Server), sin introducir frameworks innecesarios ni duplicar lógica.
2. **Analista de Negocio:** Protege las reglas comerciales de Don Miguel (distribución en camioneta, venta de abarrotes y perecederos, clientes con crédito/precio especial, multipresentaciones, fondo inicial y corte cuadrado).
3. **Responsable de Calidad (QA):** Exige validación con evidencia proporcional al riesgo antes de declarar cualquier tarea terminada (`tsc --noEmit`, `dotnet build`, pruebas de navegación).

---

## 2. REGLAS FUNDAMENTALES Y CRITERIOS DE DECISIÓN

### 2.1. Protección de Datos y Estabilidad
- **PROHIBIDO** borrar datos reales o ejecutar migraciones destructivas sin autorización explícita.
- **PROHIBIDO** alterar el historial de ventas pasadas para adaptarlo a cambios nuevos en configuración. Las ventas históricas deben conservar el precio, presentación y factor aplicado en su momento.
- **PROHIBIDO** hardcodear datos de negocio (precios, clientes, nombres de productos, existencias) en componentes visuales o servicios. El sistema debe arrancar en **Zero-State** limpio (`0 clientes`, `0 productos`) hasta que se importen o capturen.

### 2.2. Distinción Estricta de Certeza
Al analizar requerimientos o código, clasifica siempre la información en:
1. **Regla Confirmada:** Validada expresamente por el cliente (ej. Queso Castel: 1 paquete = unidad base, 1 exhibidor = 10 paquetes, 1 caja = 60 paquetes; Efectivo Esperado con Fondo Inicial).
2. **Comportamiento Observado:** Lo que el código hace actualmente (puede tener bugs o ser un parche previo).
3. **Hipótesis Pendiente:** Suposiciones técnicas o comerciales que deben validarse antes de cambiar contratos.

---

## 3. PROTOCOLO OBLIGATORIO PARA CADA CAMBIO

Cada modificación debe seguir este ciclo:

```
[ANTES] -> Consultar docs/NEGOCIO.md, docs/MODULOS.md, docs/DECISIONES.md
        -> Identificar consumidores y contratos públicos afectados
        -> Definir criterio de aceptación y caso de prueba

[DURANTE]-> Cambios mínimos, focalizados y coherentes
         -> Reutilizar servicios centralizados (DataService, multipresentacion.ts)
         -> Respetar ergonomía móvil: botones ≥ 44×44 px, 0 scroll en pantallas clave

[DESPUÉS]-> Ejecutar verificación real (tsc --noEmit, dotnet build, pruebas en navegador)
         -> Actualizar docs/AUDITORIA.md y docs/VALIDACION.md
         -> Documentar qué se verificó y qué quedó pendiente
```

---

## 4. FUENTES DE CONOCIMIENTO PERSISTENTE EN EL REPOSITORIO

Todo el conocimiento operativo reside en los siguientes documentos:

| Documento | Propósito |
|---|---|
| [`docs/NEGOCIO.md`](file:///d:/APP-Ruta-Venta/docs/NEGOCIO.md) | **Glosario, roles, 10 flujos operativos de punta a punta**, reglas confirmadas (Castel, crédito, arqueo con fondo inicial, surtido PDF, importación CSV) y casos de borde. |
| [`docs/MODULOS.md`](file:///d:/APP-Ruta-Venta/docs/MODULOS.md) | **Mapa arquitectónico de los 13 módulos reales**, archivos front/back, contratos I/O, rutas y persistencia. |
| [`docs/DECISIONES.md`](file:///d:/APP-Ruta-Venta/docs/DECISIONES.md) | **Registro de Decisiones Arquitectónicas (ADRs)** desde ADR-001 hasta ADR-014 con motivos y restricciones técnicas. |
| [`docs/AUDITORIA.md`](file:///d:/APP-Ruta-Venta/docs/AUDITORIA.md) | **Bitácora viva de hallazgos priorizados (P0 a P3)**, causas raíz, soluciones aplicadas y evidencia de remediación. |
| [`docs/VALIDACION.md`](file:///d:/APP-Ruta-Venta/docs/VALIDACION.md) | **Matriz de casos de prueba ejecutados y aprobados**, pruebas automatizadas en scripts Node.js y navegadores móviles. |
| [`FRONTEND_API_CONTRACTS.md`](file:///d:/APP-Ruta-Venta/FRONTEND_API_CONTRACTS.md) | **Especificación exhaustiva de DTOs y endpoints HTTP** de los 18 controladores de ASP.NET Core 9. |
| [`FRONTEND_REDESIGN_PLAN.md`](file:///d:/APP-Ruta-Venta/FRONTEND_REDESIGN_PLAN.md) | **Bitácora de fases completadas (Fase 1, 2 y 3)** y roadmap estratégico para futuras versiones. |
| [`MANUAL_OPERATIVO_ENTREGA.md`](file:///d:/APP-Ruta-Venta/MANUAL_OPERATIVO_ENTREGA.md) | **Guía de usuario paso a paso** para el Administrador (Don Miguel) y choferes en ruta (Juan, Pedro). |

---

## 5. RESUMEN DE LA IMPLEMENTACIÓN ACTUAL (ESTADO DEL PROYECTO)

**Actualizado al 2026-11-25:** comenzar la continuación en [CONTINUIDAD_ANTIGRAVITY.md](docs/CONTINUIDAD_ANTIGRAVITY.md). La rama local es `fix/incidencias-ui-inventario-gps-reportes`. Se implementaron y validaron al 100% los 10 requerimientos priorizados (Alta, Media y Fase 4).

### Frontend (Expo SDK 54 / React Native Web)
- **Inicio Compacto (`app/(tabs)/index.tsx`):** Composición oliva, fondo principal blanco `#FFFFFF`, acción Nueva venta y 3 KPIs (Ventas hoy, Cobrado hoy, Crédito hoy).
- **Catálogo de Venta (`app/(tabs)/venta/index.tsx`):**
  - Mosaico de **CUATRO columnas** y selector Mosaicos / Lista por petición expresa del usuario.
  - `SaleProduct` y `SaleProductEditor` comparten carrito y panel de cantidad/presentación; cambiar vista conserva cliente, filtros, cantidades y total.
  - Controles táctiles ≥ 44×44 px; reutilización de `multipresentacion.ts` para conversión y precios independientes.
  - **Pesaje fraccionario decimal:** Venta directa de fracciones de kilo (ej. 0.450 kg) en báscula digital con cálculo exacto de subtotal.
  - **Favoritos independientes:** Estrella táctil superior derecha desacoplada del orden del catálogo.
  - **Mi orden:** Persistencia web por usuario en `miguel_orden_${userId}`.
- **Carrito y Cobro Unificado (`app/(tabs)/venta/carrito.tsx` & `pago.tsx`):**
  - Resumen de pedido, selector rápido de método de pago (Efectivo, Tarjeta, SPEI, Crédito, Combinado).
  - **Sobregiro con Autorización Remota:** Si la venta a crédito excede el límite disponible del cliente (HTTP 422 `requiereAutorizacion: true`), se activa el panel para enviar solicitud remota a Don Miguel y reintentar con el `TokenAutorizacionSobregiro`.
- **Mapa de Ruta (`app/(tabs)/ruta/mapa.tsx`):** Leaflet + OpenStreetMap con 0 scroll vertical inicial, marcadores gota numerados, halo ámbar en selección, ficha compacta con botón directo a Vender, cálculo de distancias por GPS real de alta precisión (`navigator.geolocation`) y navegación externa asistida.
- **Navegación Móvil (`utils/location.ts` & `ClientCard`):** Normalización de colonias mexicanas, validación de coordenadas en México (`[14.0, 33.0]` lat y `[-118.0, -86.0]` lon) y botón táctil dedicado de 44×44 px para abrir Google Maps / Waze.
- **Cuenta de Cliente SQL (`app/(tabs)/ruta/cliente/[id].tsx`):** Conectada con `GET /api/v1/clientes/{id}/cuenta` en SQL Server, desglosando ventas a crédito, cobranza y devoluciones reales con saldo cronológico.
- **Corte Diario y Arqueo Cuadrado (`app/(tabs)/mas/corte.tsx`):** Conciliación oficial que suma `FondoInicial`, calcula diferencia de caja y genera ticket térmico continuo (58mm/80mm).
- **Identidad Comercial Don Miguel (`app.json` & `sincronizacion.tsx`):** "DISTRIBUIDORA DON MIGUEL", RFC "MIGD750412AB1", Tel: "477-123-4567", León, Guanajuato, editable y persistida en todos los comprobantes.
- **Impresión Térmica Bluetooth Nativa ESC/POS (`services/bluetoothPrinterService.ts` & `TicketModal.tsx`):** Codificación binaria pura con CP850, acentos en español, comando de corte `GS V` y transmisión BLE por paquetes de 64 bytes para impresión en impresoras de cinturón sin cuadros de diálogo del sistema operativo.

### Backend (.NET 9 / SQL Server `179.236.248.165:1433`)
- **18 Controladores RESTful:** Auth, Dashboard, Productos, Ventas, Clientes, Cobranza, Inventario, Cortes, Gastos, Devoluciones, Rutas, Empleados, Categorías, Bitácora, Reportes, Revisión, Importaciones y Sync.
- **Soporte Decimal Completo:** Columnas `Productos.Existencia`, `InventarioMovimientos.Piezas`, `VentaDetalles.CantidadPresentaciones` y `VentaDetalles.PiezasTotales` migradas a `DECIMAL(18,3)` en SQL Server sin pérdida de datos.
- **Flujo de Sobregiro Transaccional:** Tabla `SolicitudesSobregiro` en SQL Server con endpoints `solicitar-sobregiro`, `solicitudes-sobregiro`, `resolver-sobregiro` y `consultar-sobregiro/{token}`.
- **Fondo Inicial en Cortes:** Columna `FondoInicial DECIMAL(18,2)` en tabla `Cortes` y conciliación unificada en `CortesController.cs`.
- **Segmentación por Camioneta:** `InventarioController.cs` desglosa existencias por `Ubicacion` basado en el histórico de movimientos.
- **Conciliación de Reportes:** Semana contable iniciando en lunes y fórmula unificada de utilidad estimada `(ventas * 0.35) - gastos`.

---

## 6. ESTADO DE PRUEBAS Y EN QUÉ NOS QUEDAMOS

### 6.1. Pruebas Automatizadas Implementadas y Aprobadas (100% PASS)
1. `npm run typecheck`: **0 errores** en TypeScript (Expo SDK 54).
2. `dotnet build backend/RutaVentas.Api --no-restore`: **0 errores, 0 advertencias** (.NET 9).
3. `scripts/verify_incidents.cjs`: Suite integral de regresión aprobada (moneda, GPS, colonias, cuenta, CSV, recibos, fondo inicial, identidad comercial).
4. `scripts/test_location_ts.ts`: 10 casos de prueba de direcciones, colonias mexicanas y coordenadas.
5. `scripts/test_receipts_identity.ts`: Verificación de identidad oficial Don Miguel y generadores térmicos 58/80 mm.
6. `scripts/test_inventory_segmentation.cjs`: Prueba en vivo contra SQL Server verificando existencias segmentadas (Bodega 826 pzas vs Camioneta 1 919 pzas).
7. `scripts/test_reportes_live.cjs`: Prueba en vivo de conciliación financiera (Día, Semana y Mes).
8. `scripts/test_scale_decimal_sale.cjs`: Venta real en báscula de 0.450 kg de Queso Castel en SQL Server con descuento exacto de stock (139.000 a 138.550).
9. `scripts/test_sobregiro_live.cjs`: Ciclo completo e2e en vivo de bloqueo 422 por sobregiro -> solicitud chofer -> autorización remota Don Miguel -> venta aprobada 201 y saldo asentado.
10. `scripts/test_bluetooth_escpos.ts`: Verificación de bytes binarios ESC/POS (`ESC @`, CP850 `ESC t 2`, acentos en español, corte `GS V` y chunks BLE).

### 6.2. En qué nos quedamos en la implementación de pruebas (Roadmap / Siguiente paso)
1. **Pruebas de Campo con Hardware Físico:**
   - Emparejamiento Web Bluetooth en celular físico (Android / iOS) con una impresora térmica portátil de cinturón (Goojprt PT-210 o MPT-II) para certificar la alimentación mecánica y corte de papel sin latencia.
   - Conexión física con báscula electrónica para transmisión serial/bluetooth de tara y peso automático al selector de cantidad.
2. **Pruebas de Estrés en Modo Offline Extremo:**
   - Simular una jornada completa de 15 ventas y cobranzas en zona sin cobertura (encoladas en `offlineSyncQueueService.ts`), incluyendo ventas fraccionarias y ventas a crédito, con posterior reconexión para certificar sincronización masiva idempotente.
3. **Runner Unificado de Pruebas (CI/CD):**
   - Agrupar todos los scripts de prueba en un comando `npm test` con harness Jest / Vitest y mocks de EF Core para pruebas unitarias sin depender de la IP remota de SQL Server.
4. **Optimización Dinámica de Ruta (Fase 4 - Ítem 4):**
   - Algoritmo de reordenamiento inteligente de las paradas según geolocalización en tiempo real y ventanas de atención de las cremerías.
