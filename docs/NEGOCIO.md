# DOCUMENTO DE NEGOCIO Y PROCESOS OPERATIVOS — SISTEMA DE RUTAS Y VENTAS (DON MIGUEL)

---

## 1. PROPÓSITO DEL NEGOCIO Y MODELO OPERATIVO

El negocio consiste en la distribución, preventa y venta a bordo de productos perecederos (quesos, jamones, salchichas, chorizos, carnes frías) y abarrotes operado diariamente desde camionetas de reparto.

Don Miguel y su equipo de choferes/vendedores recorren rutas asignadas en colonias y municipios, visitando tiendas de abarrotes, cremerías y misceláneas, realizando en cada parada:
- Venta y entrega inmediata de mercancía en camioneta.
- Cobranza de créditos pendientes otorgados en visitas anteriores (abonos a cuenta).
- Devoluciones por merma, caducidad o cambio físico.
- Registro de gastos operativos de la ruta (combustible, alimentos, casetas).
- Arqueo y corte diario de caja (conciliación entre dinero físico y el efectivo esperado por el sistema).

El entorno de trabajo es demandante: **la conectividad a internet (4G/5G) es intermitente o inexistente en muchas colonias y tramos carreteros**, por lo que el sistema debe garantizar operación 100% fluida fuera de línea sin interrumpir la labor comercial ni duplicar cobros.

---

## 2. ACTORES, ROLES Y PERMISOS GRANULARES

| Rol | Usuario Típico | Responsabilidades y Alcances |
|---|---|---|
| **Administrador** | Miguel | **Acceso Total:** Alta y edición de catálogo de productos, importación masiva CSV, configuración de presentaciones y factores, surtido de camionetas por PDF, alta y asignación de clientes a rutas, autorización de aumentos de límite de crédito, autorización de ajustes de inventario físico, supervisión de cortes multi-chofer, exportación contable a Excel y gestión de usuarios/permisos. |
| **Vendedor / Chofer** | Juan, Pedro | **Operación en Ruta:** Consulta de clientes del día, navegación en mapa, atención y registro de ventas (mosaico 3 col, stepper), cobro directo o mixto, registro de abonos de cobranza, captura de gastos en ruta, registro de devoluciones, auditoría matutina de carga y preconteo físico de efectivo al cierre de la jornada. Protegido mediante PIN o contraseña. |

### Matriz de Permisos Granulares (JSON configurable por usuario)
Cada trabajador cuenta con un campo `PermisosJson` en base de datos que habilita o restringe acciones específicas:
- `puedeModificarPrecios`: Permite o bloquea la alteración del precio unitario al momento de vender.
- `puedeAutorizarCredito`: Permite cerrar ventas a crédito cuando el cliente excede su límite de saldo.
- `puedeAjustarInventario`: Permite confirmar diferencias físicas vs sistema en revisiones de carga.
- `puedeVerReportesGlobales`: Restringe la analítica general exclusivamente a sus propias ventas.

---

## 3. GLOSARIO DE TÉRMINOS DEL NEGOCIO

- **Unidad Base:** La mínima unidad indivisible en la que se gestiona el inventario de un producto en el sistema (ej. `paquete` para Queso Castel, `kg` para Jamón a granel, `pieza` para latas o empaques cerrados).
- **Presentación:** Formato comercial en el que se ofrece el producto al cliente (ej. Paquete, Exhibidor, Caja).
- **Factor de Conversión:** Cantidad de unidades base contenidas en una presentación (ej. 1 Caja = 60 Paquetes; 1 Exhibidor = 10 Paquetes).
- **Ruta:** Conjunto ordenado de clientes agrupados geográficamente o por día de visita (ej. Ruta Lunes / Ruta Centro / Ruta Norte).
- **Surtido de Camioneta:** Proceso matutino mediante el cual la camioneta carga mercancía desde la bodega central, documentado habitualmente con una nota PDF de almacén.
- **Doble Nombre (Nombre App vs Nombre Almacén):** Mapeo entre la descripción técnica que imprime la nota del proveedor/bodega (ej. `"QUESO CASTEL PZ"`) y el nombre comercial legible en la app para Don Miguel (ej. `"Queso Castel Original"`).
- **Venta Mixta de Pagos:** Liquidación de una misma nota combinando Efectivo, Transferencia electrónica (SPEI), Tarjeta bancaria y Crédito fiado.
- **Fondo Inicial de Caja:** Monto en efectivo entregado al chofer al inicio de la jornada para dar cambio a los clientes.
- **Corte de Caja / Arqueo:** Conciliación diaria entre el dinero físico entregado por el chofer y el efectivo esperado por el sistema.
- **Venta de Mostrador / General:** Venta rápida efectuada a un comprador eventual o transeúnte que no requiere registro de crédito ni historial de cliente.
- **Orden Personalizado ("Mi orden" estilo Spotify):** Capacidad del vendedor de ordenar libremente los productos en el mosaico visual para tener sus artículos de mayor venta al alcance inmediato.

