# Demo Deployment Guide

This guide explains how to deploy the read-only demo version to Railway.

## Prerequisites

1. Railway account (sign up at railway.app)
2. GitHub repository connected to Railway
3. Current database with data you want to show in demo

## Setup Steps

### 1. Prepare Demo Database

Before deploying, create a snapshot of your current database:

```powershell
cd backend
python utilities/prepare_demo_db.py
```

This creates `yarn_stash_demo.db` from your current database.

### 2. Build Frontend for Demo

Build the frontend with demo mode enabled:

```powershell
.\scripts\build_demo.ps1
```

Or manually:
```powershell
cd frontend
$env:VITE_DEMO_MODE="true"
npm run build
```

### 3. Deploy to Railway

1. Go to railway.app and create a new project
2. Connect your GitHub repository
3. Select the `demo` branch
4. Railway will automatically detect the build configuration

### 4. Configure Environment Variables

In Railway dashboard, add these environment variables:

- `SERVE_STATIC=true` - Enables serving frontend from backend
- `DEMO_MODE=true` - Uses demo database and enables read-only mode
- `PORT` - Railway sets this automatically

### 5. Deploy

Railway will automatically:
- Build the frontend (with demo mode)
- Install Python dependencies
- Start the FastAPI server
- Serve both API and frontend

## Updating Demo Data

To update the demo with new data:

1. Update your local database
2. Run `python backend/utilities/prepare_demo_db.py`
3. Commit and push the new `yarn_stash_demo.db`
4. Railway will redeploy automatically

## Notes

- The demo is read-only - no add/edit/delete functionality
- Demo banner appears at the top
- All write operations are disabled
- Database is included in the repository (it's read-only, so safe)
