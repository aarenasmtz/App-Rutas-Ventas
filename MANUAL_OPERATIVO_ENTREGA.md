# MANUAL OPERATIVO Y GUÍA DE ENTREGA FINAL
## Sistema de Ventas en Ruta de Miguel
### Versión 1.0.0 — Producción y Puesta en Marcha

---

## 1. Arquitectura General del Sistema

El sistema fue diseñado con enfoque **Mobile-First** para soportar el trabajo rudo y continuo en camionetas de reparto con o sin conexión a internet:

```
┌─────────────────────────────────────────────────────────────┐
│                 DISPOSITIVOS EN RUTA                        │
│  (Teléfonos Android / Tablets Samsung / Navegador Web PWA) │
│                                                             │
│   • Interfaz Táctil Mobile-First (Expo / React Native)      │
│   • Motor Offline con Cola Persistente (LocalStorage)       │
│   • Generador de Tickets Térmicos (58mm y 80mm Bluetooth)   │
│   • Mapa de Paradas con Navegación GPS                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                HTTP / HTTPS con Tokens JWT
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    SERVIDOR CENTRAL                         │
│                                                             │
│   • Backend API REST (.NET 9 ASP.NET Core)                  │
│   • 13 Controladores REST (Ventas, Sync, Cortes, etc.)      │
│   • Garantía de Idempotencia contra folios duplicados       │
│   • Autenticación Criptográfica HMAC-SHA256                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                        Entity Framework
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             BASE DE DATOS RELACIONAL (SQL Server)           │
│                    `RutaVentasDb`                           │
│   15 Tablas: Productos, Presentaciones, Clientes, Ventas,    │
│   Pagos, Abonos, Gastos, Devoluciones, Cortes, Bitácora     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Manual para el Administrador (Miguel)

### A. Acceso y Cambio de Perfil
1. Inicia sesión con el usuario `miguel` y contraseña `demo1234`.
2. Como Administrador, tendrás acceso al menú completo **Más** en la barra inferior, incluyendo **Cortes de Caja**, **Revisión de Inventario**, **Catálogo de Productos**, **Bitácora de Auditoría** y **Equipo de Trabajo**.
3. En la cabecera superior derecha puedes utilizar el selector rápido de rol para simular la vista que ve cada uno de tus choferes.

### B. Gestión de Catálogo y Presentaciones
- **Ruta:** Menú `Más` → `Catálogo de Productos`.
- **Equivalencias de Piezas**: Cada producto cuenta con factores de conversión automáticos:
  - *Pieza*: Unidad base para descuento en almacén.
  - *Paquete*: Agrupación estándar (ej. paquete de 5 o 10 piezas) con precio preferencial.
  - *Caja*: Empaque mayorista (ej. caja de 12 u 80 piezas) con cálculo en tiempo real.
- El sistema descuenta siempre **piezas físicas reales**, evitando discrepancias en el inventario.

### C. Supervisión de Cortes de Caja y Arqueo Diario
- **Ruta:** Menú `Más` → `Corte y Arqueo de Caja`.
- **Selector de Chofer**: Selecciona a **Juan Pérez (Ruta Norte)**, **Pedro Ramírez (Ruta Sur)** o **Miguel (Ruta Centro)**.
- **Cuadre Financiero**: El sistema calcula de forma estricta:
  $$\text{Efectivo Esperado} = \text{Ventas Efectivo} + \text{Abonos Cobranza} - \text{Gastos en Efectivo}$$
- Al momento en que el chofer entrega el dinero físico, se captura el **Efectivo Contado**. Si coincide con el esperado, la diferencia de caja marcará `$0.00` con estatus **Cerrado**.
- Oprime **"Imprimir Ticket de Corte"** para emitir el acta física con firmas de chofer y auditor.

### D. Conciliación y Ajuste de Inventario Físico
- **Ruta:** Menú `Más` → `Revisión de Inventario`.
- Realiza el conteo físico en la camioneta contra el inventario teórico del sistema.
- El sistema calcula diferencias (*Faltante* o *Sobrante*). Como Administrador, puedes oprimir **"Autorizar Ajuste"** para sincronizar las existencias reales en SQL Server.

### E. Tablero de Analítica y Exportación a Microsoft Excel
- **Ruta:** Menú `Más` → `Reportes y KPIs`.
- Filtra por **Hoy**, **Esta semana** o **Este mes** para visualizar:
  - Ventas totales facturadas y cobranza recuperada.
  - Margen de utilidad bruta estimada (35%).
  - Top 5 de productos estrella por volumen e importe acumulado.
  - Desglose porcentual por método de pago (Efectivo, SPEI, Tarjeta, Crédito).
- Oprime **"Exportar Excel (CSV)"**: Descargará automáticamente un archivo estructurado con delimitador punto y coma (`;`) y codificación **UTF-8 BOM**, garantizando que tildes y caracteres especiales se abran sin corrupción en Microsoft Excel.

### F. Auditoría y Bitácora del Sistema
- **Ruta:** Menú `Más` → `Bitácora de Auditoría`.
- Consulta cronológica de todos los eventos del sistema: inicios de sesión, ventas registradas, sincronizaciones offline y alertas técnicas con detalle de dispositivo y fecha/hora.

---

## 3. Manual para Vendedores en Ruta (Juan, Pedro)

### A. Inicio de Jornada
1. Abre la aplicación en tu celular o tablet e inicia sesión con tu usuario asignado:
   - Juan: `juan` / `demo1234` (Ruta Norte)
   - Pedro: `pedro` / `demo1234` (Ruta Sur)
2. La aplicación te asignará automáticamente tu ruta y descargará los clientes del día.

### B. Carga Matutina de Camioneta
1. Ve a `Más` → `Carga Inicial`.
2. Coteja las piezas físicas cargadas en tu camioneta contra el listado.
3. Oprime **"Confirmar Carga de Camioneta"** para recibir la mercancía bajo tu custodia.

### C. Navegación de Ruta y Selección de Clientes
1. Toca la pestaña **Clientes** o **Ruta** en la barra inferior.
2. Puedes consultar el listado con filtros rápidos (*Hoy*, *Pendientes*, *Con crédito*, *Cercanos*).
3. Entra a `Ver en Mapa`: Podrás ver tus paradas numeradas secuencialmente. Al tocar cualquier cliente, verás su saldo pendiente y el botón **"Navegar con GPS"** que abrirá Google Maps para guiarte en carretera.
4. Toca **"Iniciar Venta"** para atender al cliente seleccionado.

### D. Proceso de Venta Rápida
1. En la pestaña **Vender**, selecciona la categoría o utiliza el buscador universal (nombre, marca o SKU).
2. Toca el producto: Se abrirá el **Selector de Presentaciones**. Elige si vendes por **Pieza**, **Paquete** o **Caja**. La aplicación calculará al instante las piezas totales.
3. Presiona **"Agregar al Carrito"**.
4. Ve al carrito, revisa el pedido y oprime **"Proceder al Cobro"**.
5. **Cobro Combinado**: Puedes registrar el pago exacto:
   - Todo en *Efectivo*.
   - Parte en *Efectivo* y parte a *Crédito*.
   - Por *Transferencia SPEI* o *Tarjeta*.
6. Oprime **"Confirmar y Registrar Venta"**.
7. En la pantalla de confirmación, se desplegará el folio (ej. `FOL-20260930-002`) y el botón **"Imprimir Ticket Térmico"** para entregar el recibo al cliente.

### E. Cobranza de Saldos y Abonos
1. Si un cliente te paga una cuenta pendiente, ve a `Clientes` → toca el botón **[Cobrar]** en su tarjeta.
2. Ingresa el monto abonado (ej. `$600.00`) y el método de pago.
3. El saldo del cliente se reducirá de inmediato y podrás imprimir su **Recibo de Abono**.

### F. Registro de Gastos en Ruta
1. Si compras gasolina, pagas casetas o compras comida con dinero de la venta, ve a `Más` → `Gastos en Ruta`.
2. Captura el concepto, importe y método (Efectivo).
3. Este gasto se descontará automáticamente de tu arqueo al final del día.

### G. Devoluciones de Producto
1. Si una tienda te regresa mercancía dañada o caducada, ve a `Más` → `Devoluciones`.
2. Selecciona el cliente, producto, cantidad, motivo (*Caducado* / *Dañado*) y destino (*Merma* o *Inventario*).
3. Selecciona reembolso como *Saldo a Favor* para reducir automáticamente la deuda del cliente.

### H. Modo Fuera de Cobertura (Offline)
- Si entras a una zona rural sin señal 4G/5G, **no te detengas**.
- Sigue vendiendo y cobrando con normalidad. La app guardará todas las transacciones en la cola segura local de tu dispositivo.
- Al volver a tener señal, la app se conectará automáticamente con el servidor y enviará el lote en segundo plano. Cada venta viaja con una clave única de protección para que nunca se duplique un cobro ni un descuento de inventario.
- Puedes verificar el estado en `Más` → `Sincronización Offline`.

### I. Cierre de Jornada y Arqueo
1. Al regresar al almacén, ve a `Más` → `Corte de Caja`.
2. Cuenta tu dinero en efectivo físico (billetes y monedas).
3. Ingresa la cantidad en el campo **Efectivo Contado en Mano**.
4. Oprime **"Cerrar Corte de Turno"**.
5. Imprime tu ticket térmico de corte, fírmalo y entrégalo junto con el efectivo al administrador.

---

## 4. Guía Técnica de Compilación y Despliegue

### A. Despliegue del Backend .NET 9 en Producción
Los binarios compilados en modo Release están listos en la carpeta:
`backend/RutaVentas.Api/publish/`

- **Ejecución Local / Servidor Windows**:
  ```powershell
  cd d:\APP-Ruta-Venta\backend\RutaVentas.Api\publish
  dotnet RutaVentas.Api.dll --urls "http://0.0.0.0:5000"
  ```
- **Configuración de Base de Datos**:
  El archivo `appsettings.json` contiene la cadena de conexión a SQL Server:
  ```json
  "ConnectionStrings": {
    "RutaVentasDb": "Server=localhost;Database=RutaVentasDb;Integrated Security=SSPI;TrustServerCertificate=True;"
  }
  ```

### B. Generación del APK Android Autónomo
El proyecto cuenta con configuración para **EAS Build** en [`eas.json`](file:///d:/APP-Ruta-Venta/eas.json) y [`app.json`](file:///d:/APP-Ruta-Venta/app.json):

1. Instala la herramienta de compilación de Expo (si no la tienes):
   ```bash
   npm install -g eas-cli
   ```
2. Inicia sesión en tu cuenta gratuita de Expo:
   ```bash
   eas login
   ```
3. Genera el APK instalable directo (sin Play Store):
   ```bash
   npm run build:android
   ```
4. EAS generará el enlace directo para descargar el archivo `.apk` e instalarlo en cualquier celular o tablet Android.

### C. Uso como Aplicación Web Progresiva (PWA / Offline)
El bundle web de producción fue generado con éxito en la carpeta `dist/`.
- Puedes servir la carpeta `dist/` en cualquier servidor web (Nginx, IIS, Firebase Hosting, Vercel o localmente).
- Al abrir la URL en Chrome desde un teléfono Android, aparecerá el aviso:
  **"Agregar Ruta Ventas a la pantalla principal"**.
- Al agregarse, se comportará como una aplicación nativa instalada, con icono, pantalla completa y soporte de almacenamiento offline.

### D. Emparejamiento de Impresoras Térmicas Portátiles
1. Enciende la mini-impresora térmica Bluetooth (modelos compatibles: MTP-II, POS-58, GOOJPRT, Netum, Epson, etc.).
2. En los ajustes de Bluetooth de tu teléfono o tablet, vincula la impresora (código PIN estándar: `0000` o `1234`).
3. En la aplicación, al oprimir **"Imprimir Ticket Térmico"**, selecciona el ancho deseado (**58 mm** para portátiles de cinturón o **80 mm** para terminales de mostrador).
4. El trabajo de impresión se enviará con formato monoespaciado optimizado de rollos continuos sin saltos de página incorrectos.

---

## 5. Tabla de Credenciales Demo

| Usuario | Contraseña | Rol | Ruta Asignada | Alcance Operativo |
| :--- | :--- | :--- | :--- | :--- |
| `miguel` | `demo1234` | **Administrador** | Ruta Centro | Control total, cortes, auditoría, catálogo y reportes |
| `juan` | `demo1234` | **Vendedor** | Ruta Norte | Ventas, cobranza, gastos, devoluciones y arqueo |
| `pedro` | `demo1234` | **Vendedor** | Ruta Sur | Ventas, cobranza, gastos, devoluciones y arqueo |

---

¡El **Sistema de Ventas en Ruta de Miguel** se encuentra 100% probado, compilado y listo para operar en calle!
