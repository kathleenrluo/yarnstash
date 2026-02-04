"""
Tests for StashService.

These tests cover:
- Adding yarn to stash (by grams and skeins)
- Using yarn from stash
- Setting stash quantity
- Edge cases (negative values, insufficient stash, non-existent yarns)
"""

import pytest
from app.services.stash_service import StashService
from app.services.yarn_service import YarnService
from app.models.stash import StashEntry


class TestStashService:
    """Test suite for StashService."""
    
    def test_add_yarn_by_grams_creates_new_entry(self, db, sample_yarn_data):
        """Test adding yarn creates a new stash entry if it doesn't exist."""
        # Create a yarn first
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Add yarn to stash
        stash_entry = StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=100.0)
        
        assert stash_entry is not None
        assert stash_entry.yarn_id == yarn.id
        assert stash_entry.total_grams_owned == 100.0
    
    def test_add_yarn_by_grams_adds_to_existing(self, db, sample_yarn_data):
        """Test adding yarn to existing stash entry increases quantity."""
        # Create yarn and initial stash entry
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=100.0)
        
        # Add more yarn
        stash_entry = StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=50.0)
        
        assert stash_entry.total_grams_owned == 150.0
    
    def test_add_yarn_by_grams_rejects_negative(self, db, sample_yarn_data):
        """Test that negative grams are rejected."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        with pytest.raises(ValueError, match="Grams must be positive"):
            StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=-10.0)
    
    def test_add_yarn_by_grams_rejects_zero(self, db, sample_yarn_data):
        """Test that zero grams are handled (edge case)."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        # Zero should be allowed (though not very useful)
        stash_entry = StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=0.0)
        assert stash_entry.total_grams_owned == 0.0
    
    def test_add_yarn_by_grams_nonexistent_yarn(self, db):
        """Test adding yarn for non-existent yarn ID."""
        with pytest.raises(ValueError, match="does not exist"):
            StashService.add_yarn_by_grams(db=db, yarn_id=99999, grams=100.0)
    
    def test_add_yarn_by_skeins_calculates_correctly(self, db, sample_yarn_data):
        """Test adding by skeins calculates grams correctly."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        stash_entry = StashService.add_yarn_by_skeins(db=db, yarn_id=yarn.id, num_skeins=2)
        
        # 2 skeins * 100g per skein = 200g
        assert stash_entry.total_grams_owned == 200.0
    
    def test_add_yarn_by_skeins_rejects_negative(self, db, sample_yarn_data):
        """Test that negative skeins are rejected."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        with pytest.raises(ValueError, match="Number of skeins must be positive"):
            StashService.add_yarn_by_skeins(db=db, yarn_id=yarn.id, num_skeins=-1)
    
    def test_use_yarn_deducts_correctly(self, db, sample_yarn_data):
        """Test using yarn deducts from stash correctly."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=200.0)
        
        stash_entry = StashService.use_yarn(db=db, yarn_id=yarn.id, grams=50.0)
        
        assert stash_entry.total_grams_owned == 150.0
    
    def test_use_yarn_rejects_insufficient_stash(self, db, sample_yarn_data):
        """Test that using more yarn than available is rejected."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=100.0)
        
        with pytest.raises(ValueError, match="Insufficient stash"):
            StashService.use_yarn(db=db, yarn_id=yarn.id, grams=150.0)
    
    def test_use_yarn_rejects_nonexistent_stash(self, db, sample_yarn_data):
        """Test that using yarn from non-existent stash entry is rejected."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        with pytest.raises(ValueError, match="No stash entry found"):
            StashService.use_yarn(db=db, yarn_id=yarn.id, grams=50.0)
    
    def test_use_yarn_rejects_negative(self, db, sample_yarn_data):
        """Test that negative grams are rejected when using yarn."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=100.0)
        
        with pytest.raises(ValueError, match="Grams must be positive"):
            StashService.use_yarn(db=db, yarn_id=yarn.id, grams=-10.0)
    
    def test_set_stash_quantity_sets_absolute_value(self, db, sample_yarn_data):
        """Test setting stash quantity sets absolute value, not relative."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=200.0)
        
        # Set to 50g (should be 50g, not 250g)
        stash_entry = StashService.set_stash_quantity(db=db, yarn_id=yarn.id, grams=50.0)
        
        assert stash_entry.total_grams_owned == 50.0
    
    def test_set_stash_quantity_creates_entry_if_needed(self, db, sample_yarn_data):
        """Test setting quantity creates stash entry if it doesn't exist."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        stash_entry = StashService.set_stash_quantity(db=db, yarn_id=yarn.id, grams=75.0)
        
        assert stash_entry is not None
        assert stash_entry.total_grams_owned == 75.0
    
    def test_set_stash_quantity_rejects_negative(self, db, sample_yarn_data):
        """Test that negative quantities are rejected."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        with pytest.raises(ValueError, match="Grams cannot be negative"):
            StashService.set_stash_quantity(db=db, yarn_id=yarn.id, grams=-10.0)
    
    def test_set_stash_quantity_allows_zero(self, db, sample_yarn_data):
        """Test that zero quantity is allowed."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=100.0)
        
        stash_entry = StashService.set_stash_quantity(db=db, yarn_id=yarn.id, grams=0.0)
        
        assert stash_entry.total_grams_owned == 0.0
    
    def test_get_stash_entry_returns_none_when_not_found(self, db):
        """Test getting non-existent stash entry returns None."""
        stash_entry = StashService.get_stash_entry(db=db, yarn_id=99999)
        assert stash_entry is None
    
    def test_get_or_create_stash_entry_creates_when_missing(self, db, sample_yarn_data):
        """Test get_or_create creates entry when it doesn't exist."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        
        stash_entry = StashService.get_or_create_stash_entry(db=db, yarn_id=yarn.id)
        
        assert stash_entry is not None
        assert stash_entry.total_grams_owned == 0.0
    
    def test_get_or_create_stash_entry_returns_existing(self, db, sample_yarn_data):
        """Test get_or_create returns existing entry when it exists."""
        yarn = YarnService.create_yarn(db=db, **sample_yarn_data)
        StashService.add_yarn_by_grams(db=db, yarn_id=yarn.id, grams=100.0)
        
        stash_entry = StashService.get_or_create_stash_entry(db=db, yarn_id=yarn.id)
        
        assert stash_entry.total_grams_owned == 100.0
