$connStr = "Server=179.236.248.165,1433;Database=RutaVentasDb;User Id=usr_miguel;Password=MiguelRuta2026!#Segura;TrustServerCertificate=True;MultipleActiveResultSets=true;Connect Timeout=10;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('Productos', 'VentaDetalles', 'InventarioMovimientos')
  AND COLUMN_NAME IN ('Existencia', 'PiezasTotales', 'CantidadPresentaciones', 'Piezas')
ORDER BY TABLE_NAME, COLUMN_NAME
"@
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Output "$($reader['TABLE_NAME']).$($reader['COLUMN_NAME']) -> $($reader['DATA_TYPE']) ($($reader['NUMERIC_PRECISION']), $($reader['NUMERIC_SCALE']))"
}
$conn.Close()