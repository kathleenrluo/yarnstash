"""
Clear Database Script

This script completely clears the database by dropping all tables
and recreating them fresh.

WARNING: This will delete ALL data in the database!
"""

import sys
import os
from pathlib import Path

# Add backend to path
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
project_root = backend_dir.parent
sys.path.insert(0, str(backend_dir))

from app.models.database import Base, engine, init_db
from app.models.yarn import Yarn
from app.models.stash import StashEntry
from app.models.project import Project, ProjectYarnUsage

def clear_database(auto_confirm=False):
    """Drop all tables and recreate them."""
    print("[WARNING] This will delete ALL data in the database!")
    print("All yarns, projects, and stash entries will be permanently deleted.")
    
    if not auto_confirm:
        try:
            response = input("Are you sure you want to continue? (yes/no): ")
            if response.lower() != "yes":
                print("Cancelled.")
                return
        except (EOFError, KeyboardInterrupt):
            print("\nCancelled.")
            return
    
    print("\nDropping all tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Recreating tables...")
    init_db()
    
    print("\n[SUCCESS] Database cleared and recreated!")
    print("You can now run insert_test_data.py to populate it with test data.")

if __name__ == "__main__":
    import sys
    auto_confirm = "--yes" in sys.argv or "-y" in sys.argv
    clear_database(auto_confirm=auto_confirm)
