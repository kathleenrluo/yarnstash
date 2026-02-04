"""
Main FastAPI Application

This is the entry point for the Yarn Stash Tracker backend API.
All routes are registered here, and the database is initialized.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.models.database import init_db
from app.api import yarns, stash, projects, options, upload

# Create FastAPI application instance
app = FastAPI(
    title="Yarn Stash Tracker API",
    description="Backend API for tracking yarn stash and crochet/knit projects",
    version="1.0.0",
    redirect_slashes=False,  # Prevent automatic redirects that can break CORS
)

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the React frontend to communicate with the backend
# IMPORTANT: CORS middleware must be added BEFORE other middleware and routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React default port
        "http://localhost:5173",  # Vite default port
        "http://localhost:5174",  # Vite alternate port
        "http://localhost:5175",  # Vite alternate port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Include PATCH
    allow_headers=["*"],   # Allow all headers
    expose_headers=["*"],  # Expose all headers in response
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Register API routers
# Each router handles a specific domain (yarns, stash, projects, options, upload)
app.include_router(yarns.router)
app.include_router(stash.router)
app.include_router(projects.router)
app.include_router(options.router)
app.include_router(upload.router)

# Serve uploaded files statically
# Create uploads directory if it doesn't exist
# Path: backend/uploads (relative to backend/app/main.py)
uploads_dir = Path(__file__).parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)

# Mount static files for uploads
# This allows the frontend to access uploaded images via /uploads/filename
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.on_event("startup")
async def startup_event():
    """
    Initialize database on application startup.
    
    This creates all database tables if they don't exist.
    In production, use Alembic migrations instead.
    """
    init_db()
    print("Database initialized")


@app.get("/")
async def root():
    """
    Root endpoint - API information.
    """
    return {
        "message": "Yarn Stash Tracker API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "yarns": "/yarns",
            "stash": "/stash",
            "projects": "/projects",
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Useful for monitoring and ensuring the API is running.
    """
    return {"status": "healthy"}
