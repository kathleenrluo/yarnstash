# Start Frontend Server
# This script adds Node.js to PATH and starts the dev server

# Get the project root directory (parent of scripts directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $projectRoot "frontend"

# Change to frontend directory
Set-Location $frontendDir

# Add Node.js to PATH for this session
$env:Path = "C:\Program Files\nodejs;" + $env:Path

# Now npm and node should work
npm run dev
