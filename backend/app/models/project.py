"""
Project Models

Represents crochet/knit projects and their yarn usage.

Key Design Principles:
- Project tracks metadata (name, dates, pattern info, etc.)
- ProjectYarnUsage is a join table tracking which yarns were used and how much
- Care instructions are computed from the most restrictive yarn in the project
"""

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Project(Base):
    """
    Project model - tracks crochet/knit projects.
    
    Stores project metadata, pattern information, and computed care instructions.
    Yarn usage is tracked separately in ProjectYarnUsage.
    """
    
    __tablename__ = "projects"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Craft type: "knit" or "crochet"
    craft_type = Column(String(20), nullable=True, index=True)
    
    # Date completed - flexible format: can be null, year only (e.g., "2024"), 
    # month and year (e.g., "2024-03" or "March 2024"), or full date (e.g., "2024-03-15")
    date_completed = Column(Text, nullable=True)
    
    # Hook/needle information
    # Stored as a single string value: "5mm" or "5mm (G)"
    hook_size = Column(String(20), nullable=True)
    
    # Pattern information
    # Pattern type: "pdf", "link", or "freehand"
    pattern_type = Column(String(50), nullable=True)
    # Pattern reference: URL to PDF, tutorial link, or null for freehand
    pattern_reference = Column(String(500), nullable=True)
    
    # Computed care instruction
    # This is calculated from the most restrictive care instruction
    # of all yarns used in the project
    computed_care_instruction = Column(Text, nullable=True)
    
    # Manual care instruction IDs (overrides computed)
    # If provided, this will override the computed care instruction
    # Stored as JSON array of integers (care instruction IDs)
    manual_care_instruction_ids = Column(JSON, nullable=True)
    
    # User preferences
    is_favorite = Column(Integer, nullable=False, default=0, index=True)
    # 0 = not favorite, 1 = favorite
    
    # Tags - stored as JSON array of strings
    # Users can create custom tags (e.g., "garment", "top", "hat", "outer", "stuffed animal")
    # Similar to Discord roles - free-form tag creation
    tags = Column(JSON, nullable=True)
    
    # Media storage
    # In production, these would be arrays of URLs
    # For now, storing as JSON arrays
    image_urls = Column(JSON, nullable=True)
    primary_image_index = Column(Integer, nullable=False, default=0)  # Index of primary image in image_urls array
    video_urls = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    # One project can use many yarns
    yarn_usages = relationship("ProjectYarnUsage", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<Project(id={self.id}, name={self.name})>"


class ProjectYarnUsage(Base):
    """
    ProjectYarnUsage - join table linking projects to yarns.
    
    Tracks which yarns were used in a project and how much of each.
    This is a many-to-many relationship with additional data (grams_used).
    """
    
    __tablename__ = "project_yarn_usages"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    yarn_id = Column(Integer, ForeignKey("yarns.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Usage tracking
    grams_used = Column(Float, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="yarn_usages")
    yarn = relationship("Yarn", back_populates="project_usages")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<ProjectYarnUsage(project_id={self.project_id}, yarn_id={self.yarn_id}, grams={self.grams_used})>"
