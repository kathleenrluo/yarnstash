"""
Pydantic Schemas

These schemas define the structure of request and response data.
They provide automatic validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==================== Yarn Schemas ====================

class YarnBase(BaseModel):
    """Base schema for yarn data."""
    brand_name: str = Field(..., description="Brand of the yarn")
    yarn_name: str = Field(..., description="Name of the yarn line")
    color_name: str = Field(..., description="Color name")
    yarn_weight: int = Field(..., description="Yarn weight ID (0=lace, 1=fingering, 2=sock, etc.)")
    grams_per_skein: float = Field(..., gt=0, description="Grams in one skein")
    meters_per_skein: float = Field(..., gt=0, description="Meters in one skein")
    generalized_colors: Optional[List[str]] = Field(None, description="Color options for sorting (multiselect)")
    material_breakdown: Optional[str] = Field(None, description="Material composition")
    materials: Optional[List[str]] = Field(None, description="Individual materials extracted from breakdown (for filtering)")
    care_instruction_ids: Optional[List[int]] = Field(None, description="Care instruction IDs (multiselect)")
    yarn_photo_url: Optional[str] = Field(None, description="URL/path to yarn photo")
    label_photo_url: Optional[str] = Field(None, description="URL/path to label photo")
    notes: Optional[str] = Field(None, description="Notes about this yarn")
    is_favorite: Optional[bool] = Field(False, description="Whether this yarn is favorited")


class YarnCreate(YarnBase):
    """Schema for creating a new yarn."""
    pass


class YarnUpdate(BaseModel):
    """Schema for updating yarn (all fields optional)."""
    brand_name: Optional[str] = None
    yarn_name: Optional[str] = None
    color_name: Optional[str] = None
    yarn_weight: Optional[int] = None
    grams_per_skein: Optional[float] = Field(None, gt=0)
    meters_per_skein: Optional[float] = Field(None, gt=0)
    generalized_colors: Optional[List[str]] = None
    material_breakdown: Optional[str] = None
    materials: Optional[List[str]] = None
    care_instruction_ids: Optional[List[int]] = None
    yarn_photo_url: Optional[str] = None
    label_photo_url: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None


class YarnResponse(YarnBase):
    """Schema for yarn response."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models


# ==================== Stash Schemas ====================

class StashEntryBase(BaseModel):
    """Base schema for stash entry."""
    yarn_id: int = Field(..., description="ID of the yarn")
    total_grams_owned: float = Field(..., ge=0, description="Total grams owned")


class StashEntryResponse(StashEntryBase):
    """Schema for stash entry response."""
    id: int
    last_updated: datetime
    
    class Config:
        from_attributes = True


class StashEntryWithYarn(StashEntryResponse):
    """Schema for stash entry with yarn information."""
    yarn: YarnResponse


class AddYarnByGrams(BaseModel):
    """Schema for adding yarn to stash by grams."""
    yarn_id: int = Field(..., description="ID of the yarn")
    grams: float = Field(..., gt=0, description="Grams to add")


class AddYarnBySkeins(BaseModel):
    """Schema for adding yarn to stash by skeins."""
    yarn_id: int = Field(..., description="ID of the yarn")
    num_skeins: int = Field(..., gt=0, description="Number of skeins to add")


class UseYarn(BaseModel):
    """Schema for using yarn (deducting from stash)."""
    yarn_id: int = Field(..., description="ID of the yarn")
    grams: float = Field(..., gt=0, description="Grams to use")


class SetStashQuantity(BaseModel):
    """Schema for setting stash quantity to a specific amount."""
    yarn_id: int = Field(..., description="ID of the yarn")
    grams: float = Field(..., ge=0, description="Total grams to set")


# ==================== Project Schemas ====================

class ProjectBase(BaseModel):
    """Base schema for project data."""
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    notes: Optional[str] = Field(None, description="Project notes")
    craft_type: Optional[str] = Field(None, description="Craft type: 'knit' or 'crochet'")
    hook_size: Optional[str] = Field(None, description="Hook/needle size used (e.g., '5mm' or '5mm (G)')")
    pattern_type: Optional[str] = Field(None, description="Pattern type: 'pdf', 'link', or 'freehand'")
    pattern_reference: Optional[str] = Field(None, description="URL or reference to pattern")
    is_favorite: Optional[bool] = Field(False, description="Whether this project is favorited")
    tags: Optional[List[str]] = Field(None, description="Custom tags for the project (e.g., 'garment', 'hat', 'stuffed animal')")


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""
    date_completed: Optional[str] = Field(None, description="Date completed - can be null, year (e.g., '2024'), month+year (e.g., '2024-03' or 'March 2024'), or full date (e.g., '2024-03-15')")
    image_urls: Optional[List[str]] = None
    primary_image_index: Optional[int] = Field(0, ge=0, description="Index of primary image in image_urls array")
    yarn_usage: Optional[List[AddYarnUsage]] = Field(None, description="Optional list of yarns to attach to the project during creation")
    manual_care_instruction_ids: Optional[List[int]] = Field(None, description="Manual care instruction IDs (overrides computed care instructions from yarns)")


class ProjectUpdate(BaseModel):
    """Schema for updating project (all fields optional)."""
    name: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    craft_type: Optional[str] = Field(None, description="Craft type: 'knit' or 'crochet'")
    date_completed: Optional[str] = Field(None, description="Date completed - can be null, year (e.g., '2024'), month+year (e.g., '2024-03' or 'March 2024'), or full date (e.g., '2024-03-15')")
    hook_size: Optional[str] = None
    pattern_type: Optional[str] = None
    pattern_reference: Optional[str] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None
    primary_image_index: Optional[int] = Field(None, ge=0, description="Index of primary image in image_urls array")
    video_urls: Optional[List[str]] = None
    manual_care_instruction_ids: Optional[List[int]] = Field(None, description="Manual care instruction IDs (overrides computed care instructions from yarns)")


class ProjectResponse(ProjectBase):
    """Schema for project response."""
    id: int
    date_completed: Optional[str] = Field(None, description="Date completed - can be null, year (e.g., '2024'), month+year (e.g., '2024-03' or 'March 2024'), or full date (e.g., '2024-03-15')")
    computed_care_instruction: Optional[str] = None
    manual_care_instruction_ids: Optional[List[int]] = None
    is_favorite: bool = False
    tags: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None
    primary_image_index: int = 0
    video_urls: Optional[List[str]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AddYarnUsage(BaseModel):
    """Schema for adding yarn usage to a project."""
    yarn_id: int = Field(..., description="ID of the yarn")
    grams_used: float = Field(..., ge=0, description="Grams of yarn used (0 means unknown/not tracked)")
    update_stash: bool = Field(True, description="Whether to deduct from stash")


class UpdateYarnUsage(BaseModel):
    """Schema for updating yarn usage in a project."""
    grams_used: Optional[float] = Field(None, ge=0, description="New grams of yarn used (0 means unknown/not tracked)")
    update_stash: Optional[bool] = Field(None, description="Whether to update stash (only used if grams_used changes)")


# ==================== Search Schemas ====================

class BrandSearchResponse(BaseModel):
    """Schema for brand search response."""
    brands: List[str] = Field(..., description="List of matching brand names")
