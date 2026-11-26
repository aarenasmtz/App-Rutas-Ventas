# Reglas de Mantenimiento y Calidad - Antigravity & Codex Agents

---
description: Reglas persistentes de arquitectura, análisis de negocio y control de calidad para RutaVentas (Don Miguel)
alwaysApply: true
---

# Directivas para los Asistentes de IA (Codex & Antigravity)

1. **Consulta Previa Obligatoria:**
   Antes de editar código o proponer soluciones, lee `AGENTS.md`, `docs/NEGOCIO.md`, `docs/MODULOS.md`, `docs/DECISIONES.md` y `FRONTEND_API_CONTRACTS.md`.

2. **No romper flujos existentes:**
   Cualquier refactorización debe preservar los contratos públicos de los servicios (`DataService`, `apiService`, `multipresentacion.ts`, `offlineSyncQueueService.ts`).

3. **Multi-presentación y Regla Castel:**
   - La unidad base es la unidad indivisible configurada en catálogo (en Queso Castel es el **paquete**).
   - 1 exhibidor = 10 paquetes; 1 caja = 60 paquetes.
   - Todo descuento de inventario se hace estrictamente en unidades base: `cantidad * factorConversion`.
   - Precios por presentación son independientes y configurables.

4. **Ergonomía Móvil y UX en Ruta:**
   - Botones y controles táctiles deben tener áreas mínimas de **44×44 px**.
   - Pantallas críticas (Inicio, Mapa) deben mantener **0 scroll vertical inicial** en viewports de 390×844.
   - Respetar el mosaico de CUATRO columnas y Mosaicos/Lista sobre el mismo carrito, por decisión del usuario de noviembre de 2026. Inventario y administración conservan listas legibles; no aplicarles las cuatro columnas.
   - Fondo principal blanco #FFFFFF e identidad oliva. Los mockups no son fuente de datos de negocio.

5. **Validación Obligatoria:**
   - Ejecuta `npx tsc --noEmit` después de cualquier cambio de código en el frontend.
   - Si se modifica el backend, ejecuta `dotnet build` en `backend/RutaVentas.Api`.
   - Registra cualquier hallazgo en `docs/AUDITORIA.md` y la evidencia de validación en `docs/VALIDACION.md`.

6. **Continuidad al 2026-11-09:**
   - Leer `docs/CONTINUIDAD_ANTIGRAVITY.md`, `docs/REDISENO_OLIVA_2026-11.md` y `docs/INCIDENCIAS_UI_2026-11-09.md` antes de continuar los cambios locales.
   - Conservar cambios sin commit y archivos no rastreados. No usar reset/clean para preparar la continuación.
   - Diferenciar comprobación con fixtures de lectura, integración con SQL, prueba física y despliegue. Ninguna sustituye a las demás.
