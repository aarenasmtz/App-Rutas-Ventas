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