---

## 4. FLUJOS OPERATIVOS COMPLETOS DE PUNTA A PUNTA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JORNADA COMPLETA DE RUTA                              │
│                                                                             │
│  [MAÑANA]        [EN RUTA]                           [TARDE / REGRESO]     │
│  1. Surtido PDF  3. Navegación en Mapa Leaflet       6. Gastos Operativos   │
│  2. Checklist    4. Venta Mosaico 3 col + Cobro      7. Devoluciones        │
│     de Carga     5. Cobranza de Abonos a Crédito     8. Corte y Arqueo      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flujo 1: Surtido Matutino por Nota PDF de Almacén
1. **Origen:** El almacén central emite una nota de compra o remisión en PDF con los productos y bultos cargados a la camioneta.
2. **Carga en App:** En `Más > Surtido con Nota PDF`, el Administrador o chofer sube el PDF o procesa el archivo.
3. **Extracción y Descompresión:** El parser del cliente descomprime los flujos zlib (usando Pako) y extrae texto posicional estructurado por columnas (Código, Descripción, Cantidad, Unidad, Precio).
4. **Vinculación con Catálogo (Doble Nombre):** El sistema busca coincidencias por `NombreAlmacen`, `Codigo` o coincidencia normalizada de texto.
5. **Auto-creación de Faltantes:** Si un producto de la nota no existe en catálogo, el sistema lo crea automáticamente en estado `Pendiente` para no bloquear el surtido.
6. **Aumento de Inventario:** Al presionar **"Aumentar Inventario"**, las cantidades de la nota se convierten a unidades base y se suman directamente a la existencia en camioneta, guardando un registro en el historial de surtidos.

### Flujo 2: Verificación de Carga Matutina (Auditoría sin Duplicidad)
1. **Propósito:** El chofer inspecciona físicamente la camioneta antes de arrancar la ruta y coteja contra el inventario del sistema.
2. **Acceso:** Menú `Más > Carga Inicial de Camioneta`.
3. **Criterio Transaccional:** Se envía `esEntradaMercancia = false`. Esto genera una bitácora de auditoría matutina que avala que el chofer recibió la mercancía conforme, **sin incrementar las existencias**. Únicamente si se marcan entradas físicas adicionales con `esEntradaMercancia = true` se sumará al inventario.

### Flujo 3: Ruteo y Navegación Georreferenciada
1. **Inicio de Ruta:** El chofer ingresa a la pestaña `Ruta` o `Mapa de Ruta`.
2. **Visualización Adaptable:** El mapa OpenStreetMap / Leaflet se despliega ocupando el espacio vertical exacto del celular (0 scroll inicial).
3. **Paradas Numeradas:** Cada cliente asignado al día aparece como un marcador tipo gota con su número de parada correlativo.
4. **Interacción sin Globos:** Al pulsar un pin, no se abre ningún globo invasivo; el pin se resalta con un anillo dorado de alto contraste y la **Ficha Compacta Inferior** se actualiza de inmediato con:
   - Número de parada y Nombre del cliente.
   - Saldo deudor actual (si tiene crédito pendiente).
   - Distancia real calculada por GPS del dispositivo (sin valores inventados).
   - Botón primario hero **VENDER** (abre el catálogo con este cliente activo).
   - Botones secundarios: **Cómo llegar** (lanza Google Maps hacia las coordenadas exactas) y botón de llamada telefónica directa.
5. **Panel Modal de Paradas:** El botón "Ver paradas (N)" abre un panel deslizable inferior (`maxHeight: 62%`) que permite al chofer saltar a cualquier parada de la lista.

