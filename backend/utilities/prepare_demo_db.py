"""
Prepare Demo Database

Copies the current database to a demo database file for deployment.
Run this script before deploying to create a snapshot of your current data.
"""

import shutil
from pathlib import Path

def prepare_demo_db():
    """Copy current database to demo database."""
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
    return True

if __name__ == "__main__":
    prepare_demo_db()
