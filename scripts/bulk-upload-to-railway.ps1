# One-time: upload backend/uploads to Railway volume (in batches of 10 to avoid timeouts).
# Usage: .\scripts\bulk-upload-to-railway.ps1 "https://YOUR-APP.up.railway.app"
# Or set env: $env:RAILWAY_APP_URL = "https://..."; .\scripts\bulk-upload-to-railway.ps1
# Requires BULK_UPLOAD_SECRET in backend\.env (and in Railway variables).

param(
    [Parameter(Mandatory = $false)]
    [string]$Url = $env:RAILWAY_APP_URL,
    [Parameter(Mandatory = $false)]
    [int]$BatchSize = 10
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not $root) { $root = (Get-Location).Path }
$backendEnv = Join-Path $root "backend\.env"
$uploadsDir = Join-Path $root "backend\uploads"

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

$allowedExt = @('.jpg','.jpeg','.png','.gif','.webp')
$allFiles = @(Get-ChildItem -Path $uploadsDir -File | Where-Object { $allowedExt -contains $_.Extension.ToLowerInvariant() })
if ($allFiles.Count -eq 0) {
    Write-Host "No image files in backend\uploads"
    exit 0
}

$totalUploaded = 0
$batchNum = 0
$numBatches = [Math]::Ceiling($allFiles.Count / $BatchSize)

for ($i = 0; $i -lt $allFiles.Count; $i += $BatchSize) {
    $batchNum++
    $batch = $allFiles[$i..([Math]::Min($i + $BatchSize - 1, $allFiles.Count - 1))]
    $batchZip = Join-Path $root "uploads_batch_$batchNum.zip"
    try {
        Remove-Item $batchZip -Force -ErrorAction SilentlyContinue
        Compress-Archive -Path $batch.FullName -DestinationPath $batchZip -Force
        Write-Host "Uploading batch $batchNum of $numBatches ($($batch.Count) files)..."
        $curlOut = & curl.exe -s -w "`n%{http_code}" -X POST "$Url/admin/bulk-upload-uploads" `
            -H "X-Bulk-Upload-Secret: $secret" `
            -F "file=@$batchZip" `
            --max-time 120
        $lastLine = $curlOut[-1]
        $body = $curlOut[0..($curlOut.Count - 2)] -join "`n"
        if ($lastLine -match '^\d{3}$') {
            $statusCode = [int]$lastLine
            if ($statusCode -ge 200 -and $statusCode -lt 300) {
                $response = $body | ConvertFrom-Json
                $totalUploaded += $response.extracted
                Write-Host "  OK. Extracted: $($response.extracted). Total so far: $totalUploaded"
            } else {
                Write-Host "  HTTP $statusCode : $body"
                Remove-Item $batchZip -Force -ErrorAction SilentlyContinue
                exit 1
            }
        } else {
            Write-Host "  Response: $body"
            Remove-Item $batchZip -Force -ErrorAction SilentlyContinue
            exit 1
        }
    } finally {
        Remove-Item $batchZip -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Done. Total files uploaded: $totalUploaded"
