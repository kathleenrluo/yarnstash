"""
Material Options Constants

Defines standard material names for yarn composition.
This ensures consistency and prevents misspellings while still allowing custom materials.
"""

# Standard material options (common yarn materials)
MATERIAL_WOOL = "wool"
MATERIAL_SUPERWASH_WOOL = "superwash wool"
MATERIAL_MERINO = "merino"
MATERIAL_SUPERWASH_MERINO = "superwash merino"
MATERIAL_CASHMERE = "cashmere"
MATERIAL_SUPERWASH_CASHMERE = "superwash cashmere"
MATERIAL_ALPACA = "alpaca"
MATERIAL_SUPERWASH_ALPACA = "superwash alpaca"
MATERIAL_MOHAIR = "mohair"
MATERIAL_SUPERWASH_MOHAIR = "superwash mohair"
MATERIAL_HIGHLAND = "highland"
MATERIAL_SUPERWASH_HIGHLAND = "superwash highland"
MATERIAL_ANGORA = "angora"
MATERIAL_SILK = "silk"
MATERIAL_COTTON = "cotton"
MATERIAL_LINEN = "linen"
MATERIAL_BAMBOO = "bamboo"
MATERIAL_RAYON = "rayon"
MATERIAL_VISCOSE = "viscose"
MATERIAL_TENCEL = "tencel"
MATERIAL_MODAL = "modal"
MATERIAL_ACRYLIC = "acrylic"
MATERIAL_POLYESTER = "polyester"
MATERIAL_NYLON = "nylon"
MATERIAL_POLYAMIDE = "polyamide"
MATERIAL_SPANDEX = "spandex"
MATERIAL_ELASTANE = "elastane"
MATERIAL_LYCRA = "lycra"
MATERIAL_METALLIC = "metallic"
MATERIAL_POLYPROPYLENE = "polypropylene"
MATERIAL_OTHER = "other"

# All standard material options
ALL_MATERIALS = [
    MATERIAL_WOOL,
    MATERIAL_SUPERWASH_WOOL,
    MATERIAL_MERINO,
    MATERIAL_SUPERWASH_MERINO,
    MATERIAL_CASHMERE,
    MATERIAL_SUPERWASH_CASHMERE,
    MATERIAL_ALPACA,
    MATERIAL_SUPERWASH_ALPACA,
    MATERIAL_MOHAIR,
    MATERIAL_SUPERWASH_MOHAIR,
    MATERIAL_HIGHLAND,
    MATERIAL_SUPERWASH_HIGHLAND,
    MATERIAL_ANGORA,
    MATERIAL_SILK,
    MATERIAL_COTTON,
    MATERIAL_LINEN,
    MATERIAL_BAMBOO,
    MATERIAL_RAYON,
    MATERIAL_VISCOSE,
    MATERIAL_TENCEL,
    MATERIAL_MODAL,
    MATERIAL_ACRYLIC,
    MATERIAL_POLYESTER,
    MATERIAL_NYLON,
    MATERIAL_POLYAMIDE,
    MATERIAL_SPANDEX,
    MATERIAL_ELASTANE,
    MATERIAL_LYCRA,
    MATERIAL_METALLIC,
    MATERIAL_POLYPROPYLENE,
    MATERIAL_OTHER,
]

