function Upload-FtpDirectory($localPath, $ftpBaseUrl, $user, $pass) {
    $files = Get-ChildItem -Path $localPath -Recurse

    # First create directories
    $dirs = $files | Where-Object { $_.PSIsContainer }
    foreach ($d in $dirs) {
        $relativePath = $d.FullName.Substring($localPath.Length).Replace("\", "/").TrimStart("/")
        $targetDirUrl = "$ftpBaseUrl/$relativePath"
        try {
            $req = [System.Net.FtpWebRequest]::Create($targetDirUrl)
            $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
            $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
            $req.UseBinary = $true
            $req.UsePassive = $true
            $res = $req.GetResponse()
            $res.Close()
            Write-Host "Created dir: $relativePath"
        } catch {
            # Ignore if already exists
        }
    }

    # Upload files
    $fileItems = $files | Where-Object { -not $_.PSIsContainer }
    $total = $fileItems.Count
    $idx = 0
    foreach ($f in $fileItems) {
        $idx++
        $relativePath = $f.FullName.Substring($localPath.Length).Replace("\", "/").TrimStart("/")
        $targetFileUrl = "$ftpBaseUrl/$relativePath"
        
        Write-Host "[$idx/$total] Subiendo $relativePath ..."
        try {
            $req = [System.Net.FtpWebRequest]::Create($targetFileUrl)
            $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.UseBinary = $true
            $req.UsePassive = $true
            
            $fileBytes = [System.IO.File]::ReadAllBytes($f.FullName)
            $req.ContentLength = $fileBytes.Length
            $reqStream = $req.GetRequestStream()
            $reqStream.Write($fileBytes, 0, $fileBytes.Length)
            $reqStream.Close()
            $res = $req.GetResponse()
            $res.Close()
        } catch {
            Write-Host "Error subiendo $relativePath : " $_.Exception.Message
        }
    }
}

$publishFolder = "d:\APP-Ruta-Venta\backend\RutaVentas.Api\publish"
$ftpUrl = "ftp://site95143.siteasp.net/wwwroot"
Write-Host "Comenzando despliegue de archivos hacia $ftpUrl ..."
Upload-FtpDirectory $publishFolder $ftpUrl "site95143" "Aaron2804#"
Write-Host "¡Despliegue completado!"
