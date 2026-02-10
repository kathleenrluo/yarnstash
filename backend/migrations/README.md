# Database migrations

## copy_sqlite_to_postgres.py

One-off script to copy data from local SQLite (`backend/yarn_stash.db`) into PostgreSQL (e.g. Railway).

**When to use:** You have an existing SQLite database and want to move to Postgres. Run once from the `backend` directory:

```bash
python migrations/copy_sqlite_to_postgres.py "postgresql://user:pass@host:port/dbname"
```

See project README and `docs/RAILWAY_POSTGRES_LOCAL_COPY.md` for details.

## Schema

New databases (SQLite or Postgres) get their schema from the app: `init_db()` in `app/main.py` runs `Base.metadata.create_all(bind=engine)` on startup, so tables match the current models. No migration runner is required for new installs.
