# Start Both Backend and Frontend Servers
# This script starts both servers in separate windows

# Get the project root directory (parent of scripts directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"

Write-Host "Starting Yarn Stash Tracker..." -ForegroundColor Green
Write-Host ""

# Start Backend in a new window
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendCmd = "cd '$backendDir'; .\venv\Scripts\python.exe -m uvicorn app.main:app --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend in a new window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendCmd = "cd '$frontendDir'; `$env:Path = 'C:\Program Files\nodejs;' + `$env:Path; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window (servers will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
