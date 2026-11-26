# Ruta Ventas — Sistema Integral de Distribución y Preventa a Bordo

**Continuación local al 2026-11-09:** leer primero [CONTINUIDAD_ANTIGRAVITY.md](docs/CONTINUIDAD_ANTIGRAVITY.md). Resume desarrollo, archivos, pruebas y pendientes. Hay trabajo sin commit y no se ha desplegado esta entrega; las descripciones históricas no acreditan validación integrada.

Sistema full-stack de distribución, preventa y venta a bordo diseñado específicamente para la operativa en camioneta de productos perecederos (carnes frías, quesos, embutidos) y abarrotes de Don Miguel. Diseñado bajo filosofía **Offline-First**, **Mobile-First** (optimizado para iPhone y dispositivos Android) y arquitectura híbrida en la nube y en dispositivo.

---

## 1. Visión y Propósito del Negocio

Don Miguel y sus choferes/vendedores recorren rutas asignadas visitando tiendas de abarrotes, cremerías y misceláneas. El sistema resuelve de punta a punta:
1. **Surtido Matutino y Carga:** Recepción y surtido de camioneta mediante parser inteligente de notas de almacén en PDF o registro manual.
2. **Navegación y Ruta de Clientes:** Secuencia de visitas georreferenciadas con OpenStreetMap / Leaflet, marcadores visuales tipo gota, cálculo de distancias reales y conexión directa con Google Maps.
3. **Venta Rápida Multipresentación:** Mosaico de cuatro columnas y modo Lista sobre el mismo carrito; editor compartido de cantidad/presentación, conversión a unidades base y precios independientes.
4. **Personalización del Vendedor:** Ordenamiento táctil de productos estilo Spotify ("Mi orden") y estrellas de favoritos independientes que no alteran el orden general ni el carrito.
5. **Cobranza y Cartera de Crédito:** Control estricto de límite de crédito, saldos deudores, registro de abonos y ventas con cobro mixto (Efectivo, Tarjeta, Transferencia SPEI, Crédito).
6. **Devoluciones y Gastos en Ruta:** Gestión de mermas vs mercancía apta para reintegro a stock, y registro de egresos operativos (gasolina, casetas, alimentos).
7. **Corte Diario y Arqueo:** Conciliación estricta de efectivo físico considerando fondo de caja inicial, ventas, cobranza y gastos, con emisión de ticket térmico de 58mm y 80mm.
8. **Operación 100% Offline:** Continuidad operativa total sin señal celular con encolamiento persistente en dispositivo y sincronización idempotente automática al recuperar conexión.

---

## 2. Stack Tecnológico

### Frontend (Móvil y PWA)
- **Framework:** Expo SDK 54 / React Native 0.81.4 / React 19.1.0 / React Native Web 0.21.0.
- **Enrutamiento:** Expo Router v6 (Enrutamiento basado en archivos bajo `app/`).
- **Cartografía:** Leaflet 1.9.4 integrado vía iframe responsivo con OpenStreetMap y puente de comunicación bidireccional (`postMessage`).
- **Procesamiento de Documentos:** Pako (Inflate/Deflate zlib) + Parser PDF cliente para extracción estructurada de tablas de surtido de almacén.
- **Persistencia Local:** `LocalStorage` con cola de sincronización transaccional (`offlineSyncQueueService.ts`).
- **Iconos:** Lucide Icons (`lucide-react-native`).

### Backend (API REST en la Nube / Red Local)
- **Framework:** .NET 9 ASP.NET Core Web API.
- **ORM y Base de Datos:** Entity Framework Core 9 con Microsoft SQL Server (`RutaVentasDb`).
- **Seguridad y Criptografía:** Tokens JWT con HMAC-SHA256, contraseñas con hashing BCrypt, códigos PIN de autorización y control de idempotencia SHA-256 para archivos.
- **Exportaciones Contables:** Exportador CSV con codificación UTF-8 BOM y delimitador `;` para apertura nativa e inmediata en Microsoft Excel.

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND EN CAMIONETA                       │
│    (iPhone / Android / PWA Web / Tablet en Vehículo)        │
│                                                             │
│   • UI Mobile-First: Mosaico 3 col, Stepper táctil          │
│   • Mapa Leaflet/OSM (0 scroll inicial, panel modal)        │
│   • Fachada Unificada `DataService`                         │
│   • Motor Offline: `offlineSyncQueueService`                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / HTTPS (REST API)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND API (.NET 9)                        │
│                                                             │
│   • 18 Controladores REST (Ventas, Sync, Cortes, etc.)      │
│   • Importador Transaccional CSV con Idempotencia SHA-256   │
│   • Verificación Matutina vs Entrada Real de Mercancía      │
│   • Conversión Multipresentación Unificada a Unidad Base    │
└──────────────────────────────┬──────────────────────────────┘
                               │ EF Core 9
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             BASE DE DATOS RELACIONAL (SQL Server)           │
│   18 Tablas: Usuarios, Clientes, Productos, Presentaciones, │
│   Ventas, Detalles, Pagos, Abonos, Inventario, Cortes,      │
│   Devoluciones, Gastos, Auditorías, Importaciones, etc.     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura del Repositorio

