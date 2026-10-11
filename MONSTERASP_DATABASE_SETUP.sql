IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [Clientes] (
    [Id] int NOT NULL IDENTITY,
    [Codigo] nvarchar(20) NOT NULL,
    [Nombre] nvarchar(150) NOT NULL,
    [Propietario] nvarchar(100) NOT NULL,
    [Direccion] nvarchar(250) NOT NULL,
    [Telefono] nvarchar(30) NULL,
    [Ruta] nvarchar(50) NOT NULL,
    [Saldo] decimal(18,2) NOT NULL,
    [LimiteCredito] decimal(18,2) NOT NULL,
    [EstadoVisita] nvarchar(30) NOT NULL,
    [DistanciaMock] nvarchar(50) NULL,
    [DiasVisitaJson] nvarchar(max) NOT NULL,
    [PreciosEspecialesJson] nvarchar(max) NULL,
    [UltimaCompra] nvarchar(100) NULL,
    [UltimoPago] nvarchar(100) NULL,
    [Activo] bit NOT NULL,
    [FechaCreacion] datetime2 NOT NULL,
    CONSTRAINT [PK_Clientes] PRIMARY KEY ([Id])
);

CREATE TABLE [Productos] (
    [Id] int NOT NULL IDENTITY,
    [Codigo] nvarchar(20) NOT NULL,
    [Nombre] nvarchar(150) NOT NULL,
    [Marca] nvarchar(100) NULL,
    [Categoria] nvarchar(50) NOT NULL,
    [Unidad] nvarchar(20) NOT NULL,
    [PrecioBase] decimal(18,2) NOT NULL,
    [PrecioCompra] decimal(18,2) NOT NULL,
    [Existencia] int NOT NULL,
    [Sku] nvarchar(50) NULL,
    [CodigoBarras] nvarchar(50) NULL,
    [Favorito] bit NOT NULL,
    [Activo] bit NOT NULL,
    [FechaCreacion] datetime2 NOT NULL,
    CONSTRAINT [PK_Productos] PRIMARY KEY ([Id])
);

CREATE TABLE [Rutas] (
    [Id] int NOT NULL IDENTITY,
    [Nombre] nvarchar(50) NOT NULL,
    [Descripcion] nvarchar(200) NULL,
    [Activa] bit NOT NULL,
    CONSTRAINT [PK_Rutas] PRIMARY KEY ([Id])
);

CREATE TABLE [Usuarios] (
    [Id] int NOT NULL IDENTITY,
    [Nombre] nvarchar(100) NOT NULL,
    [Usuario] nvarchar(50) NOT NULL,
    [PasswordHash] nvarchar(255) NOT NULL,
    [Rol] nvarchar(30) NOT NULL,
    [RutaAsignada] nvarchar(50) NULL,
    [Activo] bit NOT NULL,
    [FechaCreacion] datetime2 NOT NULL,
    CONSTRAINT [PK_Usuarios] PRIMARY KEY ([Id])
);

