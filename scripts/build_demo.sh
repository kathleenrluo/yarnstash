#!/bin/bash
# Build script for demo deployment
# Builds frontend and prepares for Railway deployment

set -e

echo "Building frontend for demo..."
cd frontend
npm install
VITE_DEMO_MODE=true npm run build
cd ..

echo "Preparing demo database..."
cd backend
python utilities/prepare_demo_db.py
cd ..

echo "Build complete! Frontend built to frontend/dist"
echo "Demo database prepared at backend/yarn_stash_demo.db"
