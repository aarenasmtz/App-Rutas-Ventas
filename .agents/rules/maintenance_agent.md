# Reglas de Mantenimiento y Calidad - Antigravity Agent

---
description: Reglas persistentes de arquitectura, análisis de negocio y control de calidad para RutaVentas (Miguel)
alwaysApply: true
---

# Directivas para el Asistente

1. **Consulta Previa:**
   Antes de editar código o proponer soluciones, lee `docs/NEGOCIO.md`, `docs/DECISIONES.md` y `docs/MODULOS.md`.

2. **No romper flujos existentes:**
   Cualquier refactorización debe preservar los contratos públicos de los servicios (`DataService`, `apiService`, `multipresentacion`).

3. **Multi-presentación y Regla Castel:**
   - La unidad base es la unidad indivisible configurada en catálogo.
   - En Queso Castel, la unidad base es el **paquete**.
   - 1 exhibidor = 10 paquetes; 1 caja = 60 paquetes.
   - Todo descuento de inventario se hace en unidades base: `cantidad * factorConversion`.
   - Precios por presentación son configurables, no obligatoriamente proporcionales.

4. **Validación Obligatoria:**
   - Ejecuta `npx tsc --noEmit` después de cualquier cambio de código en el frontend.
   - Registra cualquier hallazgo en `docs/AUDITORIA.md` con su prioridad (P0 a P3).
   - Documenta la evidencia de validación en `docs/VALIDACION.md`.
