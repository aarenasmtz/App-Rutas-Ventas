# Ruta Ventas

Sistema de reparto y preventa para vendedores de productos perecederos (jamón, salchicha, chorizo, quesos, carnes frías) y abarrotes que operan desde una camioneta recorriendo rutas de tiendas y cremerías.

## Versión actual: DEMO UX/UI

Esta primera versión es una demo funcional de experiencia de usuario e interfaz visual para presentación al cliente. No incluye backend ni base de datos real. Toda la información se muestra con datos mock locales realistas.

## Características principales

- **Login profesional** con estado de conexión
- **Dashboard operativo** con ventas, cobranza, crédito y caja del día
- **Gestión de ruta** con clientes del día, estados de visita y mapa demo
- **Ficha de cliente** con resumen, pedido sugerido, historial y estado de cuenta
- **Venta rápida** con buscador, categorías, productos por peso/pieza, carrito y precios editables
- **Pago mixto** (efectivo + transferencia + crédito) con validación
- **Créditos y cobranza** con cartera de clientes y registro de abonos
- **Devoluciones** con motivos y destinos (inventario, merma, cambio)
- **Inventario de camioneta** con semáforo de stock
- **Carga del día**, gastos, caja y corte diario con diferencia
- **Reportes administrativos** con filtros y exportación
- **Empleados**, bitácora de actividad y errores técnicos
- **Modo offline simulado** con banner y pantalla de sincronización

## Tecnologías

- React Native + TypeScript
- Expo (SDK 54)
- Expo Router (navegación por tabs)
- Lucide Icons
- Expo Google Fonts (Inter)

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm run dev
```

## Compilar versión web

```bash
npm run build:web
```

## Estructura del proyecto

```
app/                    # Pantallas (Expo Router)
  (tabs)/               # Navegación inferior
    index.tsx           # Dashboard / Inicio
    ruta/               # Ruta del día + cliente + mapa
    venta/              # Venta, carrito, pago, confirmación
    clientes.tsx        # Listado de clientes
    mas/                # 13 pantallas administrativas
components/             # Componentes reutilizables
constants/             # Tema, colores y datos mock
context/               # Estado global de la app
types/                 # Definiciones de TypeScript
utils/                 # Funciones utilitarias
```

## Preparado para API futura

La arquitectura visual y los tipos de datos están diseñados para conectarse posteriormente a una API ASP.NET Core. Los datos mock en `constants/mockData.ts` pueden reemplazarse por llamadas a servicios reales sin cambiar la interfaz.
