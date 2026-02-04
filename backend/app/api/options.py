"""
Options API Endpoints

Provides available options for care instructions and colors.
These endpoints are used by the frontend to populate dropdowns/multiselects.
"""

from fastapi import APIRouter
from app.models.care_instructions import (
    ALL_CARE_INSTRUCTIONS,
    CARE_INSTRUCTION_LABELS,
    CARE_INSTRUCTION_IDS,
)
from app.models.color_options import (
    ALL_COLORS,
    COLOR_LABELS,
)
from app.models.yarn_weights import (
    ALL_YARN_WEIGHTS,
    YARN_WEIGHT_LABELS,
)
from app.models.material_options import (
    ALL_MATERIALS,
    MATERIAL_LABELS,
)

router = APIRouter(prefix="/options", tags=["options"])


@router.get("/care-instructions")
def get_care_instruction_options():
    """
    Get all available care instruction options.
    
    Returns a list of care instruction options with their IDs and labels.
    This is used by the frontend to populate the care instruction multiselect.
    """
    return {
        "options": [
            {
                "id": instruction_id,
                "label": CARE_INSTRUCTION_LABELS[instruction_id]
            }
            for instruction_id in ALL_CARE_INSTRUCTIONS
        ]
    }


@router.get("/colors")
def get_color_options():
    """
    Get all available color options.
    
    Returns a list of color options with their values and labels.
    This is used by the frontend to populate the color multiselect.
    """
    return {
        "options": [
            {
                "value": color,
                "label": COLOR_LABELS[color]
            }
            for color in ALL_COLORS
        ]
    }


@router.get("/yarn-weights")
def get_yarn_weight_options():
    """
    Get all available yarn weight options.
    
    Returns a list of yarn weight options with their IDs and labels.
    Format: {id: 0, label: "0 - Lace"}, {id: 1, label: "1 - Fingering"}, etc.
    This is used by the frontend to populate the yarn weight dropdown.
    """
    return {
        "options": [
            {
                "id": weight_id,
                "label": f"{weight_id} - {YARN_WEIGHT_LABELS[weight_id]}"
            }
            for weight_id in ALL_YARN_WEIGHTS
        ]
    }


@router.get("/materials")
def get_material_options():
    """
    Get all available material options.
    
    Returns a list of standard material options with their values and labels.
    This is used by the frontend to populate material selection (dropdown/multiselect).
    """
    return {
        "options": [
            {
                "value": material,
                "label": MATERIAL_LABELS[material]
            }
            for material in ALL_MATERIALS
        ]
    }