### Flujo 4: Proceso de Venta Rápida en Ruta
1. **Selección de Cliente:**
   - Desde el Inicio mediante el buscador rápido (insensible a tildes/mayúsculas).
   - Desde la ficha del Mapa al presionar **VENDER**.
   - O pulsando **"Venta de Mostrador / General"** (en 1 toque para ventas al paso).
2. **Mosaico Táctil de CUATRO Columnas:**
   - Por decisión vigente del usuario: cuatro columnas y selector Mosaicos/Lista, conservando cliente, filtros, cantidades y total. No aplicar la cuadrícula de venta a inventario.
   - Cada tarjeta muestra: Unidad (arriba a la izquierda), Estrella de favorito (arriba a la derecha), Nombre legible (hasta 3 líneas) y Precio unitario en tipografía grande.
3. **Edición compartida de cantidad y presentación:**
   - `SaleProductEditor` abre un panel para cantidad y presentación con áreas táctiles ≥ 44×44 px; reutiliza precios y conversión de `multipresentacion.ts`. La composición reemplaza el stepper dentro del mosaico anterior.
4. **Orden Personalizado ("Mi orden" estilo Spotify):**
   - El vendedor puede alternar entre las pestañas "Todos", "⭐ Favoritos" o "Frecuentes".
   - Al pulsar "Ordenar", se despliega la lista con asas de arrastre y botones rápidos ("🔝 Al inicio", "⬆️ Subir", "⬇️ Bajar") para posicionar sus productos más vendidos al inicio del mosaico.
5. **Revisión y Cobro Unificado:**
   - El pie del pedido ocupa una fila del layout encima de las pestañas; muestra cantidades por presentación/peso y total sin cubrir productos.
   - Al tocar "Revisar", se despliega en una sola pantalla el resumen del pedido y la selección del método de pago:
     - **Efectivo** (predeterminado).
     - **Transferencia SPEI** (con captura de referencia opcional).
     - **Tarjeta Bancaria**.
     - **Crédito** (valida saldo actual + monto de venta vs límite de crédito autorizado).
     - **Pago Mixto / Combinado** (ej. $200 en efectivo + $400 a crédito).
6. **Confirmación y Comprobante:**
   - Botón **Confirmar venta** protegido contra doble clic y spinners visuales.
   - Se genera el folio único consecutivo (ej. `FOL-20261018-003`).
   - Se descuenta el inventario de la camioneta en **unidades base**.
   - Pantalla de confirmación con acción hero **Compartir comprobante** (Web Share API para WhatsApp directo o descarga de ticket digital) y acción secundaria **Nueva venta** para regresar inmediatamente al flujo.

### Flujo 5: Cobranza y Abonos de Cartera en Ruta
1. **Identificación de Deudores:** El vendedor visualiza en la pestaña `Clientes` o en `Más > Cobranza` los clientes con saldo pendiente ordenados por antigüedad o monto.
2. **Registro de Abono:** Toca **[Cobrar]** en la tarjeta del cliente e ingresa el importe abonado y método de pago (Efectivo, SPEI).
3. **Impacto:** El saldo deudor del cliente disminuye en tiempo real. Si el cobro fue en Efectivo, se suma al **Efectivo Esperado** del arqueo diario del chofer.

### Flujo 6: Devoluciones de Mercancía
1. **Acceso:** Menú `Más > Devoluciones`.
2. **Captura:** Selección del cliente, producto retornado, cantidad y presentación.
3. **Motivo:** Caducado, Dañado por transporte, o Cambio físico.
4. **Destino Físico de la Mercancía:**
   - **Inventario:** El producto se encuentra en perfecto estado; las unidades base se reincorporan de inmediato al stock disponible de la camioneta.
   - **Merma:** El producto está caducado o roto; no reingresa a inventario vendible y se registra para baja contable.
5. **Método de Reembolso:** Saldo a favor (disminuye la deuda del cliente), Devolución en Efectivo (descuenta del efectivo de caja del chofer) o Cambio Físico 1 a 1.

