"""
Migration: Add manual_care_instruction_ids column to projects table

This script adds a 'manual_care_instruction_ids' JSON column to the projects table to allow users
to manually specify care instructions that override the computed care instructions from yarns.
"""

import sqlite3
import os

# Get the database path
# migrations is in backend/migrations, so go up one level to backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # backend/
db_path = os.path.join(backend_dir, 'yarn_stash.db')

def add_manual_care_instruction_ids_column():
    """Add manual_care_instruction_ids column to projects table if it doesn't exist."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(projects)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'manual_care_instruction_ids' not in columns:
            print("Adding manual_care_instruction_ids column to projects table...")
            cursor.execute("ALTER TABLE projects ADD COLUMN manual_care_instruction_ids TEXT")
            conn.commit()
            print("[OK] Successfully added 'manual_care_instruction_ids' column to projects table")
        else:
            print("[INFO] 'manual_care_instruction_ids' column already exists in projects table. Skipping migration.")
        
        conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to add 'manual_care_instruction_ids' column: {e}")
        if conn:
            conn.close()

if __name__ == "__main__":
    add_manual_care_instruction_ids_column()
