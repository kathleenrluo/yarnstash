# One-time: upload backend/uploads as zip to Railway volume.
# Usage: .\scripts\bulk-upload-to-railway.ps1 "https://YOUR-APP.up.railway.app"
# Or set env: $env:RAILWAY_APP_URL = "https://..."; .\scripts\bulk-upload-to-railway.ps1
# Requires BULK_UPLOAD_SECRET in backend\.env (and in Railway variables).

param(
    [Parameter(Mandatory = $false)]
    [string]$Url = $env:RAILWAY_APP_URL
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not $root) { $root = (Get-Location).Path }
$backendEnv = Join-Path $root "backend\.env"
$uploadsDir = Join-Path $root "backend\uploads"
$zipPath = Join-Path $root "uploads.zip"

if (-not $Url) {
    Write-Host "Set your Railway app URL and run again:"
    Write-Host '  $env:RAILWAY_APP_URL = "https://your-app.up.railway.app"'
    Write-Host "  .\scripts\bulk-upload-to-railway.ps1"
    Write-Host "Or pass it: .\scripts\bulk-upload-to-railway.ps1 `"https://your-app.up.railway.app`""
    exit 1
}

$Url = $Url.TrimEnd("/")

if (-not (Test-Path $backendEnv)) {
    Write-Host "Missing backend\.env (need BULK_UPLOAD_SECRET)"
    exit 1
}
$secret = $null
Get-Content $backendEnv | ForEach-Object {
    if ($_ -match '^\s*BULK_UPLOAD_SECRET\s*=\s*(.+)$') {
        $secret = $matches[1].Trim().Trim('"').Trim("'")
    }
}
if (-not $secret) {
    Write-Host "BULK_UPLOAD_SECRET not found in backend\.env"
    exit 1
}

if (-not (Test-Path $uploadsDir)) {
    Write-Host "Missing backend\uploads folder"
    exit 1
}

# Create zip if not present or if uploads are newer
$zipNeeded = -not (Test-Path $zipPath)
if ((Test-Path $zipPath)) {
    $zipTime = (Get-Item $zipPath).LastWriteTimeUtc
    $newer = Get-ChildItem $uploadsDir -File -Recurse | Where-Object { $_.LastWriteTimeUtc -gt $zipTime }
    if ($newer) { $zipNeeded = $true }
}
if ($zipNeeded) {
    Write-Host "Creating uploads.zip from backend\uploads ..."
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    Compress-Archive -Path (Join-Path $uploadsDir "*") -DestinationPath $zipPath -Force
}
Write-Host "Uploading to $Url/admin/bulk-upload-uploads ..."
try {
    # Use curl.exe for multipart upload (works on PowerShell 5.x; Invoke-RestMethod -Form needs PS 7+)
    $curlOut = & curl.exe -s -w "`n%{http_code}" -X POST "$Url/admin/bulk-upload-uploads" `
        -H "X-Bulk-Upload-Secret: $secret" `
        -F "file=@$zipPath"
    $lastLine = $curlOut[-1]
    $body = $curlOut[0..($curlOut.Count - 2)] -join "`n"
    if ($lastLine -match '^\d{3}$') {
        $statusCode = [int]$lastLine
        if ($statusCode -ge 200 -and $statusCode -lt 300) {
            $response = $body | ConvertFrom-Json
            Write-Host "Done. Extracted: $($response.extracted) files."
        } else {
            Write-Host "HTTP $statusCode : $body"
            exit 1
        }
    } else {
        Write-Host $body
        exit 1
    }
} catch {
    Write-Host "Error: $_"
    exit 1
}
