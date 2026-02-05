"""
Initialize Empty Database

Creates an empty database with all tables but no data.
Use this for setting up a fresh installation.
"""

import os
import sys
from pathlib import Path

# Adjust the path to import from the correct app directory
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.insert(0, backend_dir)

from app.models.database import init_db, DB_PATH

def init_empty_database():
    """Initialize an empty database with all tables."""
    
    # Remove existing database if it exists
    if DB_PATH.exists():
        print(f"Removing existing database: {DB_PATH}")
        DB_PATH.unlink()
    
    # Initialize database (creates all tables)
    print(f"Initializing empty database at: {DB_PATH}")
    init_db()
    
    print(f"\n[OK] Empty database initialized successfully!")
    print(f"Database location: {DB_PATH}")
    print("\nYou can now:")
    print("- Start adding your own yarns and projects")
    print("- Or run 'python backend/utilities/insert_test_data.py' for sample data")

if __name__ == "__main__":
    init_empty_database()