CREATE TABLE [InventarioMovimientos] (
    [Id] int NOT NULL IDENTITY,
    [ProductoId] int NOT NULL,
    [TipoMovimiento] nvarchar(30) NOT NULL,
    [Ubicacion] nvarchar(50) NOT NULL,
    [Piezas] int NOT NULL,
    [Motivo] nvarchar(200) NULL,
    [FechaHora] datetime2 NOT NULL,
    CONSTRAINT [PK_InventarioMovimientos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InventarioMovimientos_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PresentacionesProducto] (
    [Id] int NOT NULL IDENTITY,
    [ProductoId] int NOT NULL,
    [Tipo] nvarchar(30) NOT NULL,
    [Nombre] nvarchar(100) NOT NULL,
    [PiezasEquivalentes] int NOT NULL,
    [Precio] decimal(18,2) NOT NULL,
    [DescripcionEquivalencia] nvarchar(150) NULL,
    CONSTRAINT [PK_PresentacionesProducto] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PresentacionesProducto_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [AbonosCobranza] (
    [Id] int NOT NULL IDENTITY,
    [ClienteId] int NOT NULL,
    [UsuarioId] int NOT NULL,
    [Monto] decimal(18,2) NOT NULL,
    [MetodoPago] nvarchar(30) NOT NULL,
    [Comentario] nvarchar(250) NULL,
    [FechaHora] datetime2 NOT NULL,
    CONSTRAINT [PK_AbonosCobranza] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AbonosCobranza_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AbonosCobranza_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [AuditoriaInventario] (
    [Id] int NOT NULL IDENTITY,
    [UsuarioId] int NOT NULL,
    [Ruta] nvarchar(50) NOT NULL,
    [FechaRevision] datetime2 NOT NULL,
    [Estado] nvarchar(30) NOT NULL,
    [Observaciones] nvarchar(max) NULL,
    CONSTRAINT [PK_AuditoriaInventario] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AuditoriaInventario_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [BitacoraEventos] (
    [Id] int NOT NULL IDENTITY,
    [FechaHora] datetime2 NOT NULL,
    [Tipo] nvarchar(50) NOT NULL,
    [Modulo] nvarchar(50) NOT NULL,
    [Accion] nvarchar(250) NOT NULL,
    [UsuarioNombre] nvarchar(100) NOT NULL,
    [UsuarioId] int NULL,
    [Dispositivo] nvarchar(100) NULL,
    [Detalle] nvarchar(max) NULL,
    [Estado] nvarchar(30) NOT NULL,
    CONSTRAINT [PK_BitacoraEventos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_BitacoraEventos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
);

CREATE TABLE [CortesCaja] (
    [Id] int NOT NULL IDENTITY,
    [UsuarioId] int NOT NULL,
    [FechaJornada] date NOT NULL,
    [Ruta] nvarchar(50) NOT NULL,
    [VentasTotales] decimal(18,2) NOT NULL,
    [Efectivo] decimal(18,2) NOT NULL,
    [Transferencias] decimal(18,2) NOT NULL,
    [Tarjetas] decimal(18,2) NOT NULL,
    [Credito] decimal(18,2) NOT NULL,
    [CobranzaAbonos] decimal(18,2) NOT NULL,
    [Gastos] decimal(18,2) NOT NULL,
    [Devoluciones] decimal(18,2) NOT NULL,
    [EfectivoEsperado] decimal(18,2) NOT NULL,
    [EfectivoContado] decimal(18,2) NOT NULL,
    [DiferenciaCaja] decimal(18,2) NOT NULL,
    [InventarioInicialPiezas] int NOT NULL,
    [InventarioActualPiezas] int NOT NULL,
    [PiezasVendidas] int NOT NULL,
    [Estado] nvarchar(30) NOT NULL,
    CONSTRAINT [PK_CortesCaja] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CortesCaja_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Devoluciones] (
    [Id] int NOT NULL IDENTITY,
    [Folio] nvarchar(50) NOT NULL,
    [ClienteId] int NOT NULL,
    [UsuarioId] int NOT NULL,
    [ProductoId] int NOT NULL,
    [Cantidad] int NOT NULL,
    [PresentacionTipo] nvarchar(30) NOT NULL,
    [PrecioUnitario] decimal(18,2) NOT NULL,
    [Total] decimal(18,2) NOT NULL,
    [Motivo] nvarchar(100) NOT NULL,
    [Destino] nvarchar(50) NOT NULL,
    [MetodoReembolso] nvarchar(50) NOT NULL,
    [Observaciones] nvarchar(250) NULL,
    [FechaHora] datetime2 NOT NULL,
    CONSTRAINT [PK_Devoluciones] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Devoluciones_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Devoluciones_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Devoluciones_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [GastosOperativos] (
    [Id] int NOT NULL IDENTITY,
    [UsuarioId] int NOT NULL,
    [Concepto] nvarchar(50) NOT NULL,
    [Importe] decimal(18,2) NOT NULL,
    [MetodoPago] nvarchar(30) NOT NULL,
    [Observaciones] nvarchar(250) NULL,
    [FechaHora] datetime2 NOT NULL,
    CONSTRAINT [PK_GastosOperativos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_GastosOperativos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Ventas] (
    [Id] int NOT NULL IDENTITY,
    [Folio] nvarchar(50) NOT NULL,
    [ClienteId] int NOT NULL,
    [UsuarioId] int NOT NULL,
    [Total] decimal(18,2) NOT NULL,
    [Subtotal] decimal(18,2) NOT NULL,
    [DescuentoTotal] decimal(18,2) NOT NULL,
    [Estado] nvarchar(30) NOT NULL,
    [FechaHora] datetime2 NOT NULL,
    CONSTRAINT [PK_Ventas] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Ventas_Clientes_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Clientes] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Ventas_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [AuditoriaInventarioDetalles] (
    [Id] int NOT NULL IDENTITY,
    [AuditoriaId] int NOT NULL,
    [ProductoId] int NOT NULL,
    [CantidadSistema] int NOT NULL,
    [CantidadFisica] int NOT NULL,
    [Diferencia] int NOT NULL,
    [Comentario] nvarchar(250) NULL,
    [Revisado] bit NOT NULL,
    CONSTRAINT [PK_AuditoriaInventarioDetalles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AuditoriaInventarioDetalles_AuditoriaInventario_AuditoriaId] FOREIGN KEY ([AuditoriaId]) REFERENCES [AuditoriaInventario] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AuditoriaInventarioDetalles_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Pagos] (
    [Id] int NOT NULL IDENTITY,
    [VentaId] int NOT NULL,
    [Metodo] nvarchar(30) NOT NULL,
    [Monto] decimal(18,2) NOT NULL,
    [FechaHora] datetime2 NOT NULL,
    CONSTRAINT [PK_Pagos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Pagos_Ventas_VentaId] FOREIGN KEY ([VentaId]) REFERENCES [Ventas] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [VentaDetalles] (
    [Id] int NOT NULL IDENTITY,
    [VentaId] int NOT NULL,
    [ProductoId] int NOT NULL,
    [PresentacionTipo] nvarchar(30) NOT NULL,
    [CantidadPresentaciones] int NOT NULL,
    [PiezasTotales] int NOT NULL,
    [PrecioUnitario] decimal(18,2) NOT NULL,
    [Subtotal] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_VentaDetalles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VentaDetalles_Productos_ProductoId] FOREIGN KEY ([ProductoId]) REFERENCES [Productos] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_VentaDetalles_Ventas_VentaId] FOREIGN KEY ([VentaId]) REFERENCES [Ventas] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_AbonosCobranza_ClienteId] ON [AbonosCobranza] ([ClienteId]);

CREATE INDEX [IX_AbonosCobranza_UsuarioId] ON [AbonosCobranza] ([UsuarioId]);

CREATE INDEX [IX_AuditoriaInventario_UsuarioId] ON [AuditoriaInventario] ([UsuarioId]);

CREATE INDEX [IX_AuditoriaInventarioDetalles_AuditoriaId] ON [AuditoriaInventarioDetalles] ([AuditoriaId]);

CREATE INDEX [IX_AuditoriaInventarioDetalles_ProductoId] ON [AuditoriaInventarioDetalles] ([ProductoId]);

CREATE INDEX [IX_BitacoraEventos_UsuarioId] ON [BitacoraEventos] ([UsuarioId]);

CREATE INDEX [IX_CortesCaja_UsuarioId] ON [CortesCaja] ([UsuarioId]);

CREATE INDEX [IX_Devoluciones_ClienteId] ON [Devoluciones] ([ClienteId]);

CREATE INDEX [IX_Devoluciones_ProductoId] ON [Devoluciones] ([ProductoId]);

CREATE INDEX [IX_Devoluciones_UsuarioId] ON [Devoluciones] ([UsuarioId]);

CREATE INDEX [IX_GastosOperativos_UsuarioId] ON [GastosOperativos] ([UsuarioId]);

CREATE INDEX [IX_InventarioMovimientos_ProductoId] ON [InventarioMovimientos] ([ProductoId]);

CREATE INDEX [IX_Pagos_VentaId] ON [Pagos] ([VentaId]);

CREATE INDEX [IX_PresentacionesProducto_ProductoId] ON [PresentacionesProducto] ([ProductoId]);

CREATE INDEX [IX_VentaDetalles_ProductoId] ON [VentaDetalles] ([ProductoId]);

CREATE INDEX [IX_VentaDetalles_VentaId] ON [VentaDetalles] ([VentaId]);

CREATE INDEX [IX_Ventas_ClienteId] ON [Ventas] ([ClienteId]);

CREATE INDEX [IX_Ventas_UsuarioId] ON [Ventas] ([UsuarioId]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261001003601_InitialCreate', N'9.0.2');

COMMIT;
GO


-- =============================================
-- SEED DATA INICIAL PARA MONSTERASP.NET
-- =============================================

SET IDENTITY_INSERT [Usuarios] ON;
INSERT INTO [Usuarios] ([Id], [Activo], [FechaCreacion], [Nombre], [Usuario], [PasswordHash], [Rol], [RutaAsignada])
VALUES 
(1, 1, '2026-09-15 08:00:00.000', N'Miguel', N'miguel', N'demo1234', N'Administrador', N'Ruta Centro'),
(2, 1, '2026-09-15 08:00:00.000', N'Juan Pérez', N'juan', N'demo1234', N'Vendedor', N'Ruta Norte'),
(3, 1, '2026-09-15 08:00:00.000', N'Pedro Ramírez', N'pedro', N'demo1234', N'Vendedor', N'Ruta Sur');
SET IDENTITY_INSERT [Usuarios] OFF;
GO

SET IDENTITY_INSERT [Rutas] ON;
INSERT INTO [Rutas] ([Id], [Nombre], [Descripcion], [Activa])
VALUES 
(1, N'Ruta Centro', N'Zona comercial centro y abarroteras principales', 1),
(2, N'Ruta Norte', N'Zona norte, cremerías y minimarkets', 1),
(3, N'Ruta Sur', N'Zona sur periférica y tiendas de abarrotes', 1);
SET IDENTITY_INSERT [Rutas] OFF;
GO

SET IDENTITY_INSERT [Clientes] ON;
INSERT INTO [Clientes] ([Id], [Codigo], [Nombre], [Propietario], [Direccion], [Telefono], [Ruta], [Saldo], [LimiteCredito], [EstadoVisita], [DistanciaMock], [DiasVisitaJson], [PreciosEspecialesJson], [UltimaCompra], [UltimoPago], [Activo], [FechaCreacion])
VALUES 
(1, N'c1', N'ABTS ARENAS', N'Aaron Arenas', N'Av. Hidalgo 234, Centro', N'477-123-4567', N'Ruta Centro', 0.00, 5000.00, N'Pendiente', N'120m', N'["Lun", "Mié", "Vie"]', N'{"p1": 175, "p4": 185, "p3": 200}', N'2026-09-28', N'2026-09-28 · $500', 1, '2026-09-15 08:00:00.000'),
(2, N'c2', N'Cremería La Esquina', N'Marcela Vega', N'Calle 5 de Mayo 102, Norte', N'477-987-6543', N'Ruta Centro', 0.00, 4000.00, N'Pendiente', N'350m', N'["Mar", "Jue", "Sáb"]', NULL, N'2026-09-25', N'2026-09-25 · $800', 1, '2026-09-15 08:00:00.000'),
(3, N'c3', N'Abarrotes El Chuy', N'Jesús Martínez', N'Blvd. López Mateos 45, Oriente', N'477-555-1122', N'Ruta Centro', 2600.00, 4500.00, N'Pendiente', N'800m', N'["Lun", "Mié", "Vie"]', NULL, N'2026-09-20', N'2026-09-30 · $600', 1, '2026-09-15 08:00:00.000'),
(4, N'c4', N'Abarrotes La Bendición', N'Lucía Méndez', N'Calle Fresno 89, Sur', N'477-444-3322', N'Ruta Sur', 5600.00, 5000.00, N'Pendiente', N'1.2km', N'["Mar", "Jue"]', NULL, N'2026-09-18', NULL, 1, '2026-09-15 08:00:00.000'),
(5, N'c5', N'Abarrotes San Juan', N'Juan Pablo Rivas', N'Calle Zaragoza 12, Centro', N'477-222-8899', N'Ruta Centro', 0.00, 3000.00, N'Pendiente', N'450m', N'["Lun", "Mié", "Vie"]', NULL, N'2026-09-29', NULL, 1, '2026-09-15 08:00:00.000');
SET IDENTITY_INSERT [Clientes] OFF;
GO

SET IDENTITY_INSERT [Productos] ON;
INSERT INTO [Productos] ([Id], [Codigo], [Nombre], [Marca], [Categoria], [Unidad], [PrecioBase], [PrecioCompra], [Existencia], [Sku], [CodigoBarras], [Favorito], [Activo], [FechaCreacion])
VALUES 
(1, N'p1', N'Queso Castel Barra', N'Castel', N'Quesos', N'pieza', 195.00, 145.00, 100, N'CAS-QPB-01', N'7501002345012', 1, 1, '2026-09-15 08:00:00.000'),
(2, N'p2', N'Chiles Jalapeños La Costeña', N'La Costeña', N'Abarrotes', N'pieza', 24.00, 16.00, 150, N'COS-CHJ-02', N'7501017001018', 0, 1, '2026-09-15 08:00:00.000'),
(3, N'p3', N'Jamón Virginia Pavo Zwan', N'Zwan', N'Jamón', N'pieza', 185.00, 135.00, 40, N'ZWA-JVP-03', N'7501025003011', 1, 1, '2026-09-15 08:00:00.000'),
(4, N'p4', N'Salchicha de Pavo San Rafael', N'San Rafael', N'Salchicha', N'pieza', 145.00, 105.00, 60, N'SRA-SPA-04', N'7501032004015', 1, 1, '2026-09-15 08:00:00.000'),
(5, N'p5', N'Chorizo Rojo Selecto', N'Corona', N'Chorizo', N'pieza', 85.00, 58.00, 30, N'COR-CRS-05', N'7501041005019', 0, 1, '2026-09-15 08:00:00.000'),
(6, N'p6', N'Queso Oaxaca Tradicional', N'Los Volcanes', N'Quesos', N'pieza', 195.00, 140.00, 25, N'VOL-QOA-06', N'7501056006013', 1, 1, '2026-09-15 08:00:00.000');
SET IDENTITY_INSERT [Productos] OFF;
GO

SET IDENTITY_INSERT [PresentacionesProducto] ON;
INSERT INTO [PresentacionesProducto] ([Id], [ProductoId], [Tipo], [Nombre], [PiezasEquivalentes], [Precio], [DescripcionEquivalencia])
VALUES 
(1, 1, N'pieza', N'Pieza (1 kg)', 1, 195.00, N'1 barra de 1 kg'),
(2, 1, N'paquete', N'Paquete x10', 10, 1850.00, N'10 barras de 1 kg (Ahorro $100)'),
(3, 1, N'caja', N'Caja x80', 80, 14200.00, N'Caja mayoreo 80 barras'),
(4, 2, N'pieza', N'Pieza (Lata 380g)', 1, 24.00, N'Lata individual'),
(5, 2, N'caja', N'Caja x24', 24, 520.00, N'Caja con 24 latas'),
(6, 3, N'pieza', N'Pieza (1 kg)', 1, 185.00, N'1 paquete de 1 kg rebanado'),
(7, 3, N'paquete', N'Paquete x5', 5, 900.00, N'5 paquetes de 1 kg'),
(8, 3, N'caja', N'Caja x12', 12, 2100.00, N'Caja con 12 paquetes'),
(9, 4, N'pieza', N'Pieza (Paq 500g)', 1, 145.00, N'Paquete 500g'),
(10, 4, N'caja', N'Caja x10', 10, 1400.00, N'Caja con 10 paquetes');
SET IDENTITY_INSERT [PresentacionesProducto] OFF;
GO

INSERT INTO [BitacoraEventos] ([FechaHora], [Tipo], [Modulo], [Accion], [UsuarioNombre], [UsuarioId], [Dispositivo], [Detalle], [Estado])
VALUES 
(GETDATE(), N'Seguridad', N'Auth', N'Base de datos inicializada en MonsterASP.NET', N'Sistema', 1, N'Servidor Cloud', N'{"host": "site95143.siteasp.net"}', N'Exitoso');
GO
