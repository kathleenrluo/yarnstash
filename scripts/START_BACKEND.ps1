# Start Backend Server
# This script bypasses the execution policy issue

# Get the project root directory (parent of scripts directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $projectRoot "backend"

# Change to backend directory
Set-Location $backendDir

# Start the server
& ".\venv\Scripts\python.exe" -m uvicorn app.main:app --reload
