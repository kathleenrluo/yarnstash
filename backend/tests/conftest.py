"""
Pytest configuration and shared fixtures for testing.

This file provides common fixtures used across all tests,
including database setup/teardown and test clients.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.models.database import Base, get_db
from app.main import app

# Use in-memory SQLite database for testing
# Using :memory: ensures no files are created on disk
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """
    Create a fresh database for each test.
    
    This ensures tests are isolated and don't affect each other.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a new session
    db_session = TestingSessionLocal()
    
    try:
        yield db_session
    finally:
        db_session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """
    Create a test client with a database dependency override.
    
    This allows us to use the test database instead of the real one.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_yarn_data():
    """Sample yarn data for testing."""
    return {
        "brand_name": "Test Brand",
        "yarn_name": "Test Yarn",
        "color_name": "Test Color",
        "yarn_weight": "DK",
        "grams_per_skein": 100.0,
        "meters_per_skein": 200.0,
        "generalized_colors": ["blue"],
        "material_breakdown": "80% acrylic 20% wool",
        "care_instruction_ids": [],
        "is_favorite": False,
    }
