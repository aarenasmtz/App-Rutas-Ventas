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
