"""
File Upload API Endpoints

Handles file uploads for yarn and project images.
Files are stored locally in the uploads directory.
"""

import os
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from typing import List

router = APIRouter(prefix="/upload", tags=["upload"])

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Allowed image file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a single image file.
    
    Returns the URL path to access the uploaded image.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Generate unique filename to avoid conflicts
    file_ext = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Return the URL path (relative to the API base)
        # The frontend will need to construct the full URL
        return JSONResponse({
            "url": f"/uploads/{unique_filename}",
            "filename": unique_filename
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@router.post("/images")
async def upload_images(files: List[UploadFile] = File(...)):
    """
    Upload multiple image files.
    
    Returns a list of URL paths to access the uploaded images.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    uploaded_urls = []
    
    for file in files:
        if not file.filename:
            continue
        
        if not is_allowed_file(file.filename):
            continue  # Skip invalid files
        
        # Generate unique filename
        file_ext = Path(file.filename).suffix.lower()
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOADS_DIR / unique_filename
        
        # Save file
        try:
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
            
            uploaded_urls.append({
                "url": f"/uploads/{unique_filename}",
                "filename": unique_filename
            })
        except Exception as e:
            # Log error but continue with other files
            print(f"Error saving file {file.filename}: {e}")
    
    if not uploaded_urls:
        raise HTTPException(status_code=400, detail="No valid files were uploaded")
    
    return JSONResponse({"urls": uploaded_urls})
