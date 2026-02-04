"""
Tests for Yarn API endpoints.

These tests verify that the API endpoints correctly:
- Handle valid requests
- Reject duplicate yarns
- Return proper error codes
"""

import pytest
from app.services.yarn_service import YarnService


class TestYarnAPI:
    """Test suite for Yarn API endpoints."""
    
    def test_create_yarn_success(self, client, sample_yarn_data):
        """Test successfully creating a yarn via API."""
        response = client.post("/yarns/", json=sample_yarn_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["brand_name"] == sample_yarn_data["brand_name"]
        assert data["yarn_name"] == sample_yarn_data["yarn_name"]
        assert data["color_name"] == sample_yarn_data["color_name"]
        assert "id" in data
    
    def test_create_duplicate_yarn_rejects(self, client, db, sample_yarn_data):
        """Test that creating a duplicate yarn via API returns 400."""
        # Create first yarn
        YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Try to create duplicate via API
        response = client.post("/yarns/", json=sample_yarn_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_create_yarn_missing_required_field(self, client, sample_yarn_data):
        """Test that missing required fields return 422."""
        # Remove required field
        incomplete_data = sample_yarn_data.copy()
        del incomplete_data["brand_name"]
        
        response = client.post("/yarns/", json=incomplete_data)
        
        assert response.status_code == 422
        # Pydantic validation error
        detail = response.json()["detail"]
        assert any("brand_name" in str(err.get("loc", [])) for err in detail)
    
    def test_create_yarn_invalid_grams_per_skein(self, client, sample_yarn_data):
        """Test that negative grams_per_skein is rejected."""
        invalid_data = sample_yarn_data.copy()
        invalid_data["grams_per_skein"] = -10.0
        
        response = client.post("/yarns/", json=invalid_data)
        
        assert response.status_code == 422
        # Pydantic validation error for gt=0 constraint
    
    def test_create_yarn_zero_grams_per_skein(self, client, sample_yarn_data):
        """Test that zero grams_per_skein is rejected."""
        invalid_data = sample_yarn_data.copy()
        invalid_data["grams_per_skein"] = 0.0
        
        response = client.post("/yarns/", json=invalid_data)
        
        assert response.status_code == 422
        # Pydantic validation error for gt=0 constraint
