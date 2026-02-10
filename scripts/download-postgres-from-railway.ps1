# Download (dump) PostgreSQL from Railway to a local .sql file.
# Requires: pg_dump on PATH (install PostgreSQL client tools), and a *public* DB URL from Railway.
#
# Usage:
#   .\scripts\download-postgres-from-railway.ps1 -ConnectionUrl "postgresql://postgres:PASSWORD@HOST:PORT/railway"
#   # or set env var first:
#   $env:RAILWAY_DATABASE_PUBLIC_URL = "postgresql://postgres:PASSWORD@HOST:PORT/railway"
#   .\scripts\download-postgres-from-railway.ps1
#
# How to get the connection URL from Railway:
#   1. Open your Railway project → PostgreSQL service.
#   2. Go to Settings / Connect and enable "TCP Proxy" (or "Public Networking").
#   3. Copy the public connection URL (or note RAILWAY_TCP_PROXY_DOMAIN, RAILWAY_TCP_PROXY_PORT, and the password).
#   4. Format: postgresql://postgres:YOUR_PASSWORD@TCP_PROXY_DOMAIN:TCP_PROXY_PORT/railway
#
# Output: backend/railway-dump.sql (plain SQL dump).
param(
    [string]$ConnectionUrl = $env:RAILWAY_DATABASE_PUBLIC_URL
)

if (-not $ConnectionUrl) {
    Write-Host "Error: Provide -ConnectionUrl or set RAILWAY_DATABASE_PUBLIC_URL to the Railway Postgres *public* URL."
    Write-Host "Example: .\scripts\download-postgres-from-railway.ps1 -ConnectionUrl 'postgresql://postgres:PASSWORD@HOST:PORT/railway'"
    Write-Host "Enable TCP Proxy on the Postgres service in Railway to get a public host/port."
    exit 1
}

$RepoRoot = Split-Path $PSScriptRoot -Parent
$OutFile = Join-Path $RepoRoot "backend\railway-dump.sql"

# Check for pg_dump
$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Host "Error: pg_dump not found. Install PostgreSQL client tools (e.g. PostgreSQL installer) and ensure pg_dump is on PATH."
    exit 1
}

Write-Host "Dumping Railway Postgres to $OutFile ..."
try {
    & pg_dump "$ConnectionUrl" --no-owner --no-acl -f "$OutFile"
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} catch {
    Write-Host "pg_dump failed: $_"
    exit 1
}

$size = (Get-Item $OutFile).Length
Write-Host "Done. Saved $OutFile ($size bytes)."
Write-Host "To restore into a local Postgres: psql -h localhost -U postgres -d your_db -f backend/railway-dump.sql"
