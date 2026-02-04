"""
Migration: Add primary_image_index column to projects table

This script adds a 'primary_image_index' column to the projects table to allow users
to specify which image should be displayed as the primary/thumbnail image.
"""

import sqlite3
import os

# Get the database path
# migrations is in backend/migrations, so go up one level to backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # backend/
db_path = os.path.join(backend_dir, 'yarn_stash.db')

def add_primary_image_index_column():
    """Add primary_image_index column to projects table if it doesn't exist."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(projects)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'primary_image_index' not in columns:
            print("Adding primary_image_index column to projects table...")
            cursor.execute("ALTER TABLE projects ADD COLUMN primary_image_index INTEGER DEFAULT 0")
            conn.commit()
            print("[OK] Successfully added 'primary_image_index' column to projects table")
        else:
            print("[INFO] 'primary_image_index' column already exists in projects table. Skipping migration.")
        
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to add 'primary_image_index' column: {e}")
        if conn:
            conn.close()

if __name__ == "__main__":
    add_primary_image_index_column()
