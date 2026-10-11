-- ============================================================
-- RESPALDO COMPLETO DE DATOS PREVIO A REINICIO OPERATIVO
-- Servidor: 179.236.248.165,1433
-- Base de Datos: RutaVentasDb
-- Fecha y Hora: 2026-10-11 15:50:11
-- ============================================================

USE [RutaVentasDb];
GO

-- ------------------------------------------------------------
-- TABLA: [__EFMigrationsHistory]
-- ------------------------------------------------------------
-- Total de filas: 1
INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20261001003601_InitialCreate', N'9.0.2');
GO

-- ------------------------------------------------------------
-- TABLA: [Usuarios]
-- ------------------------------------------------------------
-- Total de filas: 3
SET IDENTITY_INSERT [Usuarios] ON;
GO
INSERT INTO [Usuarios] ([Id], [Nombre], [Usuario], [PasswordHash], [Rol], [RutaAsignada], [Activo], [FechaCreacion]) VALUES (1, N'Miguel', N'miguel', N'demo1234', N'Administrador', N'Ruta Centro', NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Usuarios] ([Id], [Nombre], [Usuario], [PasswordHash], [Rol], [RutaAsignada], [Activo], [FechaCreacion]) VALUES (2, N'Juan Pérez', N'juan', N'demo1234', N'Vendedor', N'Ruta Norte', NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Usuarios] ([Id], [Nombre], [Usuario], [PasswordHash], [Rol], [RutaAsignada], [Activo], [FechaCreacion]) VALUES (3, N'Pedro Ramírez', N'pedro', N'demo1234', N'Vendedor', N'Ruta Sur', NULL, '2026-09-15 08:00:00.000');
SET IDENTITY_INSERT [Usuarios] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Rutas]
-- ------------------------------------------------------------
-- Total de filas: 3
SET IDENTITY_INSERT [Rutas] ON;
GO
INSERT INTO [Rutas] ([Id], [Nombre], [Descripcion], [Activa]) VALUES (1, N'Ruta Centro', N'Zona comercial centro y abarroteras principales', NULL);
INSERT INTO [Rutas] ([Id], [Nombre], [Descripcion], [Activa]) VALUES (2, N'Ruta Norte', N'Zona norte, cremerÃ­as y minimarkets', NULL);
INSERT INTO [Rutas] ([Id], [Nombre], [Descripcion], [Activa]) VALUES (3, N'Ruta Sur', N'Zona sur periférica y tiendas de abarrotes', NULL);
SET IDENTITY_INSERT [Rutas] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Categorias]
-- ------------------------------------------------------------
-- Total de filas: 12
SET IDENTITY_INSERT [Categorias] ON;
GO
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (1, N'jamon', N'Jamón', N'🥓', N'Jamones y embutidos de pierna y pavo', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (2, N'salchicha', N'Salchicha', N'🌭', N'Salchichas de pavo y viena', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (3, N'chorizo', N'Chorizo', N'🥩', N'Chorizo y longaniza', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (4, N'quesos', N'Quesos', N'🧀', N'Quesos frescos, adobera, gouda, panela', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (5, N'carnes-frias', N'Carnes frías', N'🍗', N'Tocino, chuleta, jamón serrano', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (6, N'abarrotes', N'Abarrotes', N'🥫', N'Abarrotes en general', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (7, N'enlatados', N'Enlatados', N'🥫', N'Enlatados y conservas', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (8, N'lacteos', N'Lácteos', N'🥛', N'Leche, cremas y yogures', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (9, N'bebidas', N'Bebidas', N'🥤', N'Bebidas y jugos', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (10, N'panaderia', N'Panadería', N'🍞', N'Pan y tortillas', NULL, '2026-10-11 20:11:11.550');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (11, N'lacteos-selectos', N'Lácteos Selectos', N'🥛', N'Leches y derivados finos', NULL, '2026-10-11 14:20:05.156');
INSERT INTO [Categorias] ([Id], [Codigo], [Nombre], [Icono], [Descripcion], [Activa], [FechaCreacion]) VALUES (12, N'quesos-especiales', N'Quesos Especiales', N'🧀', NULL, NULL, '2026-10-11 14:25:32.559');
SET IDENTITY_INSERT [Categorias] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Productos]
-- ------------------------------------------------------------
-- Total de filas: 11
SET IDENTITY_INSERT [Productos] ON;
GO
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (1, N'p1', N'Queso Castel', N'Castel', N'Quesos', N'paquete', 8.00, 5.50, 217, N'CAS-QP-01', N'7501002345012', 0, NULL, '2026-09-15 08:00:00.000', NULL);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (2, N'p2', N'Chiles Jalapeños La Costeña', N'La Costeña', N'Abarrotes', N'pieza', 24.00, 16.00, 145, N'COS-CHJ-02', N'7501017001018', 0, NULL, '2026-09-15 08:00:00.000', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (3, N'p3', N'Jamón Virginia Pavo Zwan', N'Zwan', N'Jamón', N'kg', 185.00, 135.00, 30, N'ZWA-JVP-03', N'7501025003011', NULL, NULL, '2026-09-15 08:00:00.000', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (4, N'p4', N'Salchicha de Pavo San Rafael', N'San Rafael', N'Salchicha', N'kg', 145.00, 105.00, 60, N'SRA-SPA-04', N'7501032004015', NULL, NULL, '2026-09-15 08:00:00.000', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (5, N'p5', N'Chorizo Rojo Selecto', N'Corona', N'Chorizo', N'kg', 85.00, 58.00, 30, N'COR-CRS-05', N'7501041005019', 0, NULL, '2026-09-15 08:00:00.000', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (6, N'p6', N'Queso Oaxaca Tradicional', N'Los Volcanes', N'Quesos', N'kg', 195.00, 140.00, 27, N'VOL-QOA-06', N'7501056006013', NULL, NULL, '2026-09-15 08:00:00.000', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (7, N'p7', N'Producto Test 123', N'TestMarca', N'Quesos', N'kg', 120.00, 84.00, 10, N'p7', N'750819467054', 0, NULL, '2026-10-11 14:08:01.946', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (8, N'p8', N'Prueba Salchicha Fud', N'Fud', N'Salchicha', N'kg', 85.00, 60.00, 50, N'p8', N'750229757395', 0, NULL, '2026-10-11 14:13:42.975', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (9, N'p9', N'Jamón San Rafael Supremo', N'San Rafael', N'Jamón', N'kg', 210.00, 150.00, 40, N'P9', N'750584566733', 0, NULL, '2026-10-11 14:20:58.456', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (10, N'p10', N'Queso Gouda Holandes', N'Fud', N'Quesos Especiales', N'kg', 190.00, 130.00, 25, N'P10', NULL, 0, NULL, '2026-10-11 14:26:49.647', 0);
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion], [ManejaMultiplesPresentaciones]) VALUES (11, N'p11', N'Queso Panela Artesanal', NULL, N'Quesos', N'pieza', 85.00, 60.00, 20, N'P11', NULL, 0, NULL, '2026-10-11 14:29:28.128', 0);
SET IDENTITY_INSERT [Productos] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [PresentacionesProducto]
-- ------------------------------------------------------------
-- Total de filas: 15
SET IDENTITY_INSERT [PresentacionesProducto] ON;
GO
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (4, 2, N'pieza', N'Pieza (Lata 380g)', 1, 24.00, N'Lata individual', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (5, 2, N'caja', N'Caja x24', 24, 520.00, N'Caja con 24 latas', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (6, 3, N'pieza', N'Pieza (1 kg)', 1, 185.00, N'1 paquete de 1 kg rebanado', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (7, 3, N'paquete', N'Paquete x5', 5, 900.00, N'5 paquetes de 1 kg', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (8, 3, N'caja', N'Caja x12', 12, 2100.00, N'Caja con 12 paquetes', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (9, 4, N'pieza', N'Pieza (Paq 500g)', 1, 145.00, N'Paquete 500g', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (10, 4, N'caja', N'Caja x10', 10, 1400.00, N'Caja con 10 paquetes', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (11, 7, N'pieza', N'Por Kilo / Porción', 1, 120.00, N'Venta por peso ($120/kg)', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (12, 8, N'pieza', N'Por Kilo / Porción', 1, 85.00, N'Venta por peso ($85/kg)', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (13, 9, N'pieza', N'Por Kilo / Porción', 1, 210.00, N'Venta por peso ($210/kg)', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (14, 10, N'pieza', N'Por Kilo / Porción', 1, 190.00, N'Venta por peso ($190/kg)', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (15, 11, N'pieza', N'Pieza Individual', 1, 85.00, N'1 pieza', NULL, NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (31, 1, N'paquete', N'Paquete', 1, 8.00, N'1 paquete = 1 unidad base', N'7501002345012', NULL, 1);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (32, 1, N'exhibidor', N'Exhibidor', 10, 80.00, N'1 exhibidor = 10 paquetes', N'7501002345029', NULL, 2);
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia], [CodigoBarras], [Activa], [Orden]) VALUES (33, 1, N'caja', N'Caja', 60, 480.00, N'1 caja = 6 exhibidores = 60 paquetes', N'7501002345036', NULL, 3);
SET IDENTITY_INSERT [PresentacionesProducto] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Clientes]
-- ------------------------------------------------------------
-- Total de filas: 6
SET IDENTITY_INSERT [Clientes] ON;
GO
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion]) VALUES (1, N'c1', N'ABTS ARENAS', N'Aaron Arenas', N'Av. Hidalgo 234, Centro', N'477-123-4567', N'Ruta Centro', 0.00, 5000.00, N'Visitado', N'120m', N'["Lun", "Mié", "Vie"]', N'{"p1": 175, "p4": 185, "p3": 200}', N'11 oct 2026, 03:33 p. m.', N'11 oct 2026 ($100.00)', NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion]) VALUES (2, N'c2', N'Cremería La Esquina', N'Marcela Vega', N'Calle 5 de Mayo 102, Norte', N'477-987-6543', N'Ruta Centro', 0.00, 4000.00, N'Visitado', N'350m', N'["Mar", "Jue", "Sáb"]', NULL, N'11 oct 2026, 07:00 a. m.', N'2026-09-25 · $800', NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion]) VALUES (3, N'c3', N'Abarrotes El Chuy', N'Jesús Martínez', N'Blvd. López Mateos 45, Oriente', N'477-555-1122', N'Ruta Centro', 2000.00, 4500.00, N'Pendiente', N'800m', N'["Lun", "Mié", "Vie"]', NULL, N'2026-09-20', N'11 oct 2026 ($500.00)', NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion]) VALUES (4, N'c4', N'Abarrotes La Bendición', N'Lucía Méndez', N'Calle Fresno 89, Sur', N'477-444-3322', N'Ruta Sur', 5600.00, 5000.00, N'Pendiente', N'1.2km', N'["Mar", "Jue"]', NULL, N'2026-09-18', NULL, NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion]) VALUES (5, N'c5', N'Abarrotes San Juan', N'Juan Pablo Rivas', N'Calle Zaragoza 12, Centro', N'477-222-8899', N'Ruta Centro', 0.00, 3000.00, N'Pendiente', N'450m', N'["Lun", "Mié", "Vie"]', NULL, N'2026-09-29', NULL, NULL, '2026-09-15 08:00:00.000');
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion]) VALUES (6, N'c6', N'Ferreteria El Tornillo', NULL, N'León, Guanajuato', N'4771234567', N'Ruta Centro', 0.00, 5000.00, N'Pendiente', N'500m', N'["Lun","Mi\u00E9","Vie"]', NULL, NULL, NULL, NULL, '2026-10-11 14:27:38.733');
SET IDENTITY_INSERT [Clientes] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [InventarioMovimientos]
-- ------------------------------------------------------------
-- Total de filas: 21
SET IDENTITY_INSERT [InventarioMovimientos] ON;
GO
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (1, 3, N'Venta', N'Ruta Centro', -3, N'Venta Folio FOL-20261011-001 (3 pieza)', '2026-10-11 07:00:53.066');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (2, 3, N'Venta', N'Ruta Centro', -1, N'Venta Folio FOL-20261011-002 (1 pieza)', '2026-10-11 07:09:14.633');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (3, 2, N'AjusteAuditoria', N'Ruta Centro', -1, N'Ajuste físico autorizado: Faltante en ruta', '2026-10-11 13:49:54.979');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (4, 3, N'AjusteAuditoria', N'Ruta Centro', -6, N'Ajuste físico autorizado: Faltante en ruta', '2026-10-11 13:49:55.050');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (5, 1, N'AjusteAuditoria', N'Ruta Centro', -10, N'Ajuste físico autorizado: Faltante en ruta', '2026-10-11 14:02:54.104');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (6, 1, N'AjusteAuditoria', N'Ruta Centro', -10, N'Ajuste físico autorizado: Faltante en ruta', '2026-10-11 14:09:00.779');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (7, 6, N'AjusteAuditoria', N'Ruta Centro', 1, N'Ajuste físico autorizado: Sobrante en ruta', '2026-10-11 14:24:16.820');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (8, 6, N'AjusteAuditoria', N'Ruta Centro', 1, N'Ajuste físico autorizado: Sobrante en ruta', '2026-10-11 14:24:40.707');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (9, 2, N'AjusteAuditoria', N'Ruta Centro', -4, N'Ajuste físico autorizado: Merma en ruta', '2026-10-11 14:29:57.429');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (10, 1, N'Merma', N'Ruta Centro', 0, N'Devolución DEV-20261011-001 clasificada como merma (Cambio de presentación por el cliente)', '2026-10-11 15:29:26.641');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (11, 1, N'Venta', N'Ruta Centro', -60, N'Venta Folio FOL-20261011-003 (1 Caja = 60 paquete)', '2026-10-11 15:30:40.669');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (12, 1, N'Venta', N'Ruta Centro', -20, N'Venta Folio FOL-20261011-003 (2 Exhibidor = 20 paquete)', '2026-10-11 15:30:40.699');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (13, 1, N'Venta', N'Ruta Centro', -3, N'Venta Folio FOL-20261011-003 (3 Paquete = 3 paquete)', '2026-10-11 15:30:40.699');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (14, 1, N'Merma', N'Ruta Centro', 0, N'Devolución DEV-20261011-002 clasificada como merma (Cambio de presentación por el cliente)', '2026-10-11 15:30:42.069');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (15, 1, N'Venta', N'Ruta Centro', -60, N'Venta Folio FOL-20261011-004 (1 Caja = 60 paquete)', '2026-10-11 15:30:43.601');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (16, 1, N'Venta', N'Ruta Centro', -20, N'Venta Folio FOL-20261011-004 (2 Exhibidor = 20 paquete)', '2026-10-11 15:30:43.602');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (17, 1, N'Venta', N'Ruta Centro', -3, N'Venta Folio FOL-20261011-004 (3 Paquete = 3 paquete)', '2026-10-11 15:30:43.602');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (18, 1, N'Venta', N'Ruta Centro', -60, N'Venta Folio TEST-VENTA-1791754411768 (1 Caja = 60 paquete)', '2026-10-11 15:33:32.643');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (19, 1, N'Venta', N'Ruta Centro', -20, N'Venta Folio TEST-VENTA-1791754411768 (2 Exhibidor = 20 paquete)', '2026-10-11 15:33:32.673');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (20, 1, N'Venta', N'Ruta Centro', -3, N'Venta Folio TEST-VENTA-1791754411768 (3 Paquete = 3 paquete)', '2026-10-11 15:33:32.673');
INSERT INTO [InventarioMovimientos] ([Id], [ProductoId], [TipoMovimiento], [Ubicacion], [Piezas], [Motivo], [FechaHora]) VALUES (21, 1, N'Devolucion', N'Ruta Centro', 10, N'Devolución DEV-20261011-003 reintegrada a stock (1 exhibidor = 10 paquete)', '2026-10-11 15:33:33.571');
SET IDENTITY_INSERT [InventarioMovimientos] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [AuditoriaInventario]
-- ------------------------------------------------------------
-- Total de filas: 6
SET IDENTITY_INSERT [AuditoriaInventario] ON;
GO
INSERT INTO [AuditoriaInventario] ([Id], [UsuarioId], [Ruta], [FechaRevision], [Estado], [Observaciones]) VALUES (1, 1, N'Ruta Centro', '2026-10-11 19:49:54.318', N'Autorizado', N'Autorizado por Miguel el 11/10/2026 01:49 p. m.');
INSERT INTO [AuditoriaInventario] ([Id], [UsuarioId], [Ruta], [FechaRevision], [Estado], [Observaciones]) VALUES (2, 1, N'Ruta Centro', '2026-10-11 20:02:53.300', N'Autorizado', N'Autorizado por Miguel el 11/10/2026 02:02 p. m.');
INSERT INTO [AuditoriaInventario] ([Id], [UsuarioId], [Ruta], [FechaRevision], [Estado], [Observaciones]) VALUES (3, 1, N'Ruta Centro', '2026-10-11 14:09:00.638', N'Autorizado', N'Autorizado por Miguel el 11/10/2026 02:09 p. m.');
INSERT INTO [AuditoriaInventario] ([Id], [UsuarioId], [Ruta], [FechaRevision], [Estado], [Observaciones]) VALUES (4, 1, N'Ruta Centro', '2026-10-11 20:24:15.902', N'Autorizado', N'Autorizado por Miguel el 11/10/2026 02:24 p. m.');
INSERT INTO [AuditoriaInventario] ([Id], [UsuarioId], [Ruta], [FechaRevision], [Estado], [Observaciones]) VALUES (5, 1, N'Ruta Centro', '2026-10-11 20:24:39.986', N'Autorizado', N'Autorizado por Miguel el 11/10/2026 02:24 p. m.');
INSERT INTO [AuditoriaInventario] ([Id], [UsuarioId], [Ruta], [FechaRevision], [Estado], [Observaciones]) VALUES (6, 1, N'Ruta Centro', '2026-10-11 20:29:57.088', N'Autorizado', N'Autorizado por Miguel el 11/10/2026 02:29 p. m.');
SET IDENTITY_INSERT [AuditoriaInventario] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [AuditoriaInventarioDetalles]
-- ------------------------------------------------------------
-- Total de filas: 7
SET IDENTITY_INSERT [AuditoriaInventarioDetalles] ON;
GO
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (1, 1, 2, 150, 149, -1, N'Faltante en ruta', NULL);
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (2, 1, 3, 36, 30, -6, N'Faltante en ruta', NULL);
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (3, 2, 1, 100, 90, -10, N'Faltante en ruta', NULL);
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (4, 3, 1, 100, 90, -10, N'Faltante en ruta', NULL);
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (5, 4, 6, 25, 26, 1, N'Sobrante en ruta', NULL);
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (6, 5, 6, 26, 27, 1, N'Sobrante en ruta', NULL);
INSERT INTO [AuditoriaInventarioDetalles] ([Id], [AuditoriaId], [ProductoId], [CantidadSistema], [CantidadFisica], [Diferencia], [Comentario], [Revisado]) VALUES (7, 6, 2, 149, 145, -4, N'Merma en ruta', NULL);
SET IDENTITY_INSERT [AuditoriaInventarioDetalles] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Ventas]
-- ------------------------------------------------------------
-- Total de filas: 5
SET IDENTITY_INSERT [Ventas] ON;
GO
INSERT INTO [Ventas] ([Id], [Folio], [ClienteId], [UsuarioId], [Total], [Subtotal], [DescuentoTotal], [Estado], [FechaHora]) VALUES (1, N'FOL-20261011-001', 2, 1, 555.00, 555.00, 0.00, N'Completada', '2026-10-11 07:00:52.660');
INSERT INTO [Ventas] ([Id], [Folio], [ClienteId], [UsuarioId], [Total], [Subtotal], [DescuentoTotal], [Estado], [FechaHora]) VALUES (2, N'FOL-20261011-002', 1, 1, 185.00, 185.00, 0.00, N'Completada', '2026-10-11 07:09:14.493');
INSERT INTO [Ventas] ([Id], [Folio], [ClienteId], [UsuarioId], [Total], [Subtotal], [DescuentoTotal], [Estado], [FechaHora]) VALUES (3, N'FOL-20261011-003', 1, 1, 664.00, 664.00, 0.00, N'Completada', '2026-10-11 15:30:40.463');
INSERT INTO [Ventas] ([Id], [Folio], [ClienteId], [UsuarioId], [Total], [Subtotal], [DescuentoTotal], [Estado], [FechaHora]) VALUES (4, N'FOL-20261011-004', 1, 1, 664.00, 664.00, 0.00, N'Completada', '2026-10-11 15:30:43.502');
INSERT INTO [Ventas] ([Id], [Folio], [ClienteId], [UsuarioId], [Total], [Subtotal], [DescuentoTotal], [Estado], [FechaHora]) VALUES (5, N'TEST-VENTA-1791754411768', 1, 1, 664.00, 664.00, 0.00, N'Completada', '2026-10-11 15:33:32.516');
SET IDENTITY_INSERT [Ventas] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [VentaDetalles]
-- ------------------------------------------------------------
-- Total de filas: 11
SET IDENTITY_INSERT [VentaDetalles] ON;
GO
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (1, 1, 3, N'pieza', 3, 3, 185.00, 555.00, 1, NULL);
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (2, 2, 3, N'pieza', 1, 1, 185.00, 185.00, 1, NULL);
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (3, 3, 1, N'caja', 1, 60, 480.00, 480.00, 60, N'Caja');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (4, 3, 1, N'exhibidor', 2, 20, 80.00, 160.00, 10, N'Exhibidor');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (5, 3, 1, N'paquete', 3, 3, 8.00, 24.00, 1, N'Paquete');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (6, 4, 1, N'caja', 1, 60, 480.00, 480.00, 60, N'Caja');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (7, 4, 1, N'exhibidor', 2, 20, 80.00, 160.00, 10, N'Exhibidor');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (8, 4, 1, N'paquete', 3, 3, 8.00, 24.00, 1, N'Paquete');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (9, 5, 1, N'caja', 1, 60, 480.00, 480.00, 60, N'Caja');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (10, 5, 1, N'exhibidor', 2, 20, 80.00, 160.00, 10, N'Exhibidor');
INSERT INTO [VentaDetalles] ([Id], [VentaId], [ProductoId], [PresentacionTipo], [CantidadPresentaciones], [PiezasTotales], [PrecioUnitario], [Subtotal], [FactorConversion], [PresentacionNombre]) VALUES (11, 5, 1, N'paquete', 3, 3, 8.00, 24.00, 1, N'Paquete');
SET IDENTITY_INSERT [VentaDetalles] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Pagos]
-- ------------------------------------------------------------
-- Total de filas: 5
SET IDENTITY_INSERT [Pagos] ON;
GO
INSERT INTO [Pagos] ([Id], [VentaId], [Metodo], [Monto], [FechaHora]) VALUES (1, 1, N'Efectivo', 555.00, '2026-10-11 07:00:53.108');
INSERT INTO [Pagos] ([Id], [VentaId], [Metodo], [Monto], [FechaHora]) VALUES (2, 2, N'Efectivo', 185.00, '2026-10-11 07:09:14.634');
INSERT INTO [Pagos] ([Id], [VentaId], [Metodo], [Monto], [FechaHora]) VALUES (3, 3, N'Efectivo', 664.00, '2026-10-11 15:30:40.700');
INSERT INTO [Pagos] ([Id], [VentaId], [Metodo], [Monto], [FechaHora]) VALUES (4, 4, N'Efectivo', 664.00, '2026-10-11 15:30:43.602');
INSERT INTO [Pagos] ([Id], [VentaId], [Metodo], [Monto], [FechaHora]) VALUES (5, 5, N'Efectivo', 664.00, '2026-10-11 15:33:32.674');
SET IDENTITY_INSERT [Pagos] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [AbonosCobranza]
-- ------------------------------------------------------------
-- Total de filas: 3
SET IDENTITY_INSERT [AbonosCobranza] ON;
GO
INSERT INTO [AbonosCobranza] ([Id], [ClienteId], [UsuarioId], [Monto], [MetodoPago], [Comentario], [FechaHora]) VALUES (1, 1, 1, 100.00, N'Efectivo', N'Test abono', '2026-10-11 14:08:02.705');
INSERT INTO [AbonosCobranza] ([Id], [ClienteId], [UsuarioId], [Monto], [MetodoPago], [Comentario], [FechaHora]) VALUES (2, 3, 1, 100.00, N'Efectivo', N'Prueba abono c3', '2026-10-11 14:09:39.420');
INSERT INTO [AbonosCobranza] ([Id], [ClienteId], [UsuarioId], [Monto], [MetodoPago], [Comentario], [FechaHora]) VALUES (3, 3, 1, 500.00, N'Efectivo', N'Prueba abono en ruta', '2026-10-11 14:29:45.627');
SET IDENTITY_INSERT [AbonosCobranza] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [Devoluciones]
-- ------------------------------------------------------------
-- Total de filas: 3
SET IDENTITY_INSERT [Devoluciones] ON;
GO
INSERT INTO [Devoluciones] ([Id], [Folio], [ClienteId], [UsuarioId], [ProductoId], [Cantidad], [PresentacionTipo], [PrecioUnitario], [Total], [Motivo], [Destino], [MetodoReembolso], [Observaciones], [FechaHora]) VALUES (1, N'DEV-20261011-001', 1, 1, 1, 1, N'exhibidor', 0.00, 0.00, N'Cambio de presentación por el cliente', N'Merma', N'SaldoAFavor', NULL, '2026-10-11 15:29:26.486');
INSERT INTO [Devoluciones] ([Id], [Folio], [ClienteId], [UsuarioId], [ProductoId], [Cantidad], [PresentacionTipo], [PrecioUnitario], [Total], [Motivo], [Destino], [MetodoReembolso], [Observaciones], [FechaHora]) VALUES (2, N'DEV-20261011-002', 1, 1, 1, 1, N'exhibidor', 0.00, 80.00, N'Cambio de presentación por el cliente', N'Camioneta', N'Efectivo', NULL, '2026-10-11 15:30:42.068');
INSERT INTO [Devoluciones] ([Id], [Folio], [ClienteId], [UsuarioId], [ProductoId], [Cantidad], [PresentacionTipo], [PrecioUnitario], [Total], [Motivo], [Destino], [MetodoReembolso], [Observaciones], [FechaHora]) VALUES (3, N'DEV-20261011-003', 1, 1, 1, 1, N'exhibidor', 0.00, 80.00, N'Cambio de presentación por el cliente', N'Camioneta', N'Efectivo', NULL, '2026-10-11 15:33:33.548');
SET IDENTITY_INSERT [Devoluciones] OFF;
GO

-- ------------------------------------------------------------
-- TABLA: [GastosOperativos]
-- ------------------------------------------------------------
-- Total de filas: 0
-- (Sin registros)

-- ------------------------------------------------------------
-- TABLA: [CortesCaja]
-- ------------------------------------------------------------
-- Total de filas: 0
-- (Sin registros)

-- ------------------------------------------------------------
-- TABLA: [BitacoraEventos]
-- ------------------------------------------------------------
-- Total de filas: 3
SET IDENTITY_INSERT [BitacoraEventos] ON;
GO
INSERT INTO [BitacoraEventos] ([Id], [FechaHora], [Tipo], [Modulo], [Accion], [UsuarioNombre], [UsuarioId], [Dispositivo], [Detalle], [Estado]) VALUES (1, '2026-10-11 10:28:33.346', N'Seguridad', N'Auth', N'Base de datos inicializada en MonsterASP.NET', N'Sistema', 1, N'Servidor Cloud', N'{"host": "site95143.siteasp.net"}', N'Exitoso');
INSERT INTO [BitacoraEventos] ([Id], [FechaHora], [Tipo], [Modulo], [Accion], [UsuarioNombre], [UsuarioId], [Dispositivo], [Detalle], [Estado]) VALUES (2, '2026-10-11 10:59:01.416', N'Seguridad', N'Auth', N'Base de datos inicializada en MonsterASP.NET', N'Sistema', 1, N'Servidor Cloud', N'{"host": "site95143.siteasp.net"}', N'Exitoso');
INSERT INTO [BitacoraEventos] ([Id], [FechaHora], [Tipo], [Modulo], [Accion], [UsuarioNombre], [UsuarioId], [Dispositivo], [Detalle], [Estado]) VALUES (3, '2026-10-11 13:50:28.465', N'Seguridad', N'Auth', N'Inicio de sesión exitoso de Miguel (Administrador)', N'Miguel', 1, N'Terminal Móvil', N'{"ruta":"Ruta Centro", "rol":"Administrador"}', N'Exitoso');
SET IDENTITY_INSERT [BitacoraEventos] OFF;
GO

