# Build script for demo deployment (PowerShell)
# Builds frontend and prepares for Railway deployment

Write-Host "Building frontend for demo..." -ForegroundColor Green
Set-Location frontend
npm install
$env:VITE_DEMO_MODE="true"
npm run build
Set-Location ..

Write-Host "Preparing demo database..." -ForegroundColor Green
Set-Location backend
python utilities/prepare_demo_db.py
Set-Location ..

Write-Host "Build complete! Frontend built to frontend/dist" -ForegroundColor Green
Write-Host "Demo database prepared at backend/yarn_stash_demo.db" -ForegroundColor Green
