"""
Cleanup Orphaned Files Script

This script finds and deletes image/video files in the uploads directory
that are not referenced in the database.

Run this script from the project root directory:
    python backend/cleanup_orphaned_files.py
    
Or from the backend directory:
    python cleanup_orphaned_files.py

To actually delete files (not just preview), add --delete flag:
    python backend/cleanup_orphaned_files.py --delete
"""

import os
import json
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.database import SessionLocal, init_db
from app.models.yarn import Yarn
from app.models.project import Project

# Uploads directory path
UPLOADS_DIR = Path(__file__).parent / "uploads"

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".avi"}


def get_all_referenced_files(db: Session) -> set:
    """
    Get all file paths that are referenced in the database.
    
    Returns:
        Set of filenames (without path) that are referenced
    """
    referenced = set()
    
    # Get all yarn photo URLs
    yarns = db.query(Yarn).all()
    for yarn in yarns:
        if yarn.yarn_photo_url:
            filename = extract_filename(yarn.yarn_photo_url)
            if filename:
                referenced.add(filename)
        if yarn.label_photo_url:
            filename = extract_filename(yarn.label_photo_url)
            if filename:
                referenced.add(filename)
    
    # Get all project image and video URLs
    projects = db.query(Project).all()
    for project in projects:
        if project.image_urls:
            # image_urls is a JSON array
            if isinstance(project.image_urls, str):
                # Handle string JSON
                try:
                    image_urls = json.loads(project.image_urls)
                except:
                    image_urls = []
            else:
                image_urls = project.image_urls or []
            
            for url in image_urls:
                filename = extract_filename(url)
                if filename:
                    referenced.add(filename)
        
        if project.video_urls:
            # video_urls is a JSON array
            if isinstance(project.video_urls, str):
                # Handle string JSON
                try:
                    video_urls = json.loads(project.video_urls)
                except:
                    video_urls = []
            else:
                video_urls = project.video_urls or []
            
            for url in video_urls:
                filename = extract_filename(url)
                if filename:
                    referenced.add(filename)
    
    return referenced


def extract_filename(url: str) -> str:
    """
    Extract filename from a URL or path.
    
    Examples:
        "/uploads/abc123.jpg" -> "abc123.jpg"
        "http://localhost:8000/uploads/abc123.jpg" -> "abc123.jpg"
        "abc123.jpg" -> "abc123.jpg"
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


def find_orphaned_files(db: Session) -> list:
    """
    Find all files in uploads directory that are not referenced in the database.
    
    Returns:
        List of Path objects for orphaned files
    """
    if not UPLOADS_DIR.exists():
        print(f"Uploads directory does not exist: {UPLOADS_DIR}")
        return []
    
    # Get all referenced files
    referenced = get_all_referenced_files(db)
    print(f"Found {len(referenced)} referenced files in database")
    
    # Find all files in uploads directory
    all_files = []
    for file_path in UPLOADS_DIR.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in ALLOWED_EXTENSIONS:
            all_files.append(file_path)
    
    print(f"Found {len(all_files)} files in uploads directory")
    
    # Find orphaned files
    orphaned = []
    for file_path in all_files:
        filename = file_path.name
        if filename not in referenced:
            orphaned.append(file_path)
    
    return orphaned


def delete_orphaned_files(dry_run: bool = True):
    """
    Find and delete orphaned files.
    
    Args:
        dry_run: If True, only report what would be deleted without actually deleting
    """
    # Initialize database
    init_db()
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Find orphaned files
        orphaned = find_orphaned_files(db)
        
        if not orphaned:
            print("\n[SUCCESS] No orphaned files found! All files are referenced in the database.")
            return
        
        print(f"\n{'Would delete' if dry_run else 'Deleting'} {len(orphaned)} orphaned file(s):")
        print("-" * 60)
        
        total_size = 0
        for file_path in orphaned:
            size = file_path.stat().st_size
            total_size += size
            size_mb = size / (1024 * 1024)
            print(f"  {file_path.name} ({size_mb:.2f} MB)")
        
        print("-" * 60)
        total_mb = total_size / (1024 * 1024)
        print(f"Total size: {total_mb:.2f} MB")
        
        if dry_run:
            print("\n[DRY RUN] - No files were deleted.")
            print("Run with --delete flag to actually delete these files:")
            print("  python cleanup_orphaned_files.py --delete")
        else:
            # Actually delete the files
            deleted_count = 0
            for file_path in orphaned:
                try:
                    file_path.unlink()
                    deleted_count += 1
                except Exception as e:
                    print(f"  [ERROR] Error deleting {file_path.name}: {e}")
            
            print(f"\n[SUCCESS] Successfully deleted {deleted_count} of {len(orphaned)} orphaned file(s)")
    
    finally:
        db.close()


if __name__ == "__main__":
    import sys
    
    # Check for --delete flag
    dry_run = "--delete" not in sys.argv
    auto_confirm = "--yes" in sys.argv or "-y" in sys.argv
    
    if not dry_run and not auto_confirm:
        # Confirm deletion
        print("[WARNING] This will permanently delete orphaned files!")
        try:
            response = input("Are you sure you want to continue? (yes/no): ")
            if response.lower() != "yes":
                print("Cancelled.")
                sys.exit(0)
        except (EOFError, KeyboardInterrupt):
            print("\nCancelled.")
            sys.exit(0)
    
    delete_orphaned_files(dry_run=dry_run)
