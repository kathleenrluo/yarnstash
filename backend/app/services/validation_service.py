"""
Validation Service

Provides validation functions for parsed fields like materials and dates.
These validations ensure that if parsing fails, we reject the data and ask the user to retype.
"""

import re
from typing import Optional, Tuple


class ValidationService:
    """Service for validating parsed fields."""
    
    @staticmethod
    def validate_material_breakdown(material_breakdown: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Validate that material_breakdown can be successfully parsed.
        
        Args:
            material_breakdown: Material breakdown string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if valid or empty, False if invalid
            - error_message: None if valid, error message if invalid
        """
        # Empty/None is valid (optional field)
        if not material_breakdown or not material_breakdown.strip():
            return True, None
        
        # Check if it contains at least some material-like content
        # Should contain letters (not just numbers and symbols)
        if not re.search(r'[a-zA-Z]', material_breakdown):
            return False, (
                "Material breakdown must contain material names (letters). "
                "Please check your input and try again. "
                "Example: '80% merino wool 20% nylon' or 'acrylic, wool'"
            )
        
        # Check if it looks like it might have materials
        # Should have at least one word that's not just a percentage
        words = re.findall(r'\b[a-zA-Z]{2,}\b', material_breakdown)
        if not words:
            return False, (
                "Material breakdown must contain material names. "
                "Please check your input and try again. "
                "Example: '80% merino wool 20% nylon' or 'acrylic, wool'"
            )
        
        return True, None
    
    @staticmethod
    def validate_date_completed(date_completed: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Validate that date_completed is in a valid format.
        
        Valid formats:
        - null/empty (optional field)
        - Year only: "2024"
        - Month and year: "2024-03", "03-2024", "March 2024", "Mar 2024"
        - Full date: "2024-03-15", "15-03-2024", "15 March 2024"
        
        Args:
            date_completed: Date string to validate
        
        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if valid or empty, False if invalid
            - error_message: None if valid, error message if invalid
        """
        # Empty/None is valid (optional field)
        # Handle None, empty string, or whitespace-only strings
        if date_completed is None:
            return True, None
        if isinstance(date_completed, str) and not date_completed.strip():
            return True, None
        if not date_completed:
            return True, None
        
        trimmed = date_completed.strip()
        
        # Month names for validation
        month_names = {
            'january', 'jan', 'february', 'feb', 'march', 'mar',
            'april', 'apr', 'may', 'june', 'jun', 'july', 'jul',
            'august', 'aug', 'september', 'sep', 'sept', 'october',
            'oct', 'november', 'nov', 'december', 'dec'
        }
        
        # Try full date format: YYYY-MM-DD or YYYY/MM/DD
        if re.match(r'^\d{4}[-/]\d{1,2}[-/]\d{1,2}$', trimmed):
            parts = re.split(r'[-/]', trimmed)
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            if 1 <= month <= 12 and 1 <= day <= 31:
                return True, None
        
        # Try day-month-year format: DD-MM-YYYY or DD/MM/YYYY
        if re.match(r'^\d{1,2}[-/]\d{1,2}[-/]\d{4}$', trimmed):
            parts = re.split(r'[-/]', trimmed)
            day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            if 1 <= month <= 12 and 1 <= day <= 31:
                return True, None
        
        # Try text day-month-year: "15 March 2024", "15 Mar 2024"
        text_day_match = re.match(r'^(\d{1,2})\s+([a-z]+)\s+(\d{4})$', trimmed, re.IGNORECASE)
        if text_day_match:
            day, month_name, year = int(text_day_match.group(1)), text_day_match.group(2).lower(), int(text_day_match.group(3))
            if month_name in month_names and 1 <= day <= 31:
                return True, None
        
        # Try month-year formats: YYYY-MM or YYYY/MM
        if re.match(r'^\d{4}[-/]\d{1,2}$', trimmed):
            parts = re.split(r'[-/]', trimmed)
            year, month = int(parts[0]), int(parts[1])
            if 1 <= month <= 12:
                return True, None
        
        # Try month-year formats: MM-YYYY or MM/YYYY
        if re.match(r'^\d{1,2}[-/]\d{4}$', trimmed):
            parts = re.split(r'[-/]', trimmed)
            month, year = int(parts[0]), int(parts[1])
            if 1 <= month <= 12:
                return True, None
        
        # Try text month format: "March 2024", "Mar 2024"
        text_month_match = re.match(r'^([a-z]+)\s+(\d{4})$', trimmed, re.IGNORECASE)
        if text_month_match:
            month_name, year = text_month_match.group(1).lower(), int(text_month_match.group(2))
            if month_name in month_names:
                return True, None
        
        # Try year only: YYYY
        if re.match(r'^\d{4}$', trimmed):
            year = int(trimmed)
            if 1900 <= year <= 2100:  # Reasonable year range
                return True, None
        
        # Invalid format
        return False, (
            "Date format is invalid. Please use one of these formats:\n"
            "- Year only: '2024'\n"
            "- Month and year: '2024-03', 'March 2024', or '03-2024'\n"
            "- Full date: '2024-03-15', '15 March 2024', or '15-03-2024'\n"
            "Or leave empty if the project is not completed."
        )
