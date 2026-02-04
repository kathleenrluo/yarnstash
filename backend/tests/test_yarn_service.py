"""
Tests for YarnService.

These tests cover:
- Creating yarns
- Duplicate yarn detection
- Edge cases
"""

import pytest
from app.services.yarn_service import YarnService


class TestYarnService:
    """Test suite for YarnService."""
    
    def test_create_yarn_success(self, db, sample_yarn_data):
        """Test successfully creating a yarn."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        assert yarn is not None
        assert yarn.id is not None
        assert yarn.brand_name == sample_yarn_data["brand_name"]
        assert yarn.yarn_name == sample_yarn_data["yarn_name"]
        assert yarn.color_name == sample_yarn_data["color_name"]
    
    def test_create_duplicate_yarn_rejects(self, db, sample_yarn_data):
        """Test that creating a duplicate yarn (same brand, name, color) is rejected."""
        # Create first yarn
        YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Try to create duplicate
        with pytest.raises(ValueError) as exc_info:
            YarnService.create_yarn(db=db, **sample_yarn_data)
        
        assert "already exists" in str(exc_info.value).lower()
        assert sample_yarn_data["brand_name"] in str(exc_info.value)
        assert sample_yarn_data["yarn_name"] in str(exc_info.value)
        assert sample_yarn_data["color_name"] in str(exc_info.value)
    
    def test_create_yarn_different_color_allowed(self, db, sample_yarn_data):
        """Test that same brand/name with different color is allowed."""
        # Create first yarn
        yarn1 = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Create yarn with different color (should be allowed)
        yarn2_data = sample_yarn_data.copy()
        yarn2_data["color_name"] = "Different Color"
        yarn2 = YarnService.create_yarn(db=db, **yarn2_data)
        
        assert yarn1.id != yarn2.id
        assert yarn1.color_name != yarn2.color_name
        assert yarn1.brand_name == yarn2.brand_name
        assert yarn1.yarn_name == yarn2.yarn_name
    
    def test_create_yarn_different_brand_allowed(self, db, sample_yarn_data):
        """Test that same name/color with different brand is allowed."""
        # Create first yarn
        yarn1 = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Create yarn with different brand (should be allowed)
        yarn2_data = sample_yarn_data.copy()
        yarn2_data["brand_name"] = "Different Brand"
        yarn2 = YarnService.create_yarn(db=db, **yarn2_data)
        
        assert yarn1.id != yarn2.id
        assert yarn1.brand_name != yarn2.brand_name
    
    def test_create_yarn_different_name_allowed(self, db, sample_yarn_data):
        """Test that same brand/color with different yarn name is allowed."""
        # Create first yarn
        yarn1 = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Create yarn with different name (should be allowed)
        yarn2_data = sample_yarn_data.copy()
        yarn2_data["yarn_name"] = "Different Yarn Name"
        yarn2 = YarnService.create_yarn(db=db, **yarn2_data)
        
        assert yarn1.id != yarn2.id
        assert yarn1.yarn_name != yarn2.yarn_name
    
    def test_create_duplicate_yarn_case_sensitive(self, db, sample_yarn_data):
        """Test that duplicate checking is case-sensitive."""
        # Create first yarn
        YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Try to create with different case (should be allowed for now)
        # Note: This tests current behavior. If you want case-insensitive checking,
        # you would need to modify the duplicate check to use .lower()
        yarn2_data = sample_yarn_data.copy()
        yarn2_data["brand_name"] = sample_yarn_data["brand_name"].upper()
        yarn2_data["yarn_name"] = sample_yarn_data["yarn_name"].upper()
        yarn2_data["color_name"] = sample_yarn_data["color_name"].upper()
        
        # This should succeed because it's technically different (case-sensitive)
        yarn2 = YarnService.create_yarn(db=db, **yarn2_data)
        assert yarn2 is not None
