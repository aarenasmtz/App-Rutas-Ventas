$connStr = "Server=179.236.248.165,1433;Database=RutaVentasDb;User Id=usr_miguel;Password=MiguelRuta2026!#Segura;TrustServerCertificate=True;MultipleActiveResultSets=true;Connect Timeout=10;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    c.name AS ColumnName
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('Productos', 'VentaDetalles', 'InventarioMovimientos')
  AND c.name IN ('Existencia', 'PiezasTotales', 'CantidadPresentaciones', 'Piezas')
"@
$reader = $cmd.ExecuteReader()
$count = 0
while ($reader.Read()) {
    $count++
    Write-Output "Index: $($reader['IndexName']) on $($reader['TableName']).$($reader['ColumnName'])"
}
if ($count -eq 0) { Write-Output "No indexes on these columns." }
$conn.Close()

