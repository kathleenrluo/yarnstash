"""
Tests for date_completed validation in project creation/update.

These tests verify that invalid date formats are rejected
and valid ones are accepted.
"""

import pytest
from app.services.project_service import ProjectService


class TestProjectDateValidation:
    """Test suite for date_completed validation in project operations."""
    
    def test_create_project_with_valid_date_year(self, db):
        """Test creating project with valid year-only date."""
        project = ProjectService.create_project(
            db=db,
            name="Test Project",
            date_completed="2024"
        )
        
        assert project is not None
        assert project.date_completed == "2024"
    
    def test_create_project_with_valid_date_month_year(self, db):
        """Test creating project with valid month-year date."""
        valid_dates = ["2024-03", "March 2024", "03-2024"]
        
        for date_str in valid_dates:
            project = ProjectService.create_project(
                db=db,
                name=f"Test Project {date_str}",
                date_completed=date_str
            )
            
            assert project is not None
            assert project.date_completed == date_str
    
    def test_create_project_with_valid_date_full(self, db):
        """Test creating project with valid full date."""
        valid_dates = ["2024-03-15", "15 March 2024", "15-03-2024"]
        
        for date_str in valid_dates:
            project = ProjectService.create_project(
                db=db,
                name=f"Test Project {date_str}",
                date_completed=date_str
            )
            
            assert project is not None
            assert project.date_completed == date_str
    
    def test_create_project_with_empty_date(self, db):
        """Test creating project with empty date (should be allowed)."""
        project = ProjectService.create_project(
            db=db,
            name="Test Project",
            date_completed=None
        )
        
        assert project is not None
        assert project.date_completed is None
    
    def test_create_project_with_invalid_date(self, db):
        """Test that invalid date format is rejected."""
        invalid_dates = [
            "invalid",
            "2024-13-01",  # Invalid month
            "2024-03-32",  # Invalid day
            "March",  # No year
        ]
        
        for date_str in invalid_dates:
            with pytest.raises(ValueError) as exc_info:
                ProjectService.create_project(
                    db=db,
                    name=f"Test Project {date_str}",
                    date_completed=date_str
                )
            
            assert "format" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()
    
    def test_update_project_with_valid_date(self, db):
        """Test updating project with valid date."""
        project = ProjectService.create_project(
            db=db,
            name="Test Project",
            date_completed="2024"
        )
        
        updated = ProjectService.update_project(
            db=db,
            project_id=project.id,
            date_completed="2024-03-15"
        )
        
        assert updated is not None
        assert updated.date_completed == "2024-03-15"
    
    def test_update_project_with_invalid_date(self, db):
        """Test that updating with invalid date is rejected."""
        project = ProjectService.create_project(
            db=db,
            name="Test Project",
            date_completed="2024"
        )
        
        with pytest.raises(ValueError) as exc_info:
            ProjectService.update_project(
                db=db,
                project_id=project.id,
                date_completed="invalid-date"
            )
        
        assert "format" in str(exc_info.value).lower() or "invalid" in str(exc_info.value).lower()
    
    def test_update_project_clear_date(self, db):
        """Test that clearing date (setting to None) is allowed."""
        project = ProjectService.create_project(
            db=db,
            name="Test Project",
            date_completed="2024"
        )
        
        updated = ProjectService.update_project(
            db=db,
            project_id=project.id,
            date_completed=None
        )
        
        assert updated is not None
        assert updated.date_completed is None
