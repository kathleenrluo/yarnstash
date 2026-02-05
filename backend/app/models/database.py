"""
Database Configuration and Session Management

This module sets up SQLAlchemy database connection and session management.
Uses SQLite for local development, can be easily switched to PostgreSQL later.
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

# Always use the same database file
# DEMO_MODE now only controls read-only behavior, not which database to use
DB_FILENAME = "yarn_stash.db"
DB_PATH = BACKEND_DIR / DB_FILENAME
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create database engine
# connect_args needed for SQLite to allow multiple threads
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite-specific setting
)

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
