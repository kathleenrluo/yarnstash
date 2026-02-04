"""
Database Backup Utility

Creates a timestamped backup of the yarn_stash.db database file.
Run this before making major database changes.
"""

import shutil
from pathlib import Path
from datetime import datetime
import sys

# Get the backend directory
BACKEND_DIR = Path(__file__).parent.parent
DB_PATH = BACKEND_DIR / "yarn_stash.db"
BACKUP_DIR = BACKEND_DIR / "backups"

def backup_database():
    """Create a timestamped backup of the database."""
    if not DB_PATH.exists():
        print(f"[ERROR] Database file not found at {DB_PATH}")
        sys.exit(1)
    
    # Create backups directory if it doesn't exist
    BACKUP_DIR.mkdir(exist_ok=True)
    
    # Create timestamped backup filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"yarn_stash_backup_{timestamp}.db"
    backup_path = BACKUP_DIR / backup_filename
    
    try:
        # Copy database file
        shutil.copy2(DB_PATH, backup_path)
        print(f"[OK] Database backed up successfully!")
        print(f"     Source: {DB_PATH}")
        print(f"     Backup: {backup_path}")
        print(f"     Size: {backup_path.stat().st_size / 1024:.2f} KB")
        return backup_path
    except Exception as e:
        print(f"[ERROR] Failed to backup database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    backup_database()
