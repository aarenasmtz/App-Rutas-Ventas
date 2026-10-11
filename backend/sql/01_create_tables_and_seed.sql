USE RutaVentasDb;
GO

-- ==============================================================
-- 1. TABLAS PRINCIPALES
-- ==============================================================

IF OBJECT_ID('VentaDetalles', 'U') IS NOT NULL DROP TABLE VentaDetalles;
IF OBJECT_ID('Pagos', 'U') IS NOT NULL DROP TABLE Pagos;
IF OBJECT_ID('Ventas', 'U') IS NOT NULL DROP TABLE Ventas;
IF OBJECT_ID('AbonosCobranza', 'U') IS NOT NULL DROP TABLE AbonosCobranza;
IF OBJECT_ID('AuditoriaInventarioDetalles', 'U') IS NOT NULL DROP TABLE AuditoriaInventarioDetalles;
IF OBJECT_ID('AuditoriaInventario', 'U') IS NOT NULL DROP TABLE AuditoriaInventario;
IF OBJECT_ID('CortesCaja', 'U') IS NOT NULL DROP TABLE CortesCaja;
IF OBJECT_ID('GastosOperativos', 'U') IS NOT NULL DROP TABLE GastosOperativos;
IF OBJECT_ID('InventarioMovimientos', 'U') IS NOT NULL DROP TABLE InventarioMovimientos;
IF OBJECT_ID('PresentacionesProducto', 'U') IS NOT NULL DROP TABLE PresentacionesProducto;
IF OBJECT_ID('Productos', 'U') IS NOT NULL DROP TABLE Productos;
IF OBJECT_ID('Clientes', 'U') IS NOT NULL DROP TABLE Clientes;
IF OBJECT_ID('Rutas', 'U') IS NOT NULL DROP TABLE Rutas;
IF OBJECT_ID('Usuarios', 'U') IS NOT NULL DROP TABLE Usuarios;
GO

CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Usuario NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Rol NVARCHAR(30) NOT NULL, -- 'Administrador' | 'Vendedor'
    RutaAsignada NVARCHAR(50) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Rutas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL,
    Activa BIT NOT NULL DEFAULT 1
);

CREATE TABLE Clientes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(20) NOT NULL UNIQUE,
    Nombre NVARCHAR(150) NOT NULL,
    Propietario NVARCHAR(100) NOT NULL,
    Direccion NVARCHAR(250) NOT NULL,
    Telefono NVARCHAR(30) NULL,
    Ruta NVARCHAR(50) NOT NULL,
    Saldo DECIMAL(18,2) NOT NULL DEFAULT 0,
    LimiteCredito DECIMAL(18,2) NOT NULL DEFAULT 5000,
    EstadoVisita NVARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    DistanciaMock NVARCHAR(50) NULL,
    DiasVisitaJson NVARCHAR(200) NOT NULL DEFAULT '["Lun","Mié","Vie"]',
    PreciosEspecialesJson NVARCHAR(MAX) NULL,
    UltimaCompra NVARCHAR(100) NULL,
    UltimoPago NVARCHAR(100) NULL,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Productos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(20) NOT NULL UNIQUE,
    Nombre NVARCHAR(150) NOT NULL,
    Marca NVARCHAR(100) NULL,
    Categoria NVARCHAR(50) NOT NULL,
    Unidad NVARCHAR(20) NOT NULL DEFAULT 'pieza',
    PrecioBase DECIMAL(18,2) NOT NULL,
    PrecioCompra DECIMAL(18,2) NOT NULL DEFAULT 0,
    Existencia INT NOT NULL DEFAULT 0, -- Siempre en piezas totales
    Sku NVARCHAR(50) NULL,
    CodigoBarras NVARCHAR(50) NULL,
    Favorito BIT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE PresentacionesProducto (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductoId INT NOT NULL FOREIGN KEY REFERENCES Productos(Id) ON DELETE CASCADE,
    Tipo NVARCHAR(30) NOT NULL, -- 'pieza' | 'paquete' | 'caja' | 'exhibidor'
    Nombre NVARCHAR(100) NOT NULL,
    PiezasEquivalentes INT NOT NULL DEFAULT 1,
    Precio DECIMAL(18,2) NOT NULL,
    DescripcionEquivalencia NVARCHAR(150) NULL
);

