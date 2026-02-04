"""
Migration: Add notes column to yarns table

This script adds a 'notes' column to the yarns table to allow users
to store additional notes about their yarns.
"""

import sqlite3
import os
import sys

# Get the database path
# migrations is in backend/migrations, so go up one level to backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # backend/
db_path = os.path.join(backend_dir, 'yarn_stash.db')

def add_notes_column():
    """Add notes column to yarns table if it doesn't exist."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(yarns)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'notes' in columns:
            print("[OK] Notes column already exists in yarns table")
            conn.close()
            return
        
        # Add the notes column
        cursor.execute("""
            ALTER TABLE yarns
            ADD COLUMN notes TEXT
        """)
        
        conn.commit()
        print("[OK] Successfully added 'notes' column to yarns table")
        conn.close()
        
    except sqlite3.Error as e:
        print(f"[ERROR] Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Adding notes column to yarns table...")
    add_notes_column()
    print("Migration complete!")