```
APP-Ruta-Venta/
├── app/                             # Frontend — Expo Router
│   ├── (tabs)/                      # Navegación inferior por pestañas
│   │   ├── index.tsx                # Inicio compacto: 3 KPIs, Vender Hero, selector cliente
│   │   ├── clientes.tsx             # Directorio de clientes con filtros y saldo
│   │   ├── inventario.tsx           # Mi inventario (Vendedor) / Bodega (Admin)
│   │   ├── ruta/                    # Módulo de rutas, paradas y mapa OSM
│   │   │   ├── index.tsx            # Secuencia de paradas del día
│   │   │   ├── mapa.tsx             # Mapa interactivo Leaflet (0 scroll, panel modal)
│   │   │   └── cliente/[id].tsx     # Ficha detallada de cliente y precio especial
│   │   ├── venta/                   # Flujo de venta ágil
│   │   │   ├── index.tsx            # Mosaico 3 col, stepper, favoritos, orden Spotify
│   │   │   ├── carrito.tsx          # Resumen unificado y selección de método de pago
│   │   │   └── confirmacion.tsx     # Folio, comprobante Web Share/WhatsApp, nueva venta
│   │   └── mas/                     # 15 pantallas administrativas y operativas
│   │       ├── productos.tsx        # CRUD de productos e importación CSV transaccional
│   │       ├── surtido-nota.tsx     # Parser PDF de notas de compra y auto-surtido
│   │       ├── carga.tsx            # Auditoría matutina de camioneta
│   │       ├── corte.tsx            # Corte de caja diario con fondo inicial y ticket
│   │       ├── cobranza.tsx         # Registro de abonos a cuentas por cobrar
│   │       ├── devoluciones.tsx     # Reintegro a stock o registro de merma
│   │       ├── gastos.tsx           # Egresos en ruta (gasolina, casetas, alimentos)
│   │       ├── trabajadores.tsx     # Gestión de usuarios, PIN y permisos granulares
│   │       ├── reportes.tsx         # Dashboard financiero y exportación Excel CSV
│   │       ├── revision.tsx         # Auditoría física vs teórica de inventario
│   │       └── sincronizacion.tsx   # Estado de conexión y cola offline
│   ├── login.tsx                    # Acceso con selección de usuario o credenciales
│   └── _layout.tsx                  # Enrutador principal y configuración de temas
├── backend/                         # Backend — .NET 9 ASP.NET Core Web API
│   ├── RutaVentas.Api/
│   │   ├── Controllers/             # 18 Controladores RESTful
│   │   ├── Data/
│   │   │   ├── Entities/            # Modelos del dominio y entidades EF Core
│   │   │   └── RutaVentasDbContext.cs
│   │   ├── DTOs/                    # Contratos de entrada y salida
│   │   ├── Migrations/              # Migraciones de Entity Framework
│   │   └── Program.cs               # Configuración de pipeline, CORS, JWT y DI
│   └── sql/                         # Scripts de creación, esquemas y respaldos SQL
├── components/                      # Componentes reutilizables y Design System
│   ├── DesignSystem.tsx             # AppShell, SearchBar, ProductCard, ClientCard, etc.
│   └── ui.tsx / shared.tsx          # Badges, ConnectivityBanner, Botones táctiles
├── context/                         # Estado global de React
│   └── AppContext.tsx               # AppProvider, carrito, cliente activo, rol dinámico
├── docs/                            # Documentación viva y persistente del sistema
│   ├── NEGOCIO.md                   # Reglas de negocio, glosario, fórmulas y flujos
│   ├── MODULOS.md                   # Mapa exhaustivo de módulos, contratos y pantallas
│   ├── DECISIONES.md                # Registro formal de Decisiones de Arquitectura (ADRs)
│   ├── AUDITORIA.md                 # Bitácora viva de hallazgos técnicos (P0 a P3)
│   └── VALIDACION.md                # Matriz de casos de prueba y evidencia de ejecución
├── services/                        # Capa de datos y comunicaciones
│   ├── mockDataService.ts           # Fachada DataService (híbrido live API / LocalStorage)
│   ├── offlineSyncQueueService.ts   # Cola persistente de transacciones fuera de línea
│   └── httpApiService.ts            # Cliente HTTP Axios con auto-detección y cooldown
├── types/                           # Definiciones de TypeScript
├── utils/                           # Helpers de moneda, multipresentación y parser PDF
├── AGENTS.md                        # Directivas y reglas obligatorias para modelos de IA
├── FRONTEND_API_CONTRACTS.md        # Especificación detallada de DTOs y contratos HTTP
├── FRONTEND_REDESIGN_PLAN.md        # Plan y bitácora de ejecución del rediseño UI/UX
└── MANUAL_OPERATIVO_ENTREGA.md      # Manual de usuario para Don Miguel y vendedores
```

