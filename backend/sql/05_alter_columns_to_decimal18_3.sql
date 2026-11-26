-- Migration 05: Migración de Existencias y Cantidades de int a DECIMAL(18,3)
-- Soporta pesaje fraccionario de báscula (ej. 0.450 kg de jamón/queso) sin truncamiento a enteros.

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Productos' AND COLUMN_NAME = 'Existencia' AND DATA_TYPE = 'int'
)
BEGIN
    ALTER TABLE Productos ALTER COLUMN Existencia DECIMAL(18,3) NOT NULL;
END

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'InventarioMovimientos' AND COLUMN_NAME = 'Piezas' AND DATA_TYPE = 'int'
)
BEGIN
    ALTER TABLE InventarioMovimientos ALTER COLUMN Piezas DECIMAL(18,3) NOT NULL;
END

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'VentaDetalles' AND COLUMN_NAME = 'CantidadPresentaciones' AND DATA_TYPE = 'int'
)
BEGIN
    ALTER TABLE VentaDetalles ALTER COLUMN CantidadPresentaciones DECIMAL(18,3) NOT NULL;
END

IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'VentaDetalles' AND COLUMN_NAME = 'PiezasTotales' AND DATA_TYPE = 'int'
)
BEGIN
    ALTER TABLE VentaDetalles ALTER COLUMN PiezasTotales DECIMAL(18,3) NOT NULL;
END

