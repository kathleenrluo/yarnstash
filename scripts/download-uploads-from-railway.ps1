# Download uploads from Railway volume (GET /admin/export-uploads) and extract to backend/uploads.
# Usage: .\scripts\download-uploads-from-railway.ps1 [BaseUrl]
#   BaseUrl defaults to https://yarnstash-production.up.railway.app
# Requires: BULK_UPLOAD_SECRET in env, or in backend\.env
param(
    [string]$BaseUrl = $env:RAILWAY_APP_URL
)
if (-not $BaseUrl) { $BaseUrl = "https://yarnstash-production.up.railway.app" }
$BaseUrl = $BaseUrl.TrimEnd("/")

$Secret = $env:BULK_UPLOAD_SECRET
if (-not $Secret) {
    $envFile = Join-Path (Split-Path $PSScriptRoot -Parent) "backend\.env"
    if (Test-Path $envFile) {
        $line = Get-Content $envFile | Where-Object { $_ -match '^\s*BULK_UPLOAD_SECRET=(.+)$' } | Select-Object -First 1
        if ($line -match '=(.+)$') { $Secret = $matches[1].Trim() }
    }
}
if (-not $Secret) {
    Write-Host "Error: Set BULK_UPLOAD_SECRET in env or in backend\.env"
    exit 1
}

$OutZip = Join-Path (Split-Path $PSScriptRoot -Parent) "backend\uploads-from-volume.zip"
$UploadsDir = Join-Path (Split-Path $PSScriptRoot -Parent) "backend\uploads"
$Url = "$BaseUrl/admin/export-uploads"

Write-Host "Downloading from $Url ..."
try {
    Invoke-WebRequest -Uri $Url -Headers @{ "X-Bulk-Upload-Secret" = $Secret } -OutFile $OutZip -UseBasicParsing
} catch {
    Write-Host "Request failed: $_"
    exit 1
}
if ((Get-Item $OutZip).Length -eq 0) {
    Write-Host "Empty response - no uploads on volume or bad secret?"
    exit 1
}
Write-Host "Saved to $OutZip"
if (-not (Test-Path $UploadsDir)) { New-Item -ItemType Directory -Path $UploadsDir -Force | Out-Null }
Expand-Archive -Path $OutZip -DestinationPath $UploadsDir -Force
Write-Host "Extracted to $UploadsDir"
Write-Host "Done."