CREATE TABLE Ventas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Folio NVARCHAR(50) NOT NULL UNIQUE,
    ClienteId INT NOT NULL FOREIGN KEY REFERENCES Clientes(Id),
    UsuarioId INT NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    Total DECIMAL(18,2) NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL,
    DescuentoTotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    Estado NVARCHAR(30) NOT NULL DEFAULT 'Completada',
    FechaHora DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE VentaDetalles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    VentaId INT NOT NULL FOREIGN KEY REFERENCES Ventas(Id) ON DELETE CASCADE,
    ProductoId INT NOT NULL FOREIGN KEY REFERENCES Productos(Id),
    PresentacionTipo NVARCHAR(30) NOT NULL,
    CantidadPresentaciones INT NOT NULL,
    PiezasTotales INT NOT NULL,
    PrecioUnitario DECIMAL(18,2) NOT NULL,
    Subtotal DECIMAL(18,2) NOT NULL
);

CREATE TABLE Pagos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    VentaId INT NOT NULL FOREIGN KEY REFERENCES Ventas(Id) ON DELETE CASCADE,
    Metodo NVARCHAR(30) NOT NULL, -- 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Crédito'
    Monto DECIMAL(18,2) NOT NULL,
    FechaHora DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE AbonosCobranza (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ClienteId INT NOT NULL FOREIGN KEY REFERENCES Clientes(Id),
    UsuarioId INT NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    Monto DECIMAL(18,2) NOT NULL,
    MetodoPago NVARCHAR(30) NOT NULL,
    Comentario NVARCHAR(250) NULL,
    FechaHora DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE InventarioMovimientos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProductoId INT NOT NULL FOREIGN KEY REFERENCES Productos(Id),
    TipoMovimiento NVARCHAR(30) NOT NULL, -- 'CargaInicial' | 'Venta' | 'Devolucion' | 'AjusteAuditoria' | 'Traspaso'
    Ubicacion NVARCHAR(50) NOT NULL,
    Piezas INT NOT NULL,
    Motivo NVARCHAR(200) NULL,
    FechaHora DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE AuditoriaInventario (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    Ruta NVARCHAR(50) NOT NULL DEFAULT 'Ruta Centro',
    FechaRevision DATETIME NOT NULL DEFAULT GETDATE(),
    Estado NVARCHAR(30) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente' | 'Autorizado'
    Observaciones NVARCHAR(MAX) NULL
);

CREATE TABLE AuditoriaInventarioDetalles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AuditoriaId INT NOT NULL FOREIGN KEY REFERENCES AuditoriaInventario(Id) ON DELETE CASCADE,
    ProductoId INT NOT NULL FOREIGN KEY REFERENCES Productos(Id),
    CantidadSistema INT NOT NULL,
    CantidadFisica INT NOT NULL,
    Diferencia INT NOT NULL,
    Comentario NVARCHAR(250) NULL,
    Revisado BIT NOT NULL DEFAULT 0
);

CREATE TABLE CortesCaja (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    FechaJornada DATE NOT NULL,
    Ruta NVARCHAR(50) NOT NULL,
    VentasTotales DECIMAL(18,2) NOT NULL DEFAULT 0,
    Efectivo DECIMAL(18,2) NOT NULL DEFAULT 0,
    Transferencias DECIMAL(18,2) NOT NULL DEFAULT 0,
    Tarjetas DECIMAL(18,2) NOT NULL DEFAULT 0,
    Credito DECIMAL(18,2) NOT NULL DEFAULT 0,
    CobranzaAbonos DECIMAL(18,2) NOT NULL DEFAULT 0,
    Gastos DECIMAL(18,2) NOT NULL DEFAULT 0,
    Devoluciones DECIMAL(18,2) NOT NULL DEFAULT 0,
    EfectivoEsperado DECIMAL(18,2) NOT NULL DEFAULT 0,
    EfectivoContado DECIMAL(18,2) NOT NULL DEFAULT 0,
    DiferenciaCaja DECIMAL(18,2) NOT NULL DEFAULT 0,
    InventarioInicialPiezas INT NOT NULL DEFAULT 0,
    InventarioActualPiezas INT NOT NULL DEFAULT 0,
    PiezasVendidas INT NOT NULL DEFAULT 0,
    Estado NVARCHAR(30) NOT NULL DEFAULT 'Cerrado'
);

