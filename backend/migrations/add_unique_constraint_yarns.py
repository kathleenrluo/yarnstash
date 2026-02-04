"""
Migration: Add unique constraint to prevent duplicate yarns

This script adds a unique constraint on (brand_name, yarn_name, color_name) 
to the yarns table to prevent duplicate yarn entries at the database level.

This provides an additional layer of protection beyond the service-level check.
"""

import sqlite3
import os

# Get the database path
# migrations is in backend/migrations, so go up one level to backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)  # backend/
db_path = os.path.join(backend_dir, 'yarn_stash.db')

def add_unique_constraint():
    """Add unique constraint to yarns table if it doesn't exist."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if constraint already exists by querying sqlite_master
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' 
            AND name='uq_yarn_brand_name_color'
        """)
        
        if cursor.fetchone():
            print("[INFO] Unique constraint 'uq_yarn_brand_name_color' already exists. Skipping migration.")
        else:
            # First, check for any existing duplicates
            cursor.execute("""
                SELECT brand_name, yarn_name, color_name, COUNT(*) as count
                FROM yarns
                GROUP BY brand_name, yarn_name, color_name
                HAVING count > 1
            """)
            duplicates = cursor.fetchall()
            
            if duplicates:
                print("[WARNING] Found duplicate yarns in the database:")
                for brand, name, color, count in duplicates:
                    print(f"  - '{brand} {name}' in color '{color}' appears {count} times")
                print("\n[INFO] Please resolve duplicates before adding the unique constraint.")
                print("[INFO] You can manually delete or merge duplicate entries.")
                print("[INFO] Migration aborted to prevent data loss.")
                conn.close()
                return
            
            print("Adding unique constraint to yarns table...")
            cursor.execute("""
                CREATE UNIQUE INDEX uq_yarn_brand_name_color 
                ON yarns(brand_name, yarn_name, color_name)
            """)
            conn.commit()
            print("[OK] Successfully added unique constraint 'uq_yarn_brand_name_color' to yarns table")
        
        conn.close()
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("[INFO] Unique constraint already exists. Skipping migration.")
        else:
            print(f"[ERROR] Failed to add unique constraint: {e}")
            if conn:
                conn.rollback()
                conn.close()
    except Exception as e:
        print(f"[ERROR] Failed to add unique constraint: {e}")
        if conn:
            conn.close()

if __name__ == "__main__":
    add_unique_constraint()
