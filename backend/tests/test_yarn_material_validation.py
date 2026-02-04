"""
Tests for material breakdown validation in yarn creation/update.

These tests verify that invalid material breakdowns are rejected
and valid ones are accepted.
"""

import pytest
from app.services.yarn_service import YarnService


class TestYarnMaterialValidation:
    """Test suite for material breakdown validation in yarn operations."""
    
    def test_create_yarn_with_valid_material_breakdown(self, db, sample_yarn_data):
        """Test creating yarn with valid material breakdown."""
        sample_yarn_data["material_breakdown"] = "80% merino wool 20% nylon"
        
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        assert yarn is not None
        assert yarn.material_breakdown == "80% merino wool 20% nylon"
        assert len(yarn.materials) > 0  # Should have parsed materials
    
    def test_create_yarn_with_empty_material_breakdown(self, db, sample_yarn_data):
        """Test creating yarn with empty material breakdown (should be allowed)."""
        sample_yarn_data["material_breakdown"] = None
        
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        assert yarn is not None
        assert yarn.material_breakdown is None
        assert yarn.materials == []
    
    def test_create_yarn_with_invalid_material_breakdown_no_letters(self, db, sample_yarn_data):
        """Test that material breakdown with no letters is rejected."""
        sample_yarn_data["material_breakdown"] = "80% 20%"
        
        with pytest.raises(ValueError) as exc_info:
            YarnService.create_yarn(db=db, **sample_yarn_data)
        
        assert "material" in str(exc_info.value).lower()
        assert "check" in str(exc_info.value).lower() or "try again" in str(exc_info.value).lower()
    
    def test_create_yarn_with_invalid_material_breakdown_unparseable(self, db, sample_yarn_data):
        """Test that unparseable material breakdown is rejected."""
        sample_yarn_data["material_breakdown"] = "xyz123"
        
        with pytest.raises(ValueError) as exc_info:
            YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Should fail either at validation or parsing stage
        error_msg = str(exc_info.value).lower()
        assert "material" in error_msg or "parse" in error_msg
    
    def test_update_yarn_with_valid_material_breakdown(self, db, sample_yarn_data):
        """Test updating yarn with valid material breakdown."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        updated = YarnService.update_yarn(
            db=db,
            yarn_id=yarn.id,
            material_breakdown="100% cotton"
        )
        
        assert updated is not None
        assert updated.material_breakdown == "100% cotton"
        assert len(updated.materials) > 0
    
    def test_update_yarn_with_invalid_material_breakdown(self, db, sample_yarn_data):
        """Test that updating with invalid material breakdown is rejected."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        with pytest.raises(ValueError) as exc_info:
            YarnService.update_yarn(
                db=db,
                yarn_id=yarn.id,
                material_breakdown="80% 20%"
            )
        
        assert "material" in str(exc_info.value).lower()