CREATE TABLE GastosOperativos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL FOREIGN KEY REFERENCES Usuarios(Id),
    Concepto NVARCHAR(50) NOT NULL, -- 'Gasolina' | 'Comida' | 'Estacionamiento' | 'Mantenimiento' | 'Otro'
    Importe DECIMAL(18,2) NOT NULL,
    MetodoPago NVARCHAR(30) NOT NULL DEFAULT 'Efectivo',
    Observaciones NVARCHAR(250) NULL,
    FechaHora DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ==============================================================
-- 2. SEED DATA INICIAL
-- ==============================================================

-- Usuarios: Miguel (Admin) y Juan (Vendedor)
INSERT INTO Usuarios (Nombre, Usuario, PasswordHash, Rol, RutaAsignada, Activo)
VALUES 
('Miguel', 'miguel', 'demo1234', 'Administrador', 'Ruta Centro', 1),
('Juan Pérez', 'juan', 'demo1234', 'Vendedor', 'Ruta Norte', 1),
('Pedro Ramírez', 'pedro', 'demo1234', 'Vendedor', 'Ruta Sur', 1);

-- Rutas
INSERT INTO Rutas (Nombre, Descripcion, Activa)
VALUES
('Ruta Centro', 'Zona Comercial Centro y Abarrotes', 1),
('Ruta Norte', 'Colonias del Norte y Cremerías', 1),
('Ruta Sur', 'Sector Sur y Mercados', 1);

-- Clientes
INSERT INTO Clientes (Codigo, Nombre, Propietario, Direccion, Telefono, Ruta, Saldo, LimiteCredito, EstadoVisita, DistanciaMock, DiasVisitaJson, UltimaCompra, UltimoPago)
VALUES
('c1', 'ABTS ARENAS', 'Aaron Arenas', 'Calle Hidalgo 23, Centro', '55 1234 5678', 'Ruta Centro', 1250.00, 5000.00, 'Pendiente', '50m · ¡Estás aquí!', '["Lun","Mié","Vie"]', 'hace 4 días · $2,350', 'hace 7 días · $1,500'),
('c2', 'Cremería La Esquina', 'Marcela Vega', 'Av. Juárez 145, Centro', '55 9876 5432', 'Ruta Centro', 0.00, 4000.00, 'Pendiente', '320m', '["Lun","Mié","Vie"]', 'hace 4 días · $980', 'hace 4 días · $980'),
('c3', 'Abarrotes El Chuy', 'Jesús Martínez', 'Calle Morelos 67, Col. Obrera', '55 4567 8901', 'Ruta Centro', 3200.00, 4500.00, 'Pendiente', '750m', '["Lun","Jue"]', 'hace 5 días · $2,800', 'hace 12 días · $2,000'),
('c4', 'Abarrotes La Bendición', 'Lucía Méndez', 'Calle Reforma 56, Sur', '55 2345 6789', 'Ruta Sur', 5600.00, 5000.00, 'Pendiente', '1.2 km', '["Mar","Vie"]', 'hace 6 días · $3,200', 'hace 18 días · $1,000'),
('c5', 'Abarrotes San Juan', 'Juan Pablo Rivas', 'Calle Zaragoza 89, Centro', '55 8899 0011', 'Ruta Centro', 0.00, 3000.00, 'Venta realizada', '900m', '["Lun","Mié","Vie"]', 'Hoy · $1,890', 'Hoy · $1,890');

