"""
Prepare Demo Database

Copies the current database to a demo database file for deployment.
Run this script before deploying to create a snapshot of your current data.
Also fixes all localhost URLs to relative paths.
"""

import shutil
from pathlib import Path
import sys

def prepare_demo_db():
    """Copy current database to demo database and fix URLs."""
    backend_dir = Path(__file__).parent.parent
    current_db = backend_dir / "yarn_stash.db"
    demo_db = backend_dir / "yarn_stash_demo.db"
    
    if not current_db.exists():
        print(f"Error: {current_db} not found!")
        return False
    
    # Copy database
    shutil.copy2(current_db, demo_db)
    print(f"Demo database prepared: {demo_db}")
    print(f"Database size: {demo_db.stat().st_size / 1024 / 1024:.2f} MB")
    
    # Fix URLs in the demo database
    print("\nFixing URLs in demo database...")
    try:
        from utilities.fix_demo_urls import update_demo_urls
        # Temporarily change DB_PATH in fix_demo_urls
        import utilities.fix_demo_urls as fix_module
        fix_module.DB_PATH = demo_db
        update_demo_urls()
    except Exception as e:
        print(f"Warning: Could not fix URLs: {e}")
        print("You may need to run fix_demo_urls.py separately")
    
    return True

if __name__ == "__main__":
    prepare_demo_db()
