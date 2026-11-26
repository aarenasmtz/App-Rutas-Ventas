-- Migración no destructiva: Agregar columna FondoInicial a CortesCaja si no existe
IF COL_LENGTH('CortesCaja', 'FondoInicial') IS NULL
BEGIN
    ALTER TABLE CortesCaja ADD FondoInicial DECIMAL(18,2) NOT NULL CONSTRAINT DF_CortesCaja_FondoInicial DEFAULT 0;
    PRINT 'Columna FondoInicial agregada exitosamente a CortesCaja.';
END
ELSE
BEGIN
    PRINT 'La columna FondoInicial ya existe en CortesCaja.';
END
GO

