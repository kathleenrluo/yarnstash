"""
Main FastAPI Application

This is the entry point for the Yarn Stash Tracker backend API.
All routes are registered here, and the database is initialized.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os
from app.models.database import init_db
from app.api import yarns, stash, projects, options, upload

# Create FastAPI application instance
app = FastAPI(
    title="Yarn Stash Tracker API",
    description="Backend API for tracking yarn stash and crochet/knit projects",
    version="1.0.0",
    redirect_slashes=False,  # Prevent automatic redirects that can break CORS
)

# Check if we're in production/demo mode (serving static files)
SERVE_STATIC = os.getenv("SERVE_STATIC", "false").lower() == "true"

# Configure CORS (Cross-Origin Resource Sharing)
# This allows the React frontend to communicate with the backend
# IMPORTANT: CORS middleware must be added BEFORE other middleware and routes
cors_origins = [
    "http://localhost:3000",  # React default port
    "http://localhost:5173",  # Vite default port
    "http://localhost:5174",  # Vite alternate port
    "http://localhost:5175",  # Vite alternate port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

# Add Railway domain if SERVE_STATIC is true (production)
if SERVE_STATIC:
    railway_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
    if railway_domain:
        cors_origins.append(f"https://{railway_domain}")
    # Allow all origins in production for simplicity
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

# Serve static frontend files in production/demo mode
if SERVE_STATIC:
    # Path to built frontend
    # In Docker: __file__ is /app/backend/app/main.py, so we go up to /app, then to frontend/dist
    # Locally: __file__ is backend/app/main.py, so we go up to root, then to frontend/dist
    backend_dir = Path(__file__).parent.parent  # backend/
    project_root = backend_dir.parent  # project root
    frontend_dist = project_root / "frontend" / "dist"
    frontend_public = project_root / "frontend" / "public"
    
    # Debug: print the path
    print(f"Frontend dist path: {frontend_dist}")
    print(f"Frontend dist exists: {frontend_dist.exists()}")
    if frontend_dist.exists():
        print(f"Files in dist: {list(frontend_dist.glob('*'))[:10]}")
    
    if frontend_dist.exists():
        # Mount static files
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
        
        # Serve static files from dist root and SPA routing
        # This must be registered LAST so API routes take precedence
        # Vite copies public/ files to dist/ root during build
        @app.get("/{full_path:path}")
        async def serve_static_or_spa(full_path: str):
            # Don't serve for API routes (these are handled by routers above)
            api_paths = ("api", "yarns", "stash", "projects", "options", "upload", "docs", "redoc", "openapi.json", "uploads", "assets", "health")
            first_segment = full_path.split("/")[0] if full_path else ""
            if first_segment in api_paths:
                return {"error": "Not found"}
            
            # Check if it's a static file in dist root (like carousel-1.JPG, about-me.JPG, vite.svg)
            # IMPORTANT: Check for files FIRST before falling back to index.html
            if full_path:
                static_file_path = frontend_dist / full_path
                print(f"[STATIC FILE CHECK] Request: {full_path}, Path: {static_file_path}, Exists: {static_file_path.exists()}")
                
                if static_file_path.exists() and static_file_path.is_file():
                    # Verify it's actually a file and get its size
                    file_size = static_file_path.stat().st_size
                    print(f"[FILE INFO] {full_path}: size={file_size} bytes, is_file={static_file_path.is_file()}")
                    
                    # Determine media type based on file extension (case-insensitive)
                    file_ext = Path(full_path).suffix.lower()
                    media_type = None
                    if file_ext in ('.jpg', '.jpeg'):
                        media_type = 'image/jpeg'
                    elif file_ext == '.png':
                        media_type = 'image/png'
                    elif file_ext == '.gif':
                        media_type = 'image/gif'
                    elif file_ext == '.webp':
                        media_type = 'image/webp'
                    elif file_ext == '.svg':
                        media_type = 'image/svg+xml'
                    
                    if not media_type:
                        print(f"[WARNING] No media type for {full_path} with extension {file_ext}")
                    
                    print(f"[SERVING FILE] {full_path} as {media_type or 'application/octet-stream'}, size={file_size}")
                    # Always set media_type to ensure browser recognizes it as an image
                    return FileResponse(
                        str(static_file_path), 
                        media_type=media_type or 'application/octet-stream',
                        headers={"Content-Length": str(file_size)}
                    )
                else:
                    # If it looks like a file request (has extension) but file doesn't exist, return 404
                    # Don't serve index.html for missing files
                    if '.' in full_path and '/' not in full_path.split('.')[-1]:  # Has file extension
                        print(f"[FILE NOT FOUND] {full_path} - returning 404")
                        return {"error": "File not found"}, 404
            
            # Only serve index.html for routes that don't look like file requests (SPA routing)
            # This handles client-side routing - all non-API, non-file routes should serve index.html
            print(f"[SPA ROUTING] Serving index.html for: {full_path or '(root)'}")
            index_path = frontend_dist / "index.html"
            if index_path.exists():
                return FileResponse(str(index_path))
            return {"error": "Frontend not built"}


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
