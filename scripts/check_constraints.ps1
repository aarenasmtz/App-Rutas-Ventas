$connStr = "Server=179.236.248.165,1433;Database=RutaVentasDb;User Id=usr_miguel;Password=MiguelRuta2026!#Segura;TrustServerCertificate=True;MultipleActiveResultSets=true;Connect Timeout=10;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    dc.name AS DefaultConstraintName
FROM sys.tables t
JOIN sys.columns c ON t.object_id = c.object_id
LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
WHERE t.name IN ('Productos', 'VentaDetalles', 'InventarioMovimientos')
  AND c.name IN ('Existencia', 'PiezasTotales', 'CantidadPresentaciones', 'Piezas')
"@
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Output "$($reader['TableName']).$($reader['ColumnName']) DefaultConstraint: $($reader['DefaultConstraintName'])"
}
$conn.Close()
