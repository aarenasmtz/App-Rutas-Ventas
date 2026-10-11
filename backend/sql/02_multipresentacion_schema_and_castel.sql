-- ============================================================================
-- Migración Multipresentación y Configuración Oficial Queso Castel
-- ============================================================================

-- 1. Agregar columnas a Productos si no existen
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Productos') AND name = 'ManejaMultiplesPresentaciones')
BEGIN
    ALTER TABLE Productos ADD ManejaMultiplesPresentaciones BIT NOT NULL DEFAULT 0;
END
GO

-- 2. Agregar columnas a PresentacionesProducto si no existen
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PresentacionesProducto') AND name = 'CodigoBarras')
BEGIN
    ALTER TABLE PresentacionesProducto ADD CodigoBarras NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PresentacionesProducto') AND name = 'Activa')
BEGIN
    ALTER TABLE PresentacionesProducto ADD Activa BIT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PresentacionesProducto') AND name = 'Orden')
BEGIN
    ALTER TABLE PresentacionesProducto ADD Orden INT NOT NULL DEFAULT 1;
END
GO

-- 3. Agregar columnas a VentaDetalles si no existen
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentaDetalles') AND name = 'FactorConversion')
BEGIN
    ALTER TABLE VentaDetalles ADD FactorConversion INT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('VentaDetalles') AND name = 'PresentacionNombre')
BEGIN
    ALTER TABLE VentaDetalles ADD PresentacionNombre NVARCHAR(100) NULL;
END
GO

-- 4. Actualizar o Registrar Queso Castel (p1) según Regla de Negocio Real
-- Unidad base: paquete
-- Precio base: $8.00
-- Existencia inicial de prueba: 300 paquetes (5 cajas x 60 paquetes)
IF EXISTS (SELECT * FROM Productos WHERE Codigo = 'p1')
BEGIN
    UPDATE Productos
    SET Nombre = 'Queso Castel',
        Marca = 'Castel',
        Categoria = 'Quesos',
        Unidad = 'paquete',
        PrecioBase = 8.00,
        PrecioCompra = 5.50,
        Existencia = 300,
        Sku = 'CAS-QP-01',
        CodigoBarras = '7501002345012',
        Favorito = 1,
        Activo = 1,
        ManejaMultiplesPresentaciones = 1
    WHERE Codigo = 'p1';

    -- Eliminar presentaciones anteriores para p1
    DELETE FROM PresentacionesProducto WHERE ProductoId = (SELECT Id FROM Productos WHERE Codigo = 'p1');

    -- Insertar las 3 presentaciones oficiales de Castel
    DECLARE @CastelId INT = (SELECT Id FROM Productos WHERE Codigo = 'p1');

    INSERT INTO PresentacionesProducto (ProductoId, Tipo, Nombre, PiezasEquivalentes, Precio, DescripcionEquivalencia, CodigoBarras, Activa, Orden)
    VALUES 
    (@CastelId, 'paquete', 'Paquete', 1, 8.00, '1 paquete = 1 unidad base', '7501002345012', 1, 1),
    (@CastelId, 'exhibidor', 'Exhibidor', 10, 80.00, '1 exhibidor = 10 paquetes', '7501002345029', 1, 2),
    (@CastelId, 'caja', 'Caja', 60, 480.00, '1 caja = 6 exhibidores = 60 paquetes', '7501002345036', 1, 3);
END
GO
