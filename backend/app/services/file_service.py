"""
File Service

Handles file operations for uploaded images.
This includes deleting files from the uploads directory.
"""

import os
from pathlib import Path
from typing import List, Optional

# Uploads directory path (relative to this file)
# backend/app/services/file_service.py -> backend/uploads
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"


class FileService:
    """
    Service for managing uploaded files.
    
    Handles file deletion and cleanup operations.
    """
    
    @staticmethod
    def delete_file(filename: str) -> bool:
        """
        Delete a file from the uploads directory.
        
        Args:
            filename: The filename (e.g., "abc123.jpg" or "/uploads/abc123.jpg")
        
        Returns:
            True if file was deleted, False if not found or error
        """
        try:
            # Extract just the filename if a full path is provided
            if "/" in filename:
                filename = filename.split("/")[-1]
            
            file_path = UPLOADS_DIR / filename
            
            if file_path.exists():
                os.remove(file_path)
                return True
            else:
                # File doesn't exist, consider it already deleted
                return True
        except Exception as e:
            print(f"Error deleting file {filename}: {e}")
            return False
    
    @staticmethod
    def delete_files(filenames: List[str]) -> int:
        """
        Delete multiple files from the uploads directory.
        
        Args:
            filenames: List of filenames or URLs to delete
        
        Returns:
            Number of files successfully deleted
        """
        deleted_count = 0
        for filename in filenames:
            if FileService.delete_file(filename):
                deleted_count += 1
        return deleted_count
    
    @staticmethod
    def extract_filename_from_url(url: str) -> Optional[str]:
        """
        Extract filename from a URL.
        
        Examples:
        - "/uploads/abc123.jpg" -> "abc123.jpg"
        - "http://localhost:8000/uploads/abc123.jpg" -> "abc123.jpg"
        - "abc123.jpg" -> "abc123.jpg"
        
        Args:
            url: URL or path to the file
        
        Returns:
            Filename or None if unable to extract
        """
        if not url:
            return None
        
        # Remove protocol and domain if present
        if "://" in url:
            url = "/" + "/".join(url.split("://")[1].split("/")[1:])
        
        # Extract filename from path
        if "/" in url:
            filename = url.split("/")[-1]
        else:
            filename = url
        
        return filename if filename else None
