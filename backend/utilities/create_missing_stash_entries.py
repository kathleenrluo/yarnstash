"""
Migration Script: Create Missing Stash Entries

This script creates stash entries (with 0g) for all yarns that don't have one.
Run this after updating the code to ensure every yarn has a stash entry.
"""

import sys
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.models.database import SessionLocal
from app.models.yarn import Yarn
from app.models.stash import StashEntry
from app.services.stash_service import StashService

def create_missing_stash_entries():
    """Create stash entries for all yarns that don't have one."""
    db = SessionLocal()
    
    try:
        # Get all yarns
        all_yarns = db.query(Yarn).all()
        print(f"Found {len(all_yarns)} total yarns")
        
        # Get all existing stash entries
        existing_stash_yarn_ids = {entry.yarn_id for entry in db.query(StashEntry).all()}
        print(f"Found {len(existing_stash_yarn_ids)} existing stash entries")
        
        # Find yarns without stash entries
        missing_stash_yarns = [yarn for yarn in all_yarns if yarn.id not in existing_stash_yarn_ids]
        print(f"Found {len(missing_stash_yarns)} yarns without stash entries")
        
        if not missing_stash_yarns:
            print("[OK] All yarns already have stash entries!")
            return
        
        # Create stash entries for missing yarns
        created_count = 0
        for yarn in missing_stash_yarns:
            try:
                stash_entry = StashService.get_or_create_stash_entry(db, yarn.id)
                created_count += 1
                print(f"  Created stash entry for yarn {yarn.id}: {yarn.brand_name} {yarn.yarn_name} - {yarn.color_name}")
            except Exception as e:
                print(f"  [ERROR] Failed to create stash entry for yarn {yarn.id}: {e}")
        
        db.commit()
        print(f"\n[OK] Successfully created {created_count} stash entries")
        
    except Exception as e:
        print(f"[ERROR] Failed to create missing stash entries: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Creating missing stash entries...")
    print("=" * 50)
    create_missing_stash_entries()
    print("=" * 50)
    print("Done!")
