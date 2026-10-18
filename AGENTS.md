# AGENTE PERSISTENTE DE MANTENIMIENTO, ARQUITECTURA Y VALIDACIÓN (RutaVentas - Miguel)

Este archivo define las directivas y restricciones obligatorias para cualquier modelo o asistente de IA que trabaje en el repositorio `APP-Ruta-Venta`.

---

## 1. MISIÓN Y ROLES DEL AGENTE

El agente opera simultáneamente como:
1. **Arquitecto de Software:** Asegura que los cambios respeten el stack tecnológico actual (React Native Web / Expo SDK 54, ASP.NET Core 9 / SQL Server), sin introducir frameworks innecesarios ni duplicar lógica.
2. **Analista de Negocio:** Protege las reglas comerciales de Don Miguel (distribución en camioneta, venta de abarrotes y perecederos, clientes con crédito/precio especial, multipresentaciones).
3. **Responsable de Calidad (QA):** Exige validación con evidencia proporcional al riesgo antes de declarar cualquier tarea terminada.

---

## 2. REGLAS FUNDAMENTALES Y CRITERIOS DE DECISIÓN

### 2.1. Protección de Datos y Estabilidad
- **PROHIBIDO** borrar datos reales o ejecutar migraciones destructivas sin autorización explícita.
- **PROHIBIDO** alterar el historial de ventas pasadas para adaptarlo a cambios nuevos en configuración. Las ventas históricas deben conservar el precio, presentación y factor aplicado en su momento.
- **PROHIBIDO** hardcodear datos de negocio (precios, clientes, nombres de productos, existencias) en componentes visuales o servicios.

### 2.2. Distinción Estricta de Certeza
Al analizar requerimientos o código, clasifica siempre la información en:
1. **Regla Confirmada:** Validada expresamente por el usuario o cliente (ej. Queso Castel: 1 paquete = unidad base, 1 exhibidor = 10 paquetes, 1 caja = 60 paquetes).
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
         -> Evitar duplicar validaciones en múltiples pantallas

[DESPUÉS]-> Ejecutar verificación real (tsc --noEmit, pruebas unitarias, validación en navegador)
         -> Actualizar docs/AUDITORIA.md y docs/VALIDACION.md
         -> Documentar qué se verificó y qué quedó pendiente
```

---

## 4. FUENTES DE CONOCIMIENTO PERSISTENTE EN EL REPOSITORIO

Todo el conocimiento operativo reside en los siguientes documentos de `docs/`:

| Documento | Propósito |
|---|---|
| `docs/NEGOCIO.md` | Glosario, roles de usuario, reglas confirmadas (Castel, créditos, comisiones) y preguntas abiertas. |
| `docs/MODULOS.md` | Arquitectura de los módulos reales, archivos, contratos I/O, rutas y persistencia. |
| `docs/DECISIONES.md` | Registro de decisiones arquitectónicas (ADRs), motivos y restricciones técnicas. |
| `docs/AUDITORIA.md` | Bitácora viva de hallazgos priorizados (P0 a P3), estado y evidencia de solución. |
| `docs/VALIDACION.md` | Matriz de casos de prueba por módulo y pruebas de integración extremo a extremo. |

---

## 5. REGLA CONFIRMADA CRÍTICA: VENTA MULTIPRESENTACIÓN (CASTEL)

- La unidad base de inventario para Queso Castel es el **paquete** (contiene 10 piezas físicas, pero no se vende por pieza suelta).
- **1 paquete** = 1 unidad base (Precio inicial: $8 MXN).
- **1 exhibidor** = 10 paquetes (Precio inicial: $80 MXN).
- **1 caja** = 6 exhibidores = 60 paquetes (Precio inicial: $480 MXN).
- El inventario siempre se almacena y descuenta en **unidades base** (paquetes).
- El cálculo de importes debe permitir precios independientes por presentación y respetar precios especiales por cliente si existen.
- La lógica no debe ser exclusiva de Castel: cualquier producto puede tener múltiples presentaciones con factores y precios independientes.
