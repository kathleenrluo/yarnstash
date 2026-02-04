"""
Tests for ValidationService.

These tests verify that parsing validation correctly rejects invalid data.
"""

import pytest
from app.services.validation_service import ValidationService


class TestValidationService:
    """Test suite for ValidationService."""
    
    # ==================== Material Breakdown Validation ====================
    
    def test_validate_material_breakdown_empty(self):
        """Test that empty material breakdown is valid."""
        is_valid, error = ValidationService.validate_material_breakdown(None)
        assert is_valid is True
        assert error is None
        
        is_valid, error = ValidationService.validate_material_breakdown("")
        assert is_valid is True
        assert error is None
        
        is_valid, error = ValidationService.validate_material_breakdown("   ")
        assert is_valid is True
        assert error is None
    
    def test_validate_material_breakdown_valid(self):
        """Test that valid material breakdowns pass validation."""
        valid_inputs = [
            "80% merino wool 20% nylon",
            "50% mohair, 20% nylon, 30% cashmere",
            "100% acrylic",
            "merino, nylon",
            "wool",
            "80% Acrylic, 20% Wool",
        ]
        
        for input_str in valid_inputs:
            is_valid, error = ValidationService.validate_material_breakdown(input_str)
            assert is_valid is True, f"Should be valid: {input_str}"
            assert error is None
    
    def test_validate_material_breakdown_invalid_no_letters(self):
        """Test that material breakdown with no letters is rejected."""
        invalid_inputs = [
            "80% 20%",
            "100%",
            "50%, 30%",
            "123",
            "%%%",
        ]
        
        for input_str in invalid_inputs:
            is_valid, error = ValidationService.validate_material_breakdown(input_str)
            assert is_valid is False, f"Should be invalid: {input_str}"
            assert error is not None
            assert "material" in error.lower()
    
    def test_validate_material_breakdown_invalid_no_words(self):
        """Test that material breakdown with no valid words is rejected."""
        invalid_inputs = [
            "a",
            "x",
            "1% a",
        ]
        
        for input_str in invalid_inputs:
            is_valid, error = ValidationService.validate_material_breakdown(input_str)
            assert is_valid is False, f"Should be invalid: {input_str}"
            assert error is not None
    
    # ==================== Date Completed Validation ====================
    
    def test_validate_date_completed_empty(self):
        """Test that empty date is valid."""
        is_valid, error = ValidationService.validate_date_completed(None)
        assert is_valid is True
        assert error is None
        
        is_valid, error = ValidationService.validate_date_completed("")
        assert is_valid is True
        assert error is None
        
        is_valid, error = ValidationService.validate_date_completed("   ")
        assert is_valid is True
        assert error is None
    
    def test_validate_date_completed_year_only(self):
        """Test that year-only format is valid."""
        valid_dates = ["2024", "2020", "1999", "2100"]
        
        for date_str in valid_dates:
            is_valid, error = ValidationService.validate_date_completed(date_str)
            assert is_valid is True, f"Should be valid: {date_str}"
            assert error is None
    
    def test_validate_date_completed_month_year(self):
        """Test that month-year formats are valid."""
        valid_dates = [
            "2024-03",
            "2024/03",
            "03-2024",
            "03/2024",
            "March 2024",
            "Mar 2024",
            "march 2024",
        ]
        
        for date_str in valid_dates:
            is_valid, error = ValidationService.validate_date_completed(date_str)
            assert is_valid is True, f"Should be valid: {date_str}"
            assert error is None
    
    def test_validate_date_completed_full_date(self):
        """Test that full date formats are valid."""
        valid_dates = [
            "2024-03-15",
            "2024/03/15",
            "15-03-2024",
            "15/03/2024",
            "15 March 2024",
            "15 Mar 2024",
            "15 march 2024",
        ]
        
        for date_str in valid_dates:
            is_valid, error = ValidationService.validate_date_completed(date_str)
            assert is_valid is True, f"Should be valid: {date_str}"
            assert error is None
    
    def test_validate_date_completed_invalid(self):
        """Test that invalid date formats are rejected."""
        invalid_dates = [
            "invalid",
            "2024-13-01",  # Invalid month
            "2024-03-32",  # Invalid day
            "2024-00-01",  # Invalid month
            "2024-03-00",  # Invalid day
            "March",  # No year
            "2024 March",  # Wrong order
            "15/15/2024",  # Invalid month
            "32-03-2024",  # Invalid day
            "abc-03-2024",  # Invalid year
            "2024-abc-15",  # Invalid month
        ]
        
        for date_str in invalid_dates:
            is_valid, error = ValidationService.validate_date_completed(date_str)
            assert is_valid is False, f"Should be invalid: {date_str}"
            assert error is not None
            assert "format" in error.lower() or "invalid" in error.lower()
    
    def test_validate_date_completed_year_range(self):
        """Test that years outside reasonable range are rejected."""
        invalid_years = ["1899", "2101", "0000", "9999"]
        
        for year_str in invalid_years:
            is_valid, error = ValidationService.validate_date_completed(year_str)
            # Year-only validation should check range
            if len(year_str) == 4:
                # For 4-digit years, check if in range
                year = int(year_str)
                if year < 1900 or year > 2100:
                    assert is_valid is False, f"Should be invalid: {year_str}"
                    assert error is not None