---

## 5. Instrucciones de Instalación y Ejecución

### Requisitos Previos
- **Node.js** v18+ y npm.
- **.NET 9 SDK** (para el backend).
- **SQL Server 2019+** o SQL Server Express / LocalDB.

### Paso 1: Configurar y Levantar el Backend (.NET 9)
```bash
cd backend/RutaVentas.Api

# Restaurar dependencias
dotnet restore

# Actualizar base de datos con migraciones de EF Core
dotnet ef database update

# Compilar y ejecutar la API (por defecto en http://localhost:5000 o https://localhost:7001)
dotnet run
```

### Paso 2: Configurar y Levantar el Frontend (Expo Web)
```bash
# En la raíz del repositorio
npm install

# Iniciar servidor de desarrollo Expo
npm run dev

# O compilar versión web estática optimizada (PWA)
npm run build:web
```

### Paso 3: Verificación de Calidad y Tipos
```bash
# Verificación estricta de TypeScript
npm run typecheck    # (tsc --noEmit)
```

---

## 6. Documentación Fundamental para Agentes y Desarrolladores

Para comprender a fondo la lógica del sistema o colaborar en nuevas características, es obligatorio consultar los documentos en `docs/`:

| Documento | Contenido Principal |
|---|---|
| [`AGENTS.md`](file:///d:/APP-Ruta-Venta/AGENTS.md) | **Directivas para IA:** Reglas obligatorias, protección de datos, certeza de negocio y ciclo de cambio. |
| [`docs/NEGOCIO.md`](file:///d:/APP-Ruta-Venta/docs/NEGOCIO.md) | **Reglas de Negocio:** Regla Castel multipresentación, fórmula de corte con fondo inicial, crédito y flujos completos. |
| [`docs/MODULOS.md`](file:///d:/APP-Ruta-Venta/docs/MODULOS.md) | **Mapa de Módulos:** Detalle de los 13 módulos, pantallas, controladores de backend y contratos. |
| [`docs/DECISIONES.md`](file:///d:/APP-Ruta-Venta/docs/DECISIONES.md) | **ADRs:** Registro de decisiones de arquitectura (ADR-001 a ADR-014). |
| [`docs/AUDITORIA.md`](file:///d:/APP-Ruta-Venta/docs/AUDITORIA.md) | **Auditoría:** Bitácora viva de correcciones de seguridad, rendimiento y UX (AUD-001 a AUD-012). |
| [`docs/VALIDACION.md`](file:///d:/APP-Ruta-Venta/docs/VALIDACION.md) | **Casos de Prueba:** Matriz con casos de prueba ejecutados y aprobados con evidencia. |
| [`FRONTEND_API_CONTRACTS.md`](file:///d:/APP-Ruta-Venta/FRONTEND_API_CONTRACTS.md) | **Contratos API:** DTOs de C# y especificación de endpoints REST. |

## Rediseño local oliva/crema — 2026-11-08

Implementado en optimizacion-interfaz-venta: Inicio, navegación, cuatro columnas móviles, Mosaicos/Lista, preferencias web y adaptación de pantallas internas/mapa. Alcance por pantalla, capturas, pruebas y limitaciones en [REDISENO_OLIVA_2026-11.md](docs/REDISENO_OLIVA_2026-11.md). Las afirmaciones de fases previas son registros históricos y deben contrastarse con esa validación actual.

Para QA visual aislado, en dos terminales: node scripts/preview_redesign_api.cjs y node scripts/preview_redesign.cjs; abrir http://127.0.0.1:8091. El entorno de prueba no se importa en la aplicación ni modifica .env. Pruebas aisladas: node scripts/verify_redesign.cjs. No se hizo push ni despliegue.

## Correcciones de incidencias — 2026-11-09

Implementación, comprobaciones y límites de inventario, GPS, cuenta, comprobantes y reportes: [informe de incidencias](docs/INCIDENCIAS_UI_2026-11-09.md). Incluye evidencia visual y CSV descargado. Impresión física, PDF paginado, GPS en celular y consulta SQL integrada permanecen pendientes.
