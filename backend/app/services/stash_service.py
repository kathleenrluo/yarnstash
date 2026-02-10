"""
Stash Service

Handles all business logic related to yarn inventory (stash).

Key Design Principle:
- Stash can ONLY be updated through these specific methods
- This enforces invariants and prevents bugs
- No direct mutation of stash quantities allowed elsewhere
"""

import json
from sqlalchemy.orm import Session
from typing import Optional, Any, List
from app.models.stash import StashEntry
from app.models.yarn import Yarn
from app.services.yarn_service import YarnService


def _json_to_list(value: Any) -> List:
    """Normalize JSON column from SQLite (may be str) or Postgres (list) to list."""
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except (json.JSONDecodeError, TypeError):
            return []
    return []


class StashService:
    """
    Service for managing yarn stash (inventory).
    
    This service enforces the critical invariant that stash can only be
    updated through controlled methods. This prevents bugs and ensures
    data consistency.
    """
    
    @staticmethod
    def get_stash_entry(db: Session, user_id: int, yarn_id: int) -> Optional[StashEntry]:
        """
        Get stash entry for a specific yarn, only if that yarn belongs to the user.
        """
        yarn = YarnService.get_yarn(db, yarn_id, user_id)
        if not yarn:
            return None
        return db.query(StashEntry).filter(StashEntry.yarn_id == yarn_id).first()
    
    @staticmethod
    def get_or_create_stash_entry(db: Session, user_id: int, yarn_id: int) -> StashEntry:
        """
        Get existing stash entry or create a new one with 0g. Yarn must belong to user.
        """
        yarn = YarnService.get_yarn(db, yarn_id, user_id)
        if not yarn:
            raise ValueError(f"Yarn with id {yarn_id} does not exist or does not belong to you")
        stash_entry = db.query(StashEntry).filter(StashEntry.yarn_id == yarn_id).first()
        if not stash_entry:
            stash_entry = StashEntry(yarn_id=yarn_id, total_grams_owned=0.0)
            db.add(stash_entry)
            db.commit()
            db.refresh(stash_entry)
        return stash_entry
    
    @staticmethod
    def add_yarn_by_grams(db: Session, user_id: int, yarn_id: int, grams: float) -> StashEntry:
        """
        Add yarn to stash by specifying grams.
        
        This is one of the controlled methods for updating stash.
        Use this when you know exactly how many grams you're adding.
        
        Args:
            db: Database session
            yarn_id: ID of the yarn
            grams: Number of grams to add (must be positive)
        
        Returns:
            Updated StashEntry
        
        Raises:
            ValueError: If grams is negative or yarn doesn't exist
        """
        if grams < 0:
            raise ValueError("Grams must be positive")
        
        stash_entry = StashService.get_or_create_stash_entry(db, user_id, yarn_id)
        stash_entry.total_grams_owned += grams
        db.commit()
        db.refresh(stash_entry)
        return stash_entry
    
    @staticmethod
    def add_yarn_by_skeins(db: Session, user_id: int, yarn_id: int, num_skeins: int) -> StashEntry:
        """
        Add yarn to stash by specifying number of skeins.
        
        This method looks up the grams_per_skein from the yarn metadata
        and calculates the total grams to add.
        
        Args:
            db: Database session
            yarn_id: ID of the yarn
            num_skeins: Number of skeins to add (must be positive)
        
        Returns:
            Updated StashEntry
        
        Raises:
            ValueError: If num_skeins is negative or yarn doesn't exist
        """
        if num_skeins < 0:
            raise ValueError("Number of skeins must be positive")
        
        yarn = YarnService.get_yarn(db, yarn_id, user_id)
        if not yarn:
            raise ValueError(f"Yarn with id {yarn_id} does not exist or does not belong to you")
        grams_to_add = num_skeins * yarn.grams_per_skein
        return StashService.add_yarn_by_grams(db, user_id, yarn_id, grams_to_add)
    
    @staticmethod
    def use_yarn(db: Session, user_id: int, yarn_id: int, grams: float) -> StashEntry:
        """
        Deduct yarn from stash (when used in a project).
        
        This is one of the controlled methods for updating stash.
        This method is called when yarn is used in a project.
        
        Args:
            db: Database session
            yarn_id: ID of the yarn
            grams: Number of grams to deduct (must be positive)
        
        Returns:
            Updated StashEntry
        
        Raises:
            ValueError: If grams is negative, yarn doesn't exist, or insufficient stash
        """
        if grams < 0:
            raise ValueError("Grams must be positive")
        
        stash_entry = StashService.get_stash_entry(db, user_id, yarn_id)
        if not stash_entry:
            raise ValueError(f"No stash entry found for yarn_id {yarn_id} or yarn does not belong to you")
        
        if stash_entry.total_grams_owned < grams:
            raise ValueError(
                f"Insufficient stash. Have {stash_entry.total_grams_owned}g, "
                f"trying to use {grams}g"
            )
        
        stash_entry.total_grams_owned -= grams
        db.commit()
        db.refresh(stash_entry)
        return stash_entry
    
    @staticmethod
    def set_stash_quantity(db: Session, user_id: int, yarn_id: int, grams: float) -> StashEntry:
        """
        Set stash quantity to a specific amount.
        
        Use this when you want to directly set the quantity (e.g., "I have 64g left").
        This is different from add/use - it sets the absolute value.
        
        Args:
            db: Database session
            yarn_id: ID of the yarn
            grams: Total grams to set (must be non-negative)
        
        Returns:
            Updated StashEntry
        
        Raises:
            ValueError: If grams is negative or yarn doesn't exist
        """
        if grams < 0:
            raise ValueError("Grams cannot be negative")
        
        stash_entry = StashService.get_or_create_stash_entry(db, user_id, yarn_id)
        stash_entry.total_grams_owned = grams
        db.commit()
        db.refresh(stash_entry)
        return stash_entry
    
    @staticmethod
    def get_all_stash(db: Session, user_id: int) -> list[StashEntry]:
        """Get all stash entries for yarns belonging to the user."""
        return (
            db.query(StashEntry)
            .join(Yarn, StashEntry.yarn_id == Yarn.id)
            .filter(Yarn.user_id == user_id)
            .all()
        )
    
    @staticmethod
    def get_stash_with_yarn_info(db: Session, user_id: int) -> list[dict]:
        """
        Get all yarns for the user with their stash entry information.
        """
        from sqlalchemy.orm import joinedload
        
        # Get all user's yarns with stash entries eagerly loaded
        yarns = (
            db.query(Yarn)
            .filter(Yarn.user_id == user_id)
            .options(joinedload(Yarn.stash_entries))
            .all()
        )
        
        result = []
        for yarn in yarns:
            # Get stash entry if it exists (should be at most one due to unique constraint)
            stash_entry = yarn.stash_entries[0] if yarn.stash_entries else None
            
            # Convert datetime to ISO string for JSON serialization
            last_updated_str = stash_entry.last_updated.isoformat() if stash_entry and stash_entry.last_updated else None
            
            # Convert yarn created_at to ISO string
            yarn_created_at = yarn.created_at.isoformat() if yarn.created_at else None
            yarn_updated_at = yarn.updated_at.isoformat() if yarn.updated_at else None
            
            result.append({
                "id": stash_entry.id if stash_entry else None,
                "yarn_id": yarn.id,
                "total_grams_owned": stash_entry.total_grams_owned if stash_entry else 0.0,
                "last_updated": last_updated_str,
                "yarn": {
                    "id": yarn.id,
                    "brand_name": yarn.brand_name,
                    "yarn_name": yarn.yarn_name,
                    "color_name": yarn.color_name,
                    "yarn_weight": yarn.yarn_weight,
                    "grams_per_skein": yarn.grams_per_skein,
                    "meters_per_skein": yarn.meters_per_skein,
                    "generalized_colors": _json_to_list(yarn.generalized_colors),
                    "material_breakdown": yarn.material_breakdown,
                    "materials": _json_to_list(yarn.materials),
                    "care_instruction_ids": _json_to_list(yarn.care_instruction_ids),
                    "yarn_photo_url": yarn.yarn_photo_url,
                    "label_photo_url": yarn.label_photo_url,
                    "is_favorite": bool(yarn.is_favorite),
                    "created_at": yarn_created_at,
                    "updated_at": yarn_updated_at,
                }
            })
        return result
