"""
Care Instruction Constants

Defines the available care instruction options as integer constants.
This ensures consistency across the application.
"""

# Care instruction option IDs
# Washing methods
CARE_HAND_WASH = 1
CARE_MACHINE_WASH_DELICATE = 2
CARE_MACHINE_WASH = 3
CARE_SPOT_CLEAN = 9  # Most restrictive washing method

# Temperature
CARE_COLD = 4

# Drying methods
CARE_DRY_FLAT = 5
CARE_TUMBLE_LOW = 6
CARE_TUMBLE_MEDIUM = 7
CARE_TUMBLE_HIGH = 8

# Mapping of IDs to human-readable labels
CARE_INSTRUCTION_LABELS = {
    CARE_SPOT_CLEAN: "Spot clean",
    CARE_HAND_WASH: "Hand wash",
    CARE_MACHINE_WASH_DELICATE: "Machine wash delicate",
    CARE_MACHINE_WASH: "Machine wash",
    CARE_COLD: "Cold",
    CARE_DRY_FLAT: "Dry flat",
    CARE_TUMBLE_LOW: "Tumble dry low",
    CARE_TUMBLE_MEDIUM: "Tumble dry medium",
    CARE_TUMBLE_HIGH: "Tumble dry high",
}

# Reverse mapping: label to ID
CARE_INSTRUCTION_IDS = {v: k for k, v in CARE_INSTRUCTION_LABELS.items()}

# All available care instruction IDs
ALL_CARE_INSTRUCTIONS = list(CARE_INSTRUCTION_LABELS.keys())

# Priority order for computing most restrictive instruction (lower number = more restrictive)
CARE_PRIORITY = {
    CARE_SPOT_CLEAN: 0,  # Most restrictive washing method
    CARE_HAND_WASH: 1,
    CARE_MACHINE_WASH_DELICATE: 2,
    CARE_MACHINE_WASH: 3,
    CARE_COLD: 1,  # Temperature priority
    CARE_DRY_FLAT: 1,
    CARE_TUMBLE_LOW: 2,
    CARE_TUMBLE_MEDIUM: 3,
    CARE_TUMBLE_HIGH: 4,
}


def get_care_instruction_label(instruction_id: int) -> str:
    """Get human-readable label for a care instruction ID."""
    return CARE_INSTRUCTION_LABELS.get(instruction_id, f"Unknown ({instruction_id})")


def format_care_instructions(instruction_ids: list[int]) -> str:
    """
    Format a list of care instruction IDs into a readable string.
    
    Args:
        instruction_ids: List of care instruction IDs
    
    Returns:
        Formatted string like "Hand wash, Cold, Dry flat"
    """
    if not instruction_ids:
        return "No care instructions"
    
    labels = [get_care_instruction_label(i) for i in instruction_ids]
    return ", ".join(labels)