# Human-readable labels (capitalized)
MATERIAL_LABELS = {
    MATERIAL_WOOL: "Wool",
    MATERIAL_SUPERWASH_WOOL: "Superwash Wool",
    MATERIAL_MERINO: "Merino",
    MATERIAL_SUPERWASH_MERINO: "Superwash Merino",
    MATERIAL_CASHMERE: "Cashmere",
    MATERIAL_SUPERWASH_CASHMERE: "Superwash Cashmere",
    MATERIAL_ALPACA: "Alpaca",
    MATERIAL_SUPERWASH_ALPACA: "Superwash Alpaca",
    MATERIAL_MOHAIR: "Mohair",
    MATERIAL_SUPERWASH_MOHAIR: "Superwash Mohair",
    MATERIAL_HIGHLAND: "Highland",
    MATERIAL_SUPERWASH_HIGHLAND: "Superwash Highland",
    MATERIAL_ANGORA: "Angora",
    MATERIAL_SILK: "Silk",
    MATERIAL_COTTON: "Cotton",
    MATERIAL_LINEN: "Linen",
    MATERIAL_BAMBOO: "Bamboo",
    MATERIAL_RAYON: "Rayon",
    MATERIAL_VISCOSE: "Viscose",
    MATERIAL_TENCEL: "Tencel",
    MATERIAL_MODAL: "Modal",
    MATERIAL_ACRYLIC: "Acrylic",
    MATERIAL_POLYESTER: "Polyester",
    MATERIAL_NYLON: "Nylon",
    MATERIAL_POLYAMIDE: "Polyamide",
    MATERIAL_SPANDEX: "Spandex",
    MATERIAL_ELASTANE: "Elastane",
    MATERIAL_LYCRA: "Lycra",
    MATERIAL_METALLIC: "Metallic",
    MATERIAL_POLYPROPYLENE: "Polypropylene",
    MATERIAL_OTHER: "Other",
}

# Common variations/misspellings that should map to standard materials
# Format: {variation: standard_material}
MATERIAL_NORMALIZATIONS = {
    # Merino variations
    "merino wool": MATERIAL_MERINO,
    "merinoo": MATERIAL_MERINO,
    "merinoo wool": MATERIAL_MERINO,
    
    # Superwash variations
    "superwash": MATERIAL_SUPERWASH_WOOL,
    "sw wool": MATERIAL_SUPERWASH_WOOL,
    "sw merino": MATERIAL_SUPERWASH_MERINO,
    "sw highland": MATERIAL_SUPERWASH_HIGHLAND,
    
    # Acrylic variations
    "acrilic": MATERIAL_ACRYLIC,
    "acryllic": MATERIAL_ACRYLIC,
    
    # Nylon variations
    "nylone": MATERIAL_NYLON,
    "nylen": MATERIAL_NYLON,
    
    # Wool variations
    "wool fiber": MATERIAL_WOOL,
    "woolen": MATERIAL_WOOL,
    
    # Polyester variations
    "poly": MATERIAL_POLYESTER,
    "polyester fiber": MATERIAL_POLYESTER,
    
    # Spandex/Elastane/Lycra (all the same)
    "spandex": MATERIAL_ELASTANE,
    "lycra": MATERIAL_ELASTANE,
    
    # Polyamide = Nylon
    "polyamide": MATERIAL_NYLON,
    
    # Highland variations
    "highland wool": MATERIAL_HIGHLAND,
}


def get_material_label(material: str) -> str:
    """Get human-readable label for a material option."""
    return MATERIAL_LABELS.get(material, material.capitalize())


def normalize_material(material: str) -> str:
    """
    Normalize a material name to a standard material.
    
    First checks if it's already a standard material, then checks variations,
    then returns lowercase version if not found.
    
    Args:
        material: Material name to normalize (e.g., "merino wool", "acrilic")
    
    Returns:
        Normalized material name (standard material or lowercase version)
    """
    if not material:
        return ""
    
    material_lower = material.lower().strip()
    
    # Check if it's already a standard material
    if material_lower in ALL_MATERIALS:
        return material_lower
    
    # Check variations
    if material_lower in MATERIAL_NORMALIZATIONS:
        return MATERIAL_NORMALIZATIONS[material_lower]
    
    # Check if it contains a standard material name
    for standard in ALL_MATERIALS:
        if standard in material_lower or material_lower in standard:
            return standard
    
    # Return lowercase version (custom material)
    return material_lower


def format_materials(materials: list[str]) -> str:
    """
    Format a list of materials into a readable string.
    
    Args:
        materials: List of material strings
    
    Returns:
        Formatted string like "Merino, Nylon, Acrylic"
    """
    if not materials:
        return "No materials specified"
    
    labels = [get_material_label(m) for m in materials]
    return ", ".join(labels)
