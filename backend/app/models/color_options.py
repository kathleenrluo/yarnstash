"""
Color Options Constants

Defines the available generalized color options for yarn sorting.
Users can select multiple colors for variegated/multicolor yarns.
"""

# Available color options
COLOR_RED = "red"
COLOR_ORANGE = "orange"
COLOR_YELLOW = "yellow"
COLOR_GREEN = "green"
COLOR_BLUE = "blue"
COLOR_PURPLE = "violet"
COLOR_PINK = "pink"
COLOR_BROWN = "brown"
COLOR_BLACK = "black"
COLOR_WHITE = "white"
COLOR_GRAY = "gray"
COLOR_BEIGE = "beige"
COLOR_RAINBOW = "rainbow"
COLOR_VARIEGATED = "variegated"
COLOR_NEUTRAL = "neutral"

# All available color options
ALL_COLORS = [
    COLOR_RED,
    COLOR_ORANGE,
    COLOR_YELLOW,
    COLOR_GREEN,
    COLOR_BLUE,
    COLOR_PURPLE,
    COLOR_PINK,
    COLOR_BROWN,
    COLOR_BLACK,
    COLOR_WHITE,
    COLOR_GRAY,
    COLOR_BEIGE,
    COLOR_RAINBOW,
    COLOR_VARIEGATED,
    COLOR_NEUTRAL,
]

# Human-readable labels (capitalized)
COLOR_LABELS = {
    COLOR_RED: "Red",
    COLOR_ORANGE: "Orange",
    COLOR_YELLOW: "Yellow",
    COLOR_GREEN: "Green",
    COLOR_BLUE: "Blue",
    COLOR_PURPLE: "Violet",
    COLOR_PINK: "Pink",
    COLOR_BROWN: "Brown",
    COLOR_BLACK: "Black",
    COLOR_WHITE: "White",
    COLOR_GRAY: "Gray",
    COLOR_BEIGE: "Beige",
    COLOR_RAINBOW: "Rainbow",
    COLOR_VARIEGATED: "Variegated",
    COLOR_NEUTRAL: "Neutral",
}


def get_color_label(color: str) -> str:
    """Get human-readable label for a color option."""
    return COLOR_LABELS.get(color, color.capitalize())


def format_colors(colors: list[str]) -> str:
    """
    Format a list of color options into a readable string.
    
    Args:
        colors: List of color option strings
    
    Returns:
        Formatted string like "Red, Blue, Variegated"
    """
    if not colors:
        return "No color specified"
    
    labels = [get_color_label(c) for c in colors]
    return ", ".join(labels)
