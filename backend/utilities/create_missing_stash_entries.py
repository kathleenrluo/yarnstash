"""
Migration Script: Create Missing Stash Entries (per user)

Creates stash entries (with 0g) for yarns that don't have one, scoped by user.
Usage:
  python utilities/create_missing_stash_entries.py
      → run for every user that has yarns
  python utilities/create_missing_stash_entries.py --email user@example.com
      → run only for that user (must exist in users table)
"""

import argparse
import sys
from pathlib import Path
from typing import Optional

BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.models.database import SessionLocal
from app.models.user import User
from app.models.yarn import Yarn
from app.models.stash import StashEntry
from app.services.stash_service import StashService


def create_missing_stash_entries_for_user(db, user_id: int, user_email: str) -> int:
    """Create stash entries for all yarns of one user that don't have one. Returns count created."""
    yarns = db.query(Yarn).filter(Yarn.user_id == user_id).all()
    existing_yarn_ids = {e.yarn_id for e in db.query(StashEntry).filter(StashEntry.yarn_id.in_([y.id for y in yarns])).all()}
    missing = [y for y in yarns if y.id not in existing_yarn_ids]
    created = 0
    for yarn in missing:
        try:
            StashService.get_or_create_stash_entry(db, user_id, yarn.id)
            created += 1
            print(f"  Created stash for yarn {yarn.id}: {yarn.brand_name} {yarn.yarn_name} - {yarn.color_name}")
        except Exception as e:
            print(f"  [ERROR] yarn {yarn.id}: {e}")
    if created:
        db.commit()
    return created


def create_missing_stash_entries(email: Optional[str] = None):
    """Create stash entries for yarns that don't have one. Scoped by user(s)."""
    db = SessionLocal()
    try:
        if email:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"[ERROR] User not found: {email}")
                return
            print(f"User: {user.email} (id={user.id})")
            count = create_missing_stash_entries_for_user(db, user.id, user.email)
            print(f"[OK] Created {count} stash entries for {user.email}")
            return
        # All users that have yarns
        user_ids = db.query(Yarn.user_id).distinct().all()
        user_ids = [u[0] for u in user_ids if u[0] is not None]
        if not user_ids:
            print("No users with yarns found.")
            return
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        total = 0
        for u in users:
            print(f"User: {u.email} (id={u.id})")
            total += create_missing_stash_entries_for_user(db, u.id, u.email)
        print(f"[OK] Created {total} stash entries across {len(users)} user(s)")
    except Exception as e:
        print(f"[ERROR] {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create missing stash entries (per user)")
    parser.add_argument("--email", type=str, help="Run only for this user email")
    args = parser.parse_args()
    print("Creating missing stash entries...")
    print("=" * 50)
    create_missing_stash_entries(email=args.email)
    print("=" * 50)
    print("Done!")
