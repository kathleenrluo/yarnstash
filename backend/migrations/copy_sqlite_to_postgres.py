"""
One-off: Copy data from local SQLite to PostgreSQL (e.g. Railway).

Run this ONCE to populate your Railway (or other) Postgres with data from
your local yarn_stash.db. You do NOT need DATABASE_URL in .env for normal
local dev (the app uses SQLite when DATABASE_URL is unset).

Usage (pick one):
  # Pass the Postgres URL on the command line (no need to put it in .env):
  python migrations/copy_sqlite_to_postgres.py "postgresql://user:pass@host:5432/dbname"

  # Or set DATABASE_URL in .env and run:
  python migrations/copy_sqlite_to_postgres.py

What it does:
  - Reads from backend/yarn_stash.db (SQLite)
  - Creates tables in PostgreSQL if they don't exist
  - Copies all rows from users, yarns, stash_entries, projects, project_yarn_usages
  - Updates PostgreSQL sequences so new rows get correct IDs

Do NOT run this if PostgreSQL already has data you care about (it will try to insert and may conflict).
"""

import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv()

# SQLite path (source)
DB_FILENAME = "yarn_stash.db"
SQLITE_PATH = backend_dir / DB_FILENAME

# PostgreSQL URL (destination): from first CLI arg, or from .env
if len(sys.argv) > 1:
    DATABASE_URL = sys.argv[1].strip()
else:
    DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: Give the Postgres URL as an argument, or set DATABASE_URL in .env.")
    print('  Example: python migrations/copy_sqlite_to_postgres.py "postgresql://user:pass@host:5432/railway"')
    sys.exit(1)
DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not SQLITE_PATH.exists():
    print(f"ERROR: SQLite database not found at {SQLITE_PATH}")
    sys.exit(1)

from sqlalchemy import create_engine, text, insert
from sqlalchemy.orm import sessionmaker

# Import models so we can use them and create tables
from app.models.database import Base
from app.models.user import User
from app.models.yarn import Yarn
from app.models.stash import StashEntry
from app.models.project import Project, ProjectYarnUsage

sqlite_url = f"sqlite:///{SQLITE_PATH}"
sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
pg_engine = create_engine(DATABASE_URL)

SqliteSession = sessionmaker(bind=sqlite_engine, autocommit=False, autoflush=False)
PgSession = sessionmaker(bind=pg_engine, autocommit=False, autoflush=False)

# Table order: respect foreign keys (users first, then yarns, stash_entries, projects, project_yarn_usages)
TABLES = [
    ("users", User),
    ("yarns", Yarn),
    ("stash_entries", StashEntry),
    ("projects", Project),
    ("project_yarn_usages", ProjectYarnUsage),
]


def get_sequence_name(table_name, pk_column="id"):
    """PostgreSQL default sequence name for a table's primary key."""
    return f"{table_name}_{pk_column}_seq"


def copy_table(table_name, model, sqlite_session, pg_session):
    """Copy all rows from SQLite table to PostgreSQL (same table name)."""
    rows = sqlite_session.query(model).order_by(model.id).all()
    if not rows:
        print(f"  {table_name}: 0 rows (skip)")
        return 0
    table = model.__table__
    for row in rows:
        row_dict = {c.key: getattr(row, c.key) for c in table.c}
        pg_session.execute(insert(table).values(**row_dict))
    pg_session.commit()
    count = len(rows)
    print(f"  {table_name}: {count} rows")
    return count


def update_sequence(pg_engine, table_name, pk_column="id"):
    """Set PostgreSQL sequence to max(id) so next insert gets a valid id."""
    try:
        seq = get_sequence_name(table_name, pk_column)
        with pg_engine.connect() as conn:
            conn.execute(text(
                f"SELECT setval(pg_get_serial_sequence(:t, :c), COALESCE((SELECT MAX({pk_column}) FROM {table_name}), 1))"
            ), {"t": table_name, "c": pk_column})
            conn.commit()
    except Exception as e:
        print(f"  (sequence update for {table_name}: {e})")


def main():
    print("Source: SQLite at", SQLITE_PATH)
    print("Target: PostgreSQL (from DATABASE_URL)")
    print()

    sqlite_session = SqliteSession()
    pg_session = PgSession()

    try:
        # Create all tables in Postgres (idempotent)
        print("Creating tables in PostgreSQL if not present...")
        Base.metadata.create_all(bind=pg_engine)
        print("Done.")
        print()

        # Copy data
        print("Copying data...")
        for table_name, model in TABLES:
            try:
                copy_table(table_name, model, sqlite_session, pg_session)
            except Exception as e:
                print(f"  ERROR copying {table_name}: {e}")
                pg_session.rollback()
                raise

        # Update sequences so future inserts get correct IDs
        print()
        print("Updating PostgreSQL sequences...")
        for table_name, _ in TABLES:
            update_sequence(pg_engine, table_name)
        print("Done.")

        print()
        print("Migration complete. Your PostgreSQL database is now populated.")
    finally:
        sqlite_session.close()
        pg_session.close()


if __name__ == "__main__":
    main()
