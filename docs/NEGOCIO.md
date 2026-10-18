# DOCUMENTO DE NEGOCIO — SISTEMA DE RUTAS Y VENTAS (MIGUEL)

---

## 1. PROPÓSITO DEL NEGOCIO

El negocio consiste en la distribución y preventa/venta a bordo de productos perecederos (quesos, jamones, salchichas, chorizos, carnes frías) y abarrotes operado desde camionetas de reparto.

Don Miguel y sus choferes/vendedores recorren rutas predefinidas visitando tiendas de abarrotes, cremerías y misceláneas, realizando:
- Venta y entrega inmediata de mercancía en camioneta.
- Cobranza de créditos anteriores (abonos a cuenta).
- Devoluciones por merma, caducidad o cambio físico.
- Registro de gastos operativos de la ruta (combustible, alimentos, casetas).
- Arqueo diario de caja (corte diario de efectivo y comprobantes).

---

## 2. ACTORES Y ROLES

| Rol | Usuario Típico | Responsabilidades y Alcances |
|---|---|---|
| **Administrador** | Miguel | Acceso total: alta y edición de clientes, productos, asignación de rutas, ajuste de inventario, revisión de notas PDF, autorización de crédito y cierre de cortes globales. |
| **Vendedor / Chofer** | Juan, Pedro | Operación de ruta asignada: registrar visitas, emitir notas de venta, registrar cobros/abonos, registrar gastos y realizar su preconteo de efectivo al final de la jornada. |

---

## 3. GLOSARIO DE TÉRMINOS DEL NEGOCIO

- **Unidad Base:** La mínima unidad indivisible en la que se gestiona el inventario de un producto en el sistema (ej. `paquete` para Queso Castel, `kg` para Jamón a granel, `pieza` para abarrotes enlatados).
- **Presentación:** Formato comercial en el que se ofrece el producto al cliente (ej. Paquete, Exhibidor, Caja).
- **Factor de Conversión:** Cantidad de unidades base contenidas en una presentación (ej. 1 Caja = 60 Paquetes; 1 Exhibidor = 10 Paquetes).
- **Ruta:** Conjunto ordenado de clientes agrupados geográficamente o por día de visita (ej. Ruta Lunes / Ruta Centro).
- **Surtido de Camioneta:** Proceso matutino mediante el cual la camioneta carga mercancía desde la bodega central, documentado habitualmente con una nota PDF de almacén.
- **Venta Mixta de Pagos:** Liquidación de una misma nota combinando Efectivo, Transferencia electrónica, Tarjeta bancaria y Crédito fiado.
- **Corte de Caja / Arqueo:** Conciliación diaria entre el dinero físico entregado por el chofer y el efectivo esperado por el sistema.

---

## 4. REGLAS DE NEGOCIO CONFIRMADAS

### 4.1. Regla Oficial Queso Castel (Multipresentación)
*Confirmada por el cliente:*
- El Queso Castel se comercializa en 3 presentaciones:
  1. **Paquete:** 1 paquete = unidad base de inventario (contiene 10 piezas físicas). No se vende por pieza suelta. Precio inicial: **$8.00 MXN**.
  2. **Exhibidor:** Contiene 10 paquetes. Precio inicial: **$80.00 MXN**.
  3. **Caja:** Contiene 6 exhibidores = 60 paquetes. Precio inicial: **$480.00 MXN**.
- **Descuento de Inventario:**
  - Vender 1 caja descuenta **60 paquetes**.
  - Vender 1 exhibidor descuenta **10 paquetes**.
  - Vender 1 paquete descuenta **1 paquete**.
- **Precios Independientes:** El precio de cada presentación es configurable en catálogo y no necesariamente proporcional.
- **Precios Especiales por Cliente:** Si un cliente tiene pactado un precio especial para una presentación (ej. Caja a $460), este prevalece sobre el precio de lista.
- **Inmutabilidad Histórica:** Las ventas registradas en el pasado deben conservar la presentación, factor y precio con el que se vendieron, sin verse afectadas por cambios futuros en el catálogo.

### 4.2. Regla de Inventario Único y Disponible
- Todo producto maneja un inventario unificado expresado en su unidad base.
- No se permite confirmar ventas que sobrepasen las existencias disponibles en camioneta.
- Si una devolución se marca con destino **Inventario**, la mercancía se reincorpora al stock en camioneta sumando las unidades base equivalentes. Si es **Merma**, no reingresa a stock vendible.

### 4.3. Regla de Crédito y Cobranza
- Cada cliente cuenta con un saldo deudor acumulado y un límite de crédito autorizado.
- Si una venta a crédito hace que el saldo resultante exceda el límite del cliente, el sistema bloquea o exige confirmación/autorización antes de cerrar la nota.
- Todo abono a crédito reduce de inmediato el saldo deudor del cliente y se registra en la bitácora de cobranza del día.

### 4.4. Regla del Corte Diario de Efectivo
Fórmula obligatoria del Efectivo Esperado en mano del vendedor:
$$\text{Efectivo Esperado} = \text{Ventas Cobradas en Efectivo} + \text{Cobranza de Abonos en Efectivo} - \text{Gastos Pagados en Efectivo}$$

---

## 5. PREGUNTAS ABIERTAS Y DECISIONES PENDIENTES DEL NEGOCIO

1. **Venta con Stock Insuficiente:** Si un cliente solicita más mercancía de la que figura en el sistema (por desfase de captura), ¿debe permitirse venta en negativo con advertencia o bloqueo total estricto?
2. **Autorización de Sobregiro de Crédito:** Cuando un cliente excede su límite de crédito, ¿el vendedor puede solicitar autorización remota o requiere PIN del Administrador en pantalla?
3. **Manejo de Devolución por Cambio:** Cuando una devolución se marca como destino "Cambio", ¿se exige seleccionar el producto entregado en sustitución en la misma pantalla o se procesa como dos movimientos independientes (devolución + nueva venta)?
4. **Comisiones de Vendedores:** ¿Los vendedores perciben comisión por volumen vendido o por cobranza recuperada?
