# REGISTRO DE DECISIONES DE ARQUITECTURA Y NEGOCIO (ADR)

---

## ADR-001: Arquitectura Offline-First con Fachada Unificada (`DataService`)
- **Estado:** Aprobado y en vigor.
- **Contexto:** Las camionetas de reparto recorren colonias periféricas, carreteras o locales comerciales donde la señal de datos móviles (4G/5G) es intermitente o nula.
- **Decisión:** Toda la aplicación interactúa exclusivamente a través de la fachada `DataService`. Esta intenta comunicarse con el backend en la nube (.NET 9 ASP.NET Core); si no hay conectividad o el servidor no responde, opera fluidamente contra `localStorage` y encola las transacciones en `offlineSyncQueueService`.
- **Restricción:** Ninguna pantalla debe invocar `fetch` o `axios` directamente ni asumir conectividad permanente.

---

## ADR-002: Inventario Unificado por Unidad Base con Conversión Dinámica
- **Estado:** Aprobado y en vigor.
- **Contexto:** Vender el mismo producto en distintas presentaciones (Caja, Exhibidor, Paquete) provocaba intentos de crear productos separados en el catálogo (ej. "Castel Caja", "Castel Paquete"), lo que duplicaba el catálogo y desincronizaba el stock real de la camioneta.
- **Decisión:** Cada producto tiene un único registro en catálogo con su `existencia` expresada estrictamente en su **unidad base** (ej. `paquete` para Queso Castel). Las presentaciones se definen en una tabla/lista secundaria con su factor multiplicador (`piezasEquivalentes`).
- **Restricción:** El inventario se descuenta siempre multiplicando la cantidad vendida por el factor de la presentación seleccionada:
  $$\text{Unidades Base a Descontar} = \text{Cantidad} \times \text{Factor de Conversión}$$

---

## ADR-003: Inmutabilidad de Notas de Venta Históricas
- **Estado:** Aprobado y en vigor.
- **Contexto:** Si el día de mañana se ajusta el precio de una caja de Castel de $480 a $500, o cambia el empaque de un proveedor, las ventas realizadas el mes pasado no deben recalcularse ni alterar los cortes de caja pasados.
- **Decisión:** La entidad `VentaDetalle` almacena una fotografía congelada de la venta:
  - `PresentacionTipo` y `PresentacionNombre`
  - `FactorConversion` aplicado en ese instante
  - `CantidadPresentaciones`
  - `PiezasTotales` descontadas
  - `PrecioUnitario` congelado
  - `Subtotal`
- **Restricción:** Queda estrictamente prohibido recalcular ventas pasadas con base en las tablas maestras de productos o presentaciones vigentes.

---

## ADR-004: Precios Independientes por Presentación y Precios Especiales por Cliente
- **Estado:** Aprobado y en vigor.
- **Contexto:** En el comercio de mayoreo y medio mayoreo, el precio de una caja no siempre es exactamente $60 \times \text{precio paquete}$. Además, clientes preferenciales reciben precios especiales por presentación.
- **Decisión:** Cada presentación define su propio precio comercial. Al cotizar un producto para un cliente, el orden de resolución es:
  1. Precio especial pactado para esa presentación específica (`productoId:presentacionTipo`).
  2. Si no maneja presentaciones, precio especial general del cliente (`productoId`).
  3. Precio de la presentación configurado en catálogo.
  4. Precio base del producto.
- **Restricción:** No aplicar descuentos o conversiones de precio asumidas sin configuración explícita.

---

## ADR-005: Eliminación Total de Semillas Mock Hardcodeadas
- **Estado:** Aprobado y en vigor.
- **Contexto:** La aplicación contenía datos de prueba (gastos de gasolina falsos, clientes de fantasía, ventas simuladas) incrustados en archivos como `constants/mockData.ts`, lo que interfería con la operación real de Miguel.
- **Decisión:** Todos los catálogos arrancan con arreglos vacíos `[]`. Se implementó una purga automática en arranque para eliminar residuos de llaves antiguas (`miguel_mock_clientes`, `miguel_mock_productos`, etc.) que contengan IDs obsoletos (`p1..p18`, `c1..c10`).
- **Restricción:** Ningún cambio futuro debe volver a inyectar registros mock estáticos en la ejecución operativa.

---

## ADR-006: Compatibilidad Móvil iPhone y PWA
- **Estado:** Aprobado y en vigor.
- **Contexto:** Miguel utiliza un iPhone para la operación en campo.
- **Decisión:** Las pantallas deben incorporar márgenes seguros inferiores (`paddingBottom` / `SafeAreaView`) para que los botones de cobro y navegación no colisionen con la barra de gestos de inicio de iOS (Home Indicator).
- **Restricción:** Toda barra flotante o pie de página fijo debe reservar al menos 24px de resguardo inferior en dispositivos móviles.

---

## ADR-007: Importación Transaccional de Catálogo CSV e Idempotencia
- **Estado:** Aprobado y en vigor.
- **Contexto:** La carga del catálogo oficial de Miguel (`ProductosMiguel.csv`, 456 filas) requería evitar duplicación de productos, proteger las existencias en camioneta y no destruir las configuraciones de multipresentación existentes.
- **Decisión:**
  - Endpoint de previsualización (`/api/v1/productos/importaciones/preview`): No escribe en base de datos. Detecta ambigüedades dentro del archivo y busca candidatos por coincidencia normalizada en base de datos.
  - Endpoint de confirmación (`/api/v1/productos/importaciones/confirmar`): Ejecuta bajo transacción SQL (`IDbContextTransaction`) con autorización estricta de Administrador.
  - Idempotencia: Se computa el hash SHA-256 del contenido (`FileHash`) y se registra en `ImportacionesCatalogo`. Si se intenta confirmar exactamente el mismo archivo, el servidor responde `409 Conflict`.
  - Asignación de Códigos: Generación concurrente y segura de códigos de catálogo `p{nextNum}` (máximo 20 caracteres), preservando el código original en `CodigoOrigen`.
  - Protección de Stock y Presentaciones: Para productos existentes, la actualización se limita exclusivamente a `PrecioCompra` y `PrecioBase`. El inventario (`Existencia`), las presentaciones (`ProductoPresentacion`) y precios especiales de clientes permanecen inalterados.
  - Existencias Cero: Los productos nuevos se crean con `Existencia = 0`, categoría `"Sin categoría"` y estado `EstadoConfiguracion = "Pendiente"`.

---

## ADR-008: Separación entre Auditoría Matutina de Camioneta y Entrada de Mercancía
- **Estado:** Aprobado y en vigor.
- **Contexto:** `app/(tabs)/mas/carga.tsx` cargaba la existencia actual y el backend en `InventarioController.ConfirmarCargaInicial` sumaba de nuevo esa cantidad a `prod.Existencia`, provocando la duplicación progresiva del inventario en cada verificación matutina.
- **Decisión:** Se incorporó el parámetro `EsEntradaMercancia` en `ConfirmarCargaInicialRequestDto`.
  - Cuando `EsEntradaMercancia == false` (valor por omisión en la revisión matutina de carga): se genera el movimiento de auditoría tipo `"CargaMatutinaVerificada"` sin incrementar las existencias de los productos.
  - Solo cuando `EsEntradaMercancia == true` (recepción de compras de almacén o surtido formal con nota): se incrementa físicamente `prod.Existencia`.
- **Restricción:** Ninguna pantalla de checklist diario debe sumar stock como si fuera una compra.