### Flujo 7: Gastos Operativos de la Camioneta
1. **Acceso:** Menú `Más > Gastos en Ruta`.
2. **Captura:** Selección de categoría (Gasolina / Diesel, Casetas de peaje, Alimentos del chofer, Reparación menor / Talachas) e importe.
3. **Forma de Pago:** Si se paga con el efectivo recaudado de las ventas del día, el importe se deduce automáticamente del arqueo de caja final.

### Flujo 8: Corte Diario, Arqueo de Caja y Cierre de Turno
1. **Acceso:** Menú `Más > Corte y Arqueo de Caja`.
2. **Cálculo del Sistema:** El sistema determina el **Efectivo Esperado en Mano del Chofer** aplicando la fórmula oficial:
   $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} + \text{Abonos Cobranza} - \text{Gastos Efectivo} - \text{Devoluciones en Efectivo}$$
3. **Conteo Físico:** El chofer cuenta los billetes y monedas que tiene en mano y captura el monto en **Efectivo Contado**.
4. **Conciliación de Diferencias:**
   $$\text{Diferencia} = \text{Efectivo Contado} - \text{Efectivo Esperado}$$
   - Si $\text{Diferencia} = 0$: Estado **Cuadrado** (Verde).
   - Si $\text{Diferencia} > 0$: Estado **Sobrante** (Azul).
   - Si $\text{Diferencia} < 0$: Estado **Faltante** (Rojo, a liquidar por el chofer).
5. **Emisión de Ticket:** Se emite el ticket de corte térmico (58mm/80mm) con el desglose de ventas, cobranza, gastos, saldo de crédito colocado y firmas de entrega/recepción.

### Flujo 9: Revisión Periódica de Inventario Físico (Auditoría)
1. **Acceso:** Menú `Más > Revisión de Inventario`.
2. **Conteo en Camioneta:** El Administrador coteja producto por producto la cantidad física real contra el inventario teórico registrado en sistema.
3. **Diferencias:** El sistema marca automáticamente faltantes y sobrantes.
4. **Autorización:** Como Administrador, oprime **"Autorizar Ajuste"** para sincronizar la base de datos con el conteo físico, dejando asentado el movimiento en la bitácora de auditoría.

### Flujo 10: Importación Masiva de Catálogo (CSV Oficial de Don Miguel)
1. **Acceso:** Menú `Más > Catálogo de Productos > Importar Catálogo CSV`.
2. **Previsualización Segura:** El archivo `ProductosMiguel.csv` (456 registros) se envía a `/api/v1/productos/importaciones/preview`.
   - Se interpreta el formato numérico contable español con punto de miles y coma decimal (`241.088,06` → `$241,088.06`; `1.350` → `$1,350.00`).
   - Se detectan productos homónimos (27 grupos de nombres duplicados con códigos origen diferentes).
3. **Resolución y Confirmación Transaccional:** El Administrador revisa la clasificación (Nuevos, Existentes, Ambiguos). Al confirmar:
   - Se genera el hash SHA-256 del archivo (`FileHash`) para garantizar **idempotencia total** (rechazo de doble confirmación con `409 Conflict`).
   - Para productos existentes, se actualizan costos y precios respetando intactas sus existencias actuales, sus presentaciones y sus precios especiales por cliente.
   - Para productos nuevos, se crean con stock `0`, categoría `"Sin categoría"` y estado `EstadoConfiguracion = "Pendiente"`.
   - Los productos en estado `Pendiente` quedan bloqueados para venta en el catálogo hasta que el Administrador confirme sus presentaciones.

---

## 5. REGLAS DE NEGOCIO CONFIRMADAS

### 5.1. Regla Oficial Queso Castel (Multipresentación)
*Regla confirmada por Don Miguel:*
- El Queso Castel se comercializa en 3 presentaciones comerciales:
  1. **Paquete:** Unidad base de inventario (contiene 10 piezas físicas, pero el paquete es indivisible comercialmente). Precio de lista inicial: **$8.00 MXN**.
  2. **Exhibidor:** Contiene 10 paquetes. Precio de lista inicial: **$80.00 MXN**.
  3. **Caja:** Contiene 6 exhibidores = 60 paquetes. Precio de lista inicial: **$480.00 MXN**.
- **Descuento de Existencias:**
  - Vender 1 caja descuenta estrictamente **60 paquetes**.
  - Vender 1 exhibidor descuenta estrictamente **10 paquetes**.
  - Vender 1 paquete descuenta estrictamente **1 paquete**.
