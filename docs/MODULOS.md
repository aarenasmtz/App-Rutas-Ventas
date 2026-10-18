# MAPA DE MÓDULOS DEL SISTEMA — RUTAVENTAS

---

## 1. VISIÓN GENERAL DE LA ARQUITECTURA

```
┌────────────────────────────────────────────────────────┐
│     FRONTEND (React Native Web / Expo Router SDK 54)   │
│                                                        │
│  [Tabs] Inicio  |  Ruta  |  Venta  |  Clientes  |  Más  │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
 ┌──────────────────────┐    ┌─────────────────────────┐
 │ DataService (Fachada)│    │ AppContext (Estado App) │
 └───────────┬──────────┘    └─────────────────────────┘
             │
     ┌───────┴───────────────────────┐
     ▼                               ▼
┌────────────────────────┐   ┌───────────────────────────┐
│ Live API (HTTP .NET 9) │   │ LocalStorage + Sync Queue │
│ (Si hay conexión)      │   │ (Modo Camioneta Offline)  │
└────────────────────────┘   └───────────────────────────┘
```

---

## 2. INVENTARIO DE MÓDULOS REALES

### Módulo 1: Venta Rápida y Cobro
- **Archivos:**
  - `app/(tabs)/venta/index.tsx`: Catálogo rápido con chips de presentación y buscador.
  - `app/(tabs)/venta/carrito.tsx`: Resumen de productos, edición de cantidades y subtotales.
  - `app/(tabs)/venta/pago.tsx`: Pantalla de cobro con reparto múltiple (efectivo, transferencia, tarjeta, crédito).
  - `app/(tabs)/venta/confirmacion.tsx`: Resumen de nota cerrada, envío a WhatsApp y ticket.
- **Entradas:** `clienteActivoId`, catálogo con presentaciones, cantidades y desglose de pagos.
- **Salidas:** Registro de venta con folio `FOL-YYYYMMDD-XXX`, descuento de stock en unidades base, ajuste de saldo deudor si hay crédito.

### Módulo 2: Clientes y Cartera de Crédito
- **Archivos:**
  - `app/(tabs)/clientes.tsx`: Listado de clientes, filtros (saldo, días de visita), buscador.
  - `app/(tabs)/mas/nuevo-cliente.tsx`: Formulario de alta con días de visita y límite de crédito.
  - `app/(tabs)/ruta/cliente/[id].tsx`: Ficha integral con historial, saldo y precio especial.
- **Entradas:** Datos fiscales/comerciales del cliente, ubicación GPS, días de atención.
- **Salidas:** Catálogo de clientes, control de saldos y bloqueo por sobregiro de crédito.

### Módulo 3: Inventario y Surtido de Camioneta
- **Archivos:**
  - `app/(tabs)/inventario.tsx`: Visualización de existencias, semáforos de stock y desglose jerárquico.
  - `app/(tabs)/mas/surtido-nota.tsx`: Parser OCR/texto de notas PDF de almacén, vinculación de nombres y carga masiva.
  - `app/(tabs)/mas/carga.tsx`: Carga matutina de camioneta antes de salir a ruta.
  - `utils/multipresentacion.ts`: Algoritmos de conversión y desglose en cajas/exhibidores/paquetes.
- **Entradas:** Notas PDF de compra, ajustes manuales, transferencias bodega-camioneta.
- **Salidas:** Existencias unificadas en unidades base, historial de cargas de surtido.

### Módulo 4: Catálogo de Productos y Multipresentación
- **Archivos:**
  - `app/(tabs)/mas/productos.tsx`: Administración de productos, configuración de presentaciones y factores.
  - `app/(tabs)/mas/categorias.tsx`: Gestión de categorías comerciales con iconos.
- **Entradas:** Nombre, unidad base (`paquete`, `kg`, `pieza`), precio base y lista de presentaciones con factores.
- **Salidas:** Catálogo dinámico consumido por ventas e inventario.

### Módulo 5: Rutas y Visitas en Campo
- **Archivos:**
  - `app/(tabs)/ruta/index.tsx`: Secuencia de paradas del día, estados de visita.
  - `app/(tabs)/ruta/mapa.tsx`: Mapa interactivo con marcadores georreferenciados.
  - `app/(tabs)/mas/rutas.tsx`: Administración de rutas (asignación de chofer y días).
- **Entradas:** Coordenadas GPS del cliente, fecha actual.
- **Salidas:** Estado de visita actualizado (`Pendiente`, `Visitado`, `Venta realizada`, `Sin compra`, `Cerrado`).

### Módulo 6: Cobranza y Abonos
- **Archivos:**
  - `app/(tabs)/mas/cobranza.tsx`: Registro de abonos recibidos en ruta y listado de deudores.
  - `app/(tabs)/mas/creditos.tsx`: Reporte de antigüedad de saldos y créditos otorgados.
- **Entradas:** Monto del abono, método de pago, cliente deudor.
- **Salidas:** Recibo de cobranza, decremento de deuda del cliente, incremento de efectivo en caja.

### Módulo 7: Gastos Operativos de Ruta
- **Archivos:**
  - `app/(tabs)/mas/gastos.tsx`: Registro de egresos en ruta (gasolina, comida, casetas, etc.).
- **Entradas:** Categoría del gasto, monto, método de pago (efectivo de la venta o tarjeta corporativa), observaciones.
- **Salidas:** Deducción automática del efectivo esperado en el corte final del día.

### Módulo 8: Devoluciones
- **Archivos:**
  - `app/(tabs)/mas/devoluciones.tsx`: Registro de producto retornado por el cliente.
- **Entradas:** Producto, cantidad, motivo (Dañado, Caducidad, Cambio), destino (Inventario, Merma, Cambio).
- **Salidas:** Reincorporación al stock disponible en camioneta (si destino es Inventario), nota de crédito o ajuste de saldo.

### Módulo 9: Corte Diario y Arqueo de Caja
- **Archivos:**
  - `app/(tabs)/mas/corte.tsx`: Pantalla de conciliación de efectivo del día.
  - `app/(tabs)/mas/caja.tsx`: Registro de apertura y movimientos directos de efectivo.
  - `app/(tabs)/mas/trabajadores.tsx`: Resumen individual de ventas y cobros por empleado.
- **Entradas:** Conteo físico de dinero en efectivo por el vendedor al terminar la ruta.
- **Salidas:** Cálculo automático de diferencia (Sobrante / Faltante / Cuadrado), cierre de turno.

### Módulo 10: Capa de Datos y Sincronización
- **Archivos:**
  - `services/mockDataService.ts`: Fachada `DataService` con soporte híbrido live/offline.
  - `services/offlineSyncQueueService.ts`: Cola persistente de transacciones con auto-sincronización.
  - `services/httpApiService.ts`: Cliente HTTP para API ASP.NET Core 9.
- **Salidas:** Garantía de operación continua de Miguel sin interrupciones por pérdida de señal celular en ruta.
