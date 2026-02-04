"""
Yarn Weight Constants

Defines the available yarn weight options as integer constants.
This ensures consistency across the application.
"""

# Yarn weight IDs (standard Craft Yarn Council numbering)
# Standard goes from 0-7
WEIGHT_LACE = 0
WEIGHT_SUPER_FINE = 1  # Also called Fingering, Sock, 10-count crochet thread
WEIGHT_FINE = 2  # Also called Sport, Baby
WEIGHT_LIGHT = 3  # Also called DK, Light Worsted
WEIGHT_MEDIUM = 4  # Also called Worsted, Afghan, Aran
WEIGHT_BULKY = 5  # Also called Chunky, Craft, Rug
WEIGHT_SUPER_BULKY = 6  # Also called Roving, Super Chunky
WEIGHT_JUMBO = 7  # Also called Roving

# Mapping of IDs to human-readable labels (Craft Yarn Council standard)
YARN_WEIGHT_LABELS = {
    WEIGHT_LACE: "Lace",
    WEIGHT_SUPER_FINE: "Super Fine",
    WEIGHT_FINE: "Fine",
    WEIGHT_LIGHT: "Light",
    WEIGHT_MEDIUM: "Medium",
    WEIGHT_BULKY: "Bulky",
    WEIGHT_SUPER_BULKY: "Super Bulky",
    WEIGHT_JUMBO: "Jumbo",
}

# Reverse mapping: label to ID (case-insensitive)
YARN_WEIGHT_IDS = {
    label.lower(): weight_id
    for weight_id, label in YARN_WEIGHT_LABELS.items()
}

# All available yarn weight IDs
ALL_YARN_WEIGHTS = list(YARN_WEIGHT_LABELS.keys())


def get_yarn_weight_label(weight_id: int) -> str:
    """Get human-readable label for a yarn weight ID."""
    return YARN_WEIGHT_LABELS.get(weight_id, f"Unknown ({weight_id})")


def get_yarn_weight_id(label: str) -> int | None:
    """
    Get yarn weight ID from a label (case-insensitive).
    
    Args:
        label: Yarn weight label (e.g., "Lace", "DK", "Worsted")
    
    Returns:
        Yarn weight ID or None if not found
    """
    return YARN_WEIGHT_IDS.get(label.lower())