- **Precios Independientes y No Proporcionales:** Cada presentación define su precio en catálogo de forma independiente.
- **Precios Especiales por Cliente y Presentación:** Si un cliente preferencial tiene pactado un precio especial para una presentación (ej. Caja de Castel a $460.00 en Cremería El Coecillo), este precio tiene máxima prioridad.
- **Inmutabilidad Histórica:** Las ventas registradas en el pasado guardan una fotografía inmutable (`PresentacionTipo`, `FactorConversion`, `CantidadPresentaciones`, `PrecioUnitario`). Modificaciones futuras al catálogo de productos no alteran las ventas ni los cortes pasados.

### 5.2. Regla de Inventario Disponible y Bloqueo de Sobreventa
- Todo producto mantiene un inventario unificado expresado en su unidad base.
- El sistema **bloquea la adición al carrito o el cobro** si las unidades solicitadas superan la existencia física disponible en camioneta.

### 5.3. Regla de Límite de Crédito y Cobranza
- Cada cliente tiene configurado un `Saldo` deudor y un `LimiteCredito`.
- Una venta a crédito que cause que $\text{Saldo} + \text{Monto Crédito} > \text{LimiteCredito}$ requiere autorización especial o bloqueo según permisos del vendedor.
- Todo abono recibido reduce inmediatamente la deuda del cliente y queda registrado en la bitácora de cobranza.

### 5.4. Regla de Arranque Limpio (Zero-State)
- Los catálogos de clientes y productos deben arrancar limpios (`0 clientes`, `0 productos`) hasta que el usuario los registre o importe.
- Queda estrictamente prohibido reintroducir datos de prueba hardcodeados (gastos falsos de gasolina, clientes ficticios `c1..c10`, productos ficticios `p1..p18`).

### 5.5. Regla de Favoritos y Orden Personalizado (Estilo Spotify)
- Marcar la estrella de favoritos es una acción desacoplada que no altera el orden general del catálogo ni modifica el carrito.
- El orden personalizado se almacena por usuario en `localStorage` web (`miguel_orden_${userId}`). Favoritos y orden son independientes; marcar una estrella no mueve productos. No se certifica persistencia nativa ni sincronización entre dispositivos.

---

## 6. CASOS DE NEGOCIO Y ESCENARIOS DE BORDE (EDGE CASES)

| Escenario | Comportamiento Esperado del Sistema |
|---|---|
| **Venta sin señal de internet** | La nota se procesa en memoria local, se descuenta el stock de inmediato, se genera el ticket/comprobante y la transacción se guarda en `offlineSyncQueueService`. Al reconectar, se sincroniza en segundo plano sin intervención del chofer. |
| **Cliente solicita más mercancía que la existente** | La aplicación muestra alerta preventiva indicando existencia disponible vs solicitada y restringe la adición al stock disponible. |
| **Cliente de mostrador al paso** | Se selecciona "Venta de Mostrador / General" en 1 toque. No exige teléfono, dirección ni línea de crédito; solo admite pagos de contado (Efectivo, Tarjeta, SPEI). |
| **Producto nuevo importado por CSV** | Ingresa con existencia 0 y `EstadoConfiguracion = "Pendiente"`. La app impide venderlo en el catálogo y muestra alerta hasta que el Administrador defina si es pieza, paquete o kilo. |
| **Reintento de subida del mismo CSV de catálogo** | El sistema calcula el hash SHA-256 (`FileHash`). Si ya fue importado, el backend responde `409 Conflict` evitando duplicación o alteración de precios. |
| **Devolución de mercancía dañada (Caducada)** | Se registra con destino `Merma`. La deuda del cliente se reduce (saldo a favor), pero el stock de la camioneta **no aumenta**. |
| **Devolución de mercancía en buen estado (Cambio)** | Se registra con destino `Inventario`. Las unidades base se reincorporan inmediatamente a las existencias vendibles de la camioneta. |
| **Chofer entrega menos efectivo del esperado** | La pantalla de corte marca `Diferencia < 0` en rojo indicando Faltante. Se permite cerrar el corte asentando el faltante en el ticket para su cobro en nómina o liquidación posterior. |

---

