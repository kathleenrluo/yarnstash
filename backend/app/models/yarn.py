"""
Yarn Model

Represents yarn metadata (information about a type of yarn).
This is separate from inventory - a Yarn can exist even if you have 0g in stash.

Key Design Principle:
- Yarn = Information (brand, color, weight, care instructions, etc.)
- StashEntry = Inventory (how much you actually own)
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Yarn(Base):
    """
    Yarn model - stores metadata about yarn types.
    
    This model persists even when stash quantity is 0, allowing you to:
    - Keep track of yarns you've used before
    - Reference yarns in past projects
    - Re-add yarns to stash later without re-entering all metadata
    """
    
    __tablename__ = "yarns"
    
    # Unique constraint: prevent duplicate yarns (same brand, name, and color)
    __table_args__ = (
        UniqueConstraint('brand_name', 'yarn_name', 'color_name', name='uq_yarn_brand_name_color'),
    )
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic identification
    brand_name = Column(String(100), nullable=False, index=True)
    yarn_name = Column(String(100), nullable=False)
    color_name = Column(String(100), nullable=False)
    
    # Color categorization for sorting/filtering
    # Stored as JSON array of color option strings (e.g., ["red", "blue", "variegated"])
    # Allows multiple colors for variegated/multicolor yarns
    generalized_colors = Column(JSON, nullable=True)
    
    # Yarn specifications
    # Stored as integer ID (0=lace, 1=fingering, 2=sock, etc.)
    # See yarn_weights.py for available options
    yarn_weight = Column(Integer, nullable=False, index=True)
    
    # Material breakdown - stored as JSON string or structured text
    # Example: "50% mohair, 20% nylon, 30% cashmere"
    material_breakdown = Column(Text, nullable=True)
    
    # Materials - stored as JSON array of individual material names
    # Extracted from material_breakdown for filtering
    # Example: ["merino", "nylon"] from "80% merino wool 20% nylon"
    materials = Column(JSON, nullable=True)
    
    # Skein information
    grams_per_skein = Column(Float, nullable=False)
    meters_per_skein = Column(Float, nullable=False)
    
    # Care instructions - stored as JSON array of integer IDs
    # Each integer corresponds to a care instruction option (see care_instructions.py)
    # Examples: [1, 4, 5] = "Hand wash, Cold, Dry flat"
    care_instruction_ids = Column(JSON, nullable=True)
    
    # Photo storage
    # In production, these would be URLs to cloud storage (S3, etc.)
    # For now, storing as file paths or URLs
    yarn_photo_url = Column(String(500), nullable=True)
    label_photo_url = Column(String(500), nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # User preferences
    is_favorite = Column(Integer, nullable=False, default=0, index=True)
    # 0 = not favorite, 1 = favorite
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # One yarn can have many stash entries (if you track by location, etc.)
    # For now, we'll use one-to-one, but this allows future expansion
    stash_entries = relationship("StashEntry", back_populates="yarn", cascade="all, delete-orphan")
    
    # One yarn can be used in many projects
    project_usages = relationship("ProjectYarnUsage", back_populates="yarn")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<Yarn(id={self.id}, brand={self.brand_name}, name={self.yarn_name}, color={self.color_name})>"
