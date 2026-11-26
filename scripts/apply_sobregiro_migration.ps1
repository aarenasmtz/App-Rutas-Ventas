$connStr = "Server=179.236.248.165,1433;Database=RutaVentasDb;User Id=usr_miguel;Password=MiguelRuta2026!#Segura;TrustServerCertificate=True;MultipleActiveResultSets=true;Connect Timeout=15;"
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$sql = Get-Content "backend/sql/06_create_solicitudes_sobregiro.sql" -Raw
$cmd = $conn.CreateCommand()
$cmd.CommandText = $sql
$rows = $cmd.ExecuteNonQuery()
Write-Output "Table SolicitudesSobregiro created/verified successfully."
$conn.Close()

