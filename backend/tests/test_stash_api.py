"""
Tests for Stash API endpoints.

These tests verify that the API endpoints correctly:
- Handle valid requests
- Return proper error codes for invalid requests
- Validate input data
- Call the service layer correctly
"""

import pytest
from app.services.yarn_service import YarnService


class TestStashAPI:
    """Test suite for Stash API endpoints."""
    
    def test_get_all_stash_empty(self, client):
        """Test getting all stash when empty returns empty list."""
        response = client.get("/stash/")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_stash_entry_not_found(self, client):
        """Test getting non-existent stash entry returns 404."""
        response = client.get("/stash/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_add_yarn_by_grams_success(self, client, db, sample_yarn_data):
        """Test successfully adding yarn by grams."""
        # Create yarn first
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        response = client.post(
            "/stash/add/grams",
            json={"yarn_id": yarn.id, "grams": 100.0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["yarn_id"] == yarn.id
        assert data["total_grams_owned"] == 100.0
    
    def test_add_yarn_by_grams_invalid_yarn_id(self, client):
        """Test adding yarn with invalid yarn_id returns 400."""
        response = client.post(
            "/stash/add/grams",
            json={"yarn_id": 99999, "grams": 100.0}
        )
        
        assert response.status_code == 400
        assert "does not exist" in response.json()["detail"]
    
    def test_add_yarn_by_grams_negative_grams(self, client, db, sample_yarn_data):
        """Test adding negative grams returns 400."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        response = client.post(
            "/stash/add/grams",
            json={"yarn_id": yarn.id, "grams": -10.0}
        )
        
        assert response.status_code == 400
        assert "positive" in response.json()["detail"].lower()
    
    def test_add_yarn_by_grams_missing_fields(self, client):
        """Test missing required fields returns validation error."""
        response = client.post(
            "/stash/add/grams",
            json={"yarn_id": 1}  # Missing grams
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_add_yarn_by_skeins_success(self, client, db, sample_yarn_data):
        """Test successfully adding yarn by skeins."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        response = client.post(
            "/stash/add/skeins",
            json={"yarn_id": yarn.id, "num_skeins": 2}
        )
        
        assert response.status_code == 200
        data = response.json()
        # 2 skeins * 100g = 200g
        assert data["total_grams_owned"] == 200.0
    
    def test_use_yarn_success(self, client, db, sample_yarn_data):
        """Test successfully using yarn from stash."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        # Add yarn first
        client.post(
            "/stash/add/grams",
            json={"yarn_id": yarn.id, "grams": 200.0}
        )
        
        response = client.post(
            "/stash/use",
            json={"yarn_id": yarn.id, "grams": 50.0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_grams_owned"] == 150.0
    
    def test_use_yarn_insufficient_stash(self, client, db, sample_yarn_data):
        """Test using more yarn than available returns 400."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        client.post(
            "/stash/add/grams",
            json={"yarn_id": yarn.id, "grams": 100.0}
        )
        
        response = client.post(
            "/stash/use",
            json={"yarn_id": yarn.id, "grams": 150.0}
        )
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    def test_set_stash_quantity_success(self, client, db, sample_yarn_data):
        """Test successfully setting stash quantity."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        response = client.put(
            "/stash/set",
            json={"yarn_id": yarn.id, "grams": 75.0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_grams_owned"] == 75.0
    
    def test_set_stash_quantity_negative(self, client, db, sample_yarn_data):
        """Test setting negative quantity returns 400."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        response = client.put(
            "/stash/set",
            json={"yarn_id": yarn.id, "grams": -10.0}
        )
        
        assert response.status_code == 400
        assert "negative" in response.json()["detail"].lower()
