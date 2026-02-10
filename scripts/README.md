# Scripts Directory

This directory contains convenience scripts for running the application.

## Available Scripts

- `START_ALL.ps1` - Starts both backend and frontend servers in separate windows
- `START_BACKEND.ps1` - Starts only the backend server
- `START_FRONTEND.ps1` - Starts only the frontend server
- `download-uploads-from-railway.ps1` - Download uploads from production (Railway volume) to `backend/uploads`
- `download-postgres-from-railway.ps1` - Dump production Postgres to `backend/railway-dump.sql` (requires pg_dump and Railway TCP Proxy URL)

## Usage

Run from the project root:
```powershell
.\scripts\START_ALL.ps1
```