-- Productos
INSERT INTO Productos (Codigo, Nombre, Marca, Categoria, Unidad, PrecioBase, PrecioCompra, Existencia, Sku, CodigoBarras, Favorito, Activo)
VALUES
('p1', 'Queso Castel Barra', 'Castel', 'Quesos', 'pieza', 195.00, 145.00, 80, 'CAS-QPB-01', '7501002345012', 1, 1),
('p2', 'Chiles Jalapeños La Costeña', 'La Costeña', 'Enlatados', 'pieza', 24.00, 17.00, 48, 'LCO-CHI-02', '7501017002014', 1, 1),
('p3', 'Jamón Virginia Pavo Zwan', 'Zwan', 'Jamón', 'pieza', 185.00, 130.00, 18, 'ZWA-JVP-03', '7501004523101', 1, 1),
('p4', 'Salchicha de Pavo San Rafael', 'San Rafael', 'Salchicha', 'pieza', 145.00, 105.00, 14, 'SRA-SAL-04', '7501008812349', 1, 1),
('p5', 'Chorizo Español Corona', 'Corona', 'Chorizo', 'pieza', 210.00, 155.00, 6, 'COR-CHO-05', '7501005519821', 1, 1),
('p6', 'Queso Oaxaca Tradicional', 'Los Altos', 'Quesos', 'pieza', 195.00, 140.00, 24, 'LAL-QOA-06', '7501009944112', 1, 1),
('p7', 'Mantequilla Gloria con Sal', 'Gloria', 'Mantequillas', 'pieza', 32.00, 23.00, 36, 'GLO-MAN-07', '7501023344123', 0, 1),
('p8', 'Mayonesa McCormick con Limón', 'McCormick', 'Mayonesas', 'pieza', 58.00, 42.00, 18, 'MCC-MAY-08', '7501001122334', 0, 1),
('p9', 'Queso Manchego Caperucita', 'Caperucita', 'Quesos', 'pieza', 280.00, 205.00, 0, 'CAP-QMA-09', '7501007788990', 0, 1),
('p10', 'Chorizo Casero Ranchero', 'Ranchero', 'Chorizo', 'pieza', 135.00, 98.00, 22, 'RAN-CHO-10', '7501003322119', 0, 1),
('p11', 'Atún Dolores en Aceite', 'Dolores', 'Enlatados', 'pieza', 22.00, 16.00, 60, 'DOL-ATU-11', '7501044455667', 1, 1),
('p12', 'Aceite Nutrioli 946ml', 'Nutrioli', 'Abarrotes', 'pieza', 48.00, 36.00, 30, 'NUT-ACE-12', '7501022233445', 0, 1);

-- Presentaciones de Productos
-- p1: Queso Castel
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(1, 'pieza', 'Pieza individual', 1, 195.00, '1 pieza suelta'),
(1, 'paquete', 'Paquete x 10 pzas', 10, 1850.00, '1 paquete = 10 piezas'),
(1, 'caja', 'Caja Master (8 paqs = 80 pzas)', 80, 14200.00, '1 caja = 8 paquetes = 80 piezas');

-- p2: Chiles La Costeña
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(2, 'pieza', 'Lata individual (Pieza)', 1, 24.00, '1 lata'),
(2, 'caja', 'Caja x 6 latas', 6, 138.00, '1 caja = 6 piezas'),
(2, 'caja', 'Caja x 24 latas', 24, 540.00, '1 caja = 24 piezas');

-- p3: Jamón Virginia
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(3, 'pieza', 'Pieza 500g', 1, 185.00, '1 pieza empaque sellado'),
(3, 'paquete', 'Paquete x 5 pzas', 5, 900.00, '1 paquete = 5 piezas'),
(3, 'caja', 'Caja x 12 pzas', 12, 2100.00, '1 caja = 12 piezas');

-- p4: Salchicha San Rafael
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(4, 'pieza', 'Pieza paquete 500g', 1, 145.00, '1 paquete unitario'),
(4, 'caja', 'Caja x 10 paquetes', 10, 1400.00, '1 caja = 10 piezas');

-- p5: Chorizo Corona
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(5, 'pieza', 'Pieza de 400g', 1, 210.00, '1 pieza'),
(5, 'paquete', 'Paquete x 4 pzas', 4, 820.00, '1 paquete = 4 piezas');

-- p6: Queso Oaxaca
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(6, 'pieza', 'Bola de 1kg (Pieza)', 1, 195.00, '1 pieza (1 kg)'),
(6, 'caja', 'Caja x 10 bolas', 10, 1900.00, '1 caja = 10 piezas');

-- p7: Mantequilla Gloria
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(7, 'pieza', 'Barra 90g (Pieza)', 1, 32.00, '1 barra'),
(7, 'paquete', 'Paquete x 4 barras', 4, 124.00, '1 paquete = 4 piezas'),
(7, 'caja', 'Caja x 40 barras', 40, 1200.00, '1 caja = 40 piezas');

