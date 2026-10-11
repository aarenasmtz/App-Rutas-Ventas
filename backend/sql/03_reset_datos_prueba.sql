-- ==============================================================================================
-- SCRIPT TRANSACCIONAL DE LIMPIEZA DE DATOS DE PRUEBA
-- Proyecto: App-Rutas-Ventas
-- Objetivo: Reiniciar datos comerciales y operativos conservando la estructura y usuarios
-- Fecha: 2026-10-11
-- ==============================================================================================

USE [RutaVentasDb];
GO

-- 1. VALIDACIÓN DE SEGURIDAD CONTRA ENTORNOS NO AUTORIZADOS
IF DB_NAME() <> 'RutaVentasDb'
BEGIN
    RAISERROR(N'ERROR DE SEGURIDAD: Este script únicamente está autorizado para ejecutarse sobre [RutaVentasDb]. Ejecución abortada.', 16, 1);
    SET NOEXEC ON;
END
GO

PRINT '================================================================';
PRINT 'INICIANDO LIMPIEZA TRANSACCIONAL DE DATOS EN RutaVentasDb';
PRINT '================================================================';

BEGIN TRY
    BEGIN TRANSACTION;

    -- 2. ELIMINACIÓN ORDENADA RESPETANDO RESTRICCIONES DE LLAVES FORÁNEAS

    PRINT '1/16 Eliminando Pagos...';
    DELETE FROM [Pagos];

    PRINT '2/16 Eliminando VentaDetalles...';
    DELETE FROM [VentaDetalles];

    PRINT '3/16 Eliminando Ventas...';
    DELETE FROM [Ventas];

    PRINT '4/16 Eliminando Devoluciones...';
    DELETE FROM [Devoluciones];

    PRINT '5/16 Eliminando AbonosCobranza...';
    DELETE FROM [AbonosCobranza];

    PRINT '6/16 Eliminando AuditoriaInventarioDetalles...';
    DELETE FROM [AuditoriaInventarioDetalles];

    PRINT '7/16 Eliminando AuditoriaInventario...';
    DELETE FROM [AuditoriaInventario];

    PRINT '8/16 Eliminando InventarioMovimientos...';
    DELETE FROM [InventarioMovimientos];

    PRINT '9/16 Eliminando PresentacionesProducto...';
    DELETE FROM [PresentacionesProducto];

    PRINT '10/16 Eliminando Productos...';
    DELETE FROM [Productos];

    PRINT '11/16 Eliminando Categorias comerciales...';
    DELETE FROM [Categorias];

    PRINT '12/16 Eliminando Clientes...';
    DELETE FROM [Clientes];

    PRINT '13/16 Eliminando Rutas de prueba...';
    DELETE FROM [Rutas];

    PRINT '14/16 Eliminando GastosOperativos...';
    DELETE FROM [GastosOperativos];

    PRINT '15/16 Eliminando CortesCaja...';
    DELETE FROM [CortesCaja];

    PRINT '16/16 Eliminando BitacoraEventos de prueba...';
    DELETE FROM [BitacoraEventos];

    -- 3. REINICIO DE IDENTIFICADORES CONSECUTIVOS (IDENTITY)
    PRINT 'Reiniciando contadores IDENTITY para captura limpia desde 1...';
    
    DBCC CHECKIDENT ('[Pagos]', RESEED, 0);
    DBCC CHECKIDENT ('[VentaDetalles]', RESEED, 0);
    DBCC CHECKIDENT ('[Ventas]', RESEED, 0);
    DBCC CHECKIDENT ('[Devoluciones]', RESEED, 0);
    DBCC CHECKIDENT ('[AbonosCobranza]', RESEED, 0);
    DBCC CHECKIDENT ('[AuditoriaInventarioDetalles]', RESEED, 0);
    DBCC CHECKIDENT ('[AuditoriaInventario]', RESEED, 0);
    DBCC CHECKIDENT ('[InventarioMovimientos]', RESEED, 0);
    DBCC CHECKIDENT ('[PresentacionesProducto]', RESEED, 0);
    DBCC CHECKIDENT ('[Productos]', RESEED, 0);
    DBCC CHECKIDENT ('[Categorias]', RESEED, 0);
    DBCC CHECKIDENT ('[Clientes]', RESEED, 0);
    DBCC CHECKIDENT ('[Rutas]', RESEED, 0);
    DBCC CHECKIDENT ('[GastosOperativos]', RESEED, 0);
    DBCC CHECKIDENT ('[CortesCaja]', RESEED, 0);
    DBCC CHECKIDENT ('[BitacoraEventos]', RESEED, 0);

    -- 4. CONFIRMAR TRANSACCIÓN
    COMMIT TRANSACTION;
    PRINT '================================================================';
    PRINT 'LIMPIEZA TRANSACCIONAL COMPLETADA EXITOSAMENTE';
    PRINT '================================================================';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT 'SE DETECTÓ UN ERROR. TRANSACCIÓN REVERTIDA (ROLLBACK).';
    END;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
