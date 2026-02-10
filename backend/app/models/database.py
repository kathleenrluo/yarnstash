"""
Database Configuration and Session Management

This module sets up SQLAlchemy database connection and session management.
- If DATABASE_URL is set (e.g. postgresql://...): uses PostgreSQL (requires psycopg2-binary).
- If DATABASE_URL is not set: uses SQLite (backend/yarn_stash.db).
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database file location
# In production, this would be a PostgreSQL connection string
# Use absolute path to ensure database is always in backend directory
import os
from pathlib import Path

# Get the backend directory (parent of app/models)
BACKEND_DIR = Path(__file__).parent.parent.parent

# Use DATABASE_URL if set (e.g. PostgreSQL on Railway), otherwise SQLite
_env_url = os.getenv("DATABASE_URL")
if _env_url:
    SQLALCHEMY_DATABASE_URL = _env_url.replace("postgres://", "postgresql://", 1)  # Railway may give postgres://
    _connect_args = {}
else:
    DB_FILENAME = "yarn_stash.db"
    DB_PATH = BACKEND_DIR / DB_FILENAME
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    _connect_args = {"check_same_thread": False}  # SQLite-specific

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=_connect_args)

# Session factory - creates database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all database models
Base = declarative_base()


def get_db():
    """
    Dependency function for FastAPI to get database sessions.
    
    Yields a database session and ensures it's closed after use.
    This is the recommended pattern for FastAPI database access.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize the database by creating all tables.
    
    This should be called once when the application starts.
    In production, use Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)