## 7. REGLAS CONFIRMADAS DE LA FASE 4 Y ESTADO DE MEJORAS (2026-11-25)

1. **Venta Fraccionaria en Báscula (Kilogramos Decimales `decimal(18,3)`):**
   - **Regla Confirmada:** Los productos pesables (quesos a granel, jamones, salchichas, cremería) se venden en fracciones de kilogramo pesadas en báscula electrónica (ej. 0.450 kg, 1.275 kg).
   - **Comportamiento Implementado:** Tanto en base de datos (`DECIMAL(18,3)` en `Productos.Existencia`, `VentaDetalles.CantidadPresentaciones`, `VentaDetalles.PiezasTotales`) como en backend .NET 9 y frontend, las existencias y subtotales se calculan y descuentan con exactitud decimal perfecta.

2. **Autorización Remota Push de Sobregiro de Crédito:**
   - **Regla Confirmada:** Ningún chofer puede cerrar una venta a crédito si el monto excede el límite del cliente, a menos que cuente con autorización explícita de Don Miguel.
   - **Comportamiento Implementado:** La venta se bloquea con HTTP 422 (`requiereAutorizacion: true`). El chofer emite solicitud con motivo; Don Miguel visualiza la alerta en tiempo real en la pantalla de Créditos (`creditos.tsx`) y autoriza generando un token único (`AUTH-XXXXXX`). El chofer reintenta adjuntando el token y la venta se aprueba con HTTP 201 Created.

3. **Impresión Térmica Bluetooth Nativa (ESC/POS 58 mm / 80 mm):**
   - **Regla Confirmada:** Choferes en camioneta imprimen tickets en impresoras térmicas de cinturón con cero clics adicionales ni ventanas de diálogo del sistema operativo (`window.print()`).
   - **Comportamiento Implementado:** Driver `bluetoothPrinterService.ts` genera comandos ESC/POS binarios (`ESC @`, CP850 `ESC t 2`, comando de corte `GS V`) enviados por Web Bluetooth en paquetes controlados BLE de 64 bytes.

4. **Arqueo Cuadrado con Fondo Inicial Oficial:**
   - **Regla Confirmada:** El efectivo esperado debe incluir invariablemente el fondo entregado al inicio del día:
     $$\text{Efectivo Esperado} = \text{Fondo Inicial} + \text{Ventas Efectivo} + \text{Cobranza} - \text{Gastos}$$
   - **Comportamiento Implementado:** La columna `FondoInicial` en la tabla `Cortes` y en `CortesController.cs` concilia el saldo y se imprime en el ticket térmico continuo sin truncado a 297 mm.

5. **Identidad Comercial Don Miguel:**
   - **Regla Confirmada:** Todo comprobante debe llevar los datos comerciales y fiscales oficiales: "DISTRIBUIDORA DON MIGUEL", RFC: "MIGD750412AB1", Tel: "477-123-4567", León, Guanajuato.

---

## 8. EN QUÉ NOS QUEDAMOS EN LA IMPLEMENTACIÓN DE PRUEBAS

1. **Pruebas de Campo con Hardware Físico:**
   - Emparejamiento Bluetooth en calle con impresora física Goojprt/Zebra y báscula comercial Torrey/Rhino en celular Android e iPhone.
2. **Pruebas de Red y Sincronización Extrema:**
   - Registro de 15 transacciones continuas en modo avión/sin datos en `offlineSyncQueueService.ts` con verificación de reenvío atómico sin colisiones en SQL Server.
3. **Runner Automatizado (CI/CD):**
   - Unificación de suites de prueba (`npm test`) para validación rápida en un solo comando sin dependencia estricta de la IP de base de datos.
4. **Optimización Dinámica de Rutas:**
   - Algoritmo de ruteo dinámico por distancia y horario de atención de los clientes.

## Aclaraciones para continuidad — 2026-11-25

La interfaz actual y el backend .NET 9 han completado y certificado en pruebas automatizadas en vivo contra SQL Server el pesaje decimal, sobregiro con autorización remota, corte con fondo inicial, segmentación por camioneta y driver ESC/POS. Para el detalle de archivos modificados y comandos de prueba, consultar [CONTINUIDAD_ANTIGRAVITY.md](CONTINUIDAD_ANTIGRAVITY.md).
