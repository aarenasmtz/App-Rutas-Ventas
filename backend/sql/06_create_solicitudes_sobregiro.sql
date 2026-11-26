-- Migration 06: Crear tabla SolicitudesSobregiro para autorización remota de crédito

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SolicitudesSobregiro')
BEGIN
    CREATE TABLE SolicitudesSobregiro (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TokenSolicitud NVARCHAR(50) NOT NULL UNIQUE,
        ClienteId INT NOT NULL,
        ChoferId INT NOT NULL,
        SaldoActual DECIMAL(18,2) NOT NULL,
        LimiteCredito DECIMAL(18,2) NOT NULL,
        MontoSolicitado DECIMAL(18,2) NOT NULL,
        Motivo NVARCHAR(200) NULL,
        Estado NVARCHAR(30) NOT NULL DEFAULT 'Pendiente',
        AutorizadoPorId INT NULL,
        TokenAutorizacion NVARCHAR(50) NULL,
        FechaSolicitud DATETIME2 NOT NULL DEFAULT GETDATE(),
        FechaResolucion DATETIME2 NULL
    );
END

