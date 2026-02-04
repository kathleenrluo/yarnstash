# Setup script for Yarn Stash Tracker Backend
# Run this script to set up the Python virtual environment and install dependencies

Write-Host "Setting up Yarn Stash Tracker Backend..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Yellow
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

Write-Host "`nSetup complete! To start the server, run:" -ForegroundColor Green
Write-Host "  uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host "`nThe API will be available at http://localhost:8000" -ForegroundColor Cyan
Write-Host "Interactive docs at http://localhost:8000/docs" -ForegroundColor Cyan
