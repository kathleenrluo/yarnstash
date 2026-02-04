"""
Script to add the materials column to the existing yarns table.

This is needed because SQLAlchemy's create_all() only creates tables,
it doesn't add columns to existing tables.
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect

# Adjust the path to import from the correct app directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
sys.path.insert(0, project_root)

from backend.app.models.database import DATABASE_URL

def add_materials_column():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        inspector = inspect(connection)
        columns = inspector.get_columns('yarns')
        column_names = [col['name'] for col in columns]

        if 'materials' not in column_names:
            print("Adding materials column to yarns table...")
            try:
                connection.execute(text("ALTER TABLE yarns ADD COLUMN materials TEXT"))
                connection.commit()
                print("[OK] Successfully added 'materials' column to yarns table")
            except Exception as e:
                print(f"[ERROR] Failed to add 'materials' column: {e}")
                connection.rollback()
        else:
            print("[INFO] 'materials' column already exists in yarns table. Skipping migration.")

if __name__ == "__main__":
    add_materials_column()