-- p8: Mayonesa McCormick
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(8, 'pieza', 'Frasco 400g (Pieza)', 1, 58.00, '1 frasco'),
(8, 'caja', 'Caja x 12 frascos', 12, 680.00, '1 caja = 12 piezas');

-- p9: Queso Manchego
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(9, 'pieza', 'Pieza 400g rebanado', 1, 280.00, '1 pieza'),
(9, 'caja', 'Caja x 8 pzas', 8, 2200.00, '1 caja = 8 piezas');

-- p10: Chorizo Ranchero
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(10, 'pieza', 'Manojo de 300g (Pieza)', 1, 135.00, '1 manojo'),
(10, 'caja', 'Caja x 15 manojos', 15, 1950.00, '1 caja = 15 piezas');

-- p11: Atún Dolores
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(11, 'pieza', 'Lata 140g (Pieza)', 1, 22.00, '1 lata'),
(11, 'paquete', 'Pack x 4 latas', 4, 85.00, '1 pack = 4 piezas'),
(11, 'caja', 'Caja x 48 latas', 48, 980.00, '1 caja = 48 piezas'),
(11, 'exhibidor', 'Exhibidor mostrador (24 latas)', 24, 510.00, '1 exhibidor = 24 piezas');

-- p12: Aceite Nutrioli
INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia)
VALUES
(12, 'pieza', 'Botella 946ml (Pieza)', 1, 48.00, '1 botella'),
(12, 'caja', 'Caja x 12 botellas', 12, 560.00, '1 caja = 12 piezas');

-- Auditoría Inicial
INSERT INTO AuditoriaInventario (UsuarioId, Ruta, Estado, Observaciones)
VALUES (1, 'Ruta Centro', 'Pendiente', 'Auditoría inicial de camioneta antes de salida a ruta');

INSERT INTO AuditoriaInventarioDetalles (AuditoriaId, ProductoId, CantidadSistema, CantidadFisica, Diferencia, Comentario, Revisado)
VALUES
(1, 1, 80, 78, -2, 'Faltan 2 piezas por merma de ruta', 1),
(1, 2, 48, 48, 0, 'Conteo exacto', 1),
(1, 3, 18, 18, 0, 'OK', 1),
(1, 4, 14, 15, 1, 'Sobrante detectado', 1),
(1, 5, 6, 6, 0, 'OK', 1),
(1, 6, 24, 24, 0, 'OK', 1),
(1, 7, 36, 36, 0, '', 0),
(1, 8, 18, 18, 0, '', 0),
(1, 9, 0, 0, 0, '', 0),
(1, 10, 22, 22, 0, '', 0),
(1, 11, 60, 60, 0, '', 0),
(1, 12, 30, 30, 0, '', 0);

-- Cortes del Día Iniciales
INSERT INTO CortesCaja (UsuarioId, FechaJornada, Ruta, VentasTotales, Efectivo, Transferencias, Tarjetas, Credito, CobranzaAbonos, Gastos, Devoluciones, EfectivoEsperado, EfectivoContado, DiferenciaCaja, InventarioInicialPiezas, InventarioActualPiezas, PiezasVendidas, Estado)
VALUES
(1, CAST(GETDATE() AS DATE), 'Ruta Centro', 8450.00, 4250.00, 1200.00, 800.00, 2200.00, 3200.00, 515.00, 480.00, 7435.00, 7435.00, 0.00, 340, 278, 62, 'Cerrado'),
(2, CAST(GETDATE() AS DATE), 'Ruta Norte', 5800.00, 3100.00, 900.00, 600.00, 1200.00, 1450.00, 380.00, 150.00, 4470.00, 4420.00, -50.00, 290, 248, 42, 'Cerrado'),
(3, CAST(GETDATE() AS DATE), 'Ruta Sur', 4600.00, 2400.00, 800.00, 400.00, 1000.00, 980.00, 410.00, 0.00, 3270.00, 3270.00, 0.00, 260, 224, 36, 'Cerrado');

PRINT 'Base de datos RutaVentasDb y datos iniciales creados exitosamente.';
GO
