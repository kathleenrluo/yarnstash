"""
Care Instruction Service

Handles logic for computing care instructions from multiple yarns.

Key Principle: When multiple yarns are used in a project, use the most
restrictive care instruction to ensure the garment is safe to care for.

Now works with integer IDs instead of text parsing for consistency.
"""

from typing import List, Optional
from app.models.yarn import Yarn
from app.models.care_instructions import (
    CARE_SPOT_CLEAN,
    CARE_HAND_WASH,
    CARE_MACHINE_WASH_DELICATE,
    CARE_MACHINE_WASH,
    CARE_COLD,
    CARE_DRY_FLAT,
    CARE_TUMBLE_LOW,
    CARE_TUMBLE_MEDIUM,
    CARE_TUMBLE_HIGH,
    CARE_PRIORITY,
    format_care_instructions,
)


class CareInstructionService:
    """
    Service for computing care instructions.
    
    When a project uses multiple yarns, we need to determine the safest
    care instruction. This service implements the logic to find the most
    restrictive instruction using integer IDs.
    """
    
    @staticmethod
    def compute_care_instruction_ids(yarns: List[Yarn]) -> List[int]:
        """
        Compute the most restrictive care instruction IDs from a list of yarns.
        
        This method analyzes all care instruction IDs and returns the most
        restrictive combination. The logic:
        1. Collect all care instruction IDs from all yarns
        2. Find the most restrictive washing method (lowest priority number)
        3. Find the most restrictive temperature (if any)
        4. Find the most restrictive drying method (lowest priority number)
        5. Return list of most restrictive instruction IDs
        
        Args:
            yarns: List of Yarn objects used in the project
        
        Returns:
            List of care instruction IDs representing the most restrictive combination
        
        Examples:
            Input: Yarns with [1, 4, 5] and [2, 4, 6] (hand wash cold dry flat vs machine delicate cold tumble low)
            Output: [1, 4, 5] (most restrictive: hand wash, cold, dry flat)
        """
        if not yarns:
            return []
        
        # Collect all care instruction IDs from all yarns
        all_instruction_ids = []
        for yarn in yarns:
            if yarn.care_instruction_ids:
                all_instruction_ids.extend(yarn.care_instruction_ids)
        
        if not all_instruction_ids:
            return []
        
        # Remove duplicates
        unique_ids = list(set(all_instruction_ids))
        
        # Separate by category
        washing_ids = [
            i for i in unique_ids
            if i in [CARE_SPOT_CLEAN, CARE_HAND_WASH, CARE_MACHINE_WASH_DELICATE, CARE_MACHINE_WASH]
        ]
        temperature_ids = [i for i in unique_ids if i == CARE_COLD]
        drying_ids = [
            i for i in unique_ids
            if i in [CARE_DRY_FLAT, CARE_TUMBLE_LOW, CARE_TUMBLE_MEDIUM, CARE_TUMBLE_HIGH]
        ]
        
        # Find most restrictive in each category (lowest priority number)
        result = []
        
        # Most restrictive washing
        if washing_ids:
            most_restrictive_wash = min(
                washing_ids,
                key=lambda x: CARE_PRIORITY.get(x, 999)
            )
            result.append(most_restrictive_wash)
        
        # Temperature (if present, include it)
        if temperature_ids:
            result.append(CARE_COLD)
        
        # Most restrictive drying
        if drying_ids:
            most_restrictive_dry = min(
                drying_ids,
                key=lambda x: CARE_PRIORITY.get(x, 999)
            )
            result.append(most_restrictive_dry)
        
        return result
    
    @staticmethod
    def compute_care_instruction(yarns: List[Yarn]) -> str:
        """
        Compute the most restrictive care instruction as a formatted string.
        
        This is a convenience method that calls compute_care_instruction_ids
        and formats the result as a human-readable string.
        
        Args:
            yarns: List of Yarn objects used in the project
        
        Returns:
            Formatted string like "Hand wash, Cold, Dry flat"
        """
        instruction_ids = CareInstructionService.compute_care_instruction_ids(yarns)
        if not instruction_ids:
            return "No care instructions available"
        return format_care_instructions(instruction_ids)
