"""
Yarn Service

Handles all business logic related to yarn metadata.
This service manages CRUD operations for yarns.
"""

import re
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.yarn import Yarn
from app.models.project import ProjectYarnUsage
from app.services.file_service import FileService


class YarnService:
    """
    Service for managing yarn metadata.
    
    All yarn-related business logic is encapsulated here.
    API endpoints should call these methods, not interact with models directly.
    """
    
    @staticmethod
    def parse_materials(material_breakdown: Optional[str]) -> List[str]:
        """
        Parse material breakdown string and extract individual materials.
        
        Examples:
        - "80% merino wool 20% nylon" -> ["merino", "nylon"]
        - "50% mohair, 20% nylon, 30% cashmere" -> ["mohair", "nylon", "cashmere"]
        - "80% Acrylic, 20% Wool" -> ["acrylic", "wool"]
        - "100% acrylic" -> ["acrylic"]
        - "merino, nylon" -> ["merino", "nylon"]
        
        Args:
            material_breakdown: Material breakdown string (e.g., "80% merino wool 20% nylon")
        
        Returns:
            List of unique material names (normalized, lowercase)
        """
        if not material_breakdown:
            return []
        
        materials = set()
        
        # Strategy: First extract all "XX% material" patterns, then handle remaining text
        # This handles both comma-separated and space-separated formats
        
        # Pattern to match "XX% material" - captures the material part
        # Matches: "80% merino wool", "20% nylon", "100% acrylic"
        percent_pattern = r'(\d+)%\s*([^,\d]+?)(?=\s*\d+%|,|$)'
        percent_matches = re.findall(percent_pattern, material_breakdown, re.IGNORECASE)
        
        # Extract materials from percentage matches
        for percent, material_text in percent_matches:
            material_text = material_text.strip()
            if material_text:
                # Process this material
                material = YarnService._extract_material_name(material_text)
                if material:
                    materials.add(material)
        
        # Also check for materials without percentages (comma-separated)
        # Remove all percentage patterns first
        remaining_text = re.sub(r'\d+%\s*[^,\d]+?(?=\s*\d+%|,|$)', '', material_breakdown, flags=re.IGNORECASE)
        # Split by comma and process remaining parts
        if remaining_text.strip():
            parts = re.split(r',', remaining_text)
            for part in parts:
                part = part.strip()
                if part and not re.match(r'^\d+%', part, re.IGNORECASE):
                    material = YarnService._extract_material_name(part)
                    if material:
                        materials.add(material)
        
        return sorted(list(materials))
    
    @staticmethod
    def _extract_material_name(material_text: str) -> Optional[str]:
        """
        Extract and normalize a material name from text.
        
        Uses material_options normalization to map variations to standard materials.
        
        Args:
            material_text: Raw material text (e.g., "merino wool", "nylon", "wool")
        
        Returns:
            Normalized material name (standard material or lowercase) or None if invalid
        """
        if not material_text:
            return None
        
        material = material_text.strip()
        
        # Remove common descriptor words that come after the material name
        # "merino wool" -> "merino", "cashmere wool" -> "cashmere"
        # But "wool" by itself should stay as "wool"
        descriptor_pattern = r'\b(wool|fiber|yarn|fabric|thread|blend)\b'
        
        # Check if the whole text is just a descriptor (like "wool" alone)
        if re.match(r'^' + descriptor_pattern + r'$', material, re.IGNORECASE):
            # It's a standalone material, keep it
            pass
        else:
            # Remove descriptors from the end
            cleaned = re.sub(descriptor_pattern + r'$', '', material, flags=re.IGNORECASE).strip()
            # If removing descriptor left nothing, try removing from anywhere
            if not cleaned:
                cleaned = re.sub(descriptor_pattern, '', material, flags=re.IGNORECASE).strip()
                if not cleaned:
                    cleaned = material
            material = cleaned
        
        # Remove any remaining percentages
        material = re.sub(r'\d+%', '', material, flags=re.IGNORECASE).strip()
        # Remove common prefixes
        material = re.sub(r'^(and|or|with|plus)\s+', '', material, flags=re.IGNORECASE).strip()
        # Clean up extra spaces
        material = ' '.join(material.split())
        
        if material and len(material) > 1:  # Must be at least 2 characters
            # Normalize to lowercase first
            material_lower = material.lower()
            
            # Use material normalization to map to standard materials
            from app.models.material_options import normalize_material
            normalized = normalize_material(material_lower)
            
            return normalized if normalized else material_lower
        
        return None
    
    @staticmethod
    def create_yarn(
        db: Session,
        brand_name: str,
        yarn_name: str,
        color_name: str,
        yarn_weight: int,
        grams_per_skein: float,
        meters_per_skein: float,
        generalized_colors: Optional[List[str]] = None,
        material_breakdown: Optional[str] = None,
        care_instruction_ids: Optional[List[int]] = None,
        yarn_photo_url: Optional[str] = None,
        label_photo_url: Optional[str] = None,
        notes: Optional[str] = None,
        is_favorite: bool = False,
    ) -> Yarn:
        """
        Create a new yarn entry.
        
        Args:
            db: Database session
            brand_name: Brand of the yarn (e.g., "Red Heart")
            yarn_name: Name of the yarn line (e.g., "Super Saver")
            color_name: Color name (e.g., "Cherry Red")
            yarn_weight: Weight category ID (0=lace, 1=fingering, 2=sock, etc.)
            grams_per_skein: Grams in one skein
            meters_per_skein: Meters in one skein
            generalized_colors: List of color options for sorting (optional, multiselect)
            material_breakdown: Material composition (optional)
            care_instruction_ids: List of care instruction IDs (optional, multiselect)
            yarn_photo_url: URL/path to yarn photo (optional)
            label_photo_url: URL/path to label photo (optional)
            notes: Notes about this yarn (optional)
            is_favorite: Whether this yarn is favorited (default: False)
        
        Returns:
            Yarn: The created yarn object
        
        Raises:
            ValueError: If a yarn with the same brand_name, yarn_name, and color_name already exists
        """
        # Check for duplicate yarn (same brand, name, and color)
        existing_yarn = db.query(Yarn).filter(
            Yarn.brand_name == brand_name,
            Yarn.yarn_name == yarn_name,
            Yarn.color_name == color_name
        ).first()
        
        if existing_yarn:
            raise ValueError(
                f"Yarn already exists: '{brand_name} {yarn_name}' in color '{color_name}'."
            )
        
        # Validate material_breakdown if provided
        if material_breakdown:
            from app.services.validation_service import ValidationService
            is_valid, error_message = ValidationService.validate_material_breakdown(material_breakdown)
            if not is_valid:
                raise ValueError(error_message)
            
            # Parse materials from breakdown
            materials = YarnService.parse_materials(material_breakdown)
            
            # If parsing resulted in empty list but breakdown was provided, that's a failure
            if not materials:
                raise ValueError(
                    "Could not parse any materials from the material breakdown. "
                    "Please check your input and try again. "
                    "Example formats: '80% merino wool 20% nylon' or 'acrylic, wool'"
                )
        else:
            materials = []
        
        yarn = Yarn(
            brand_name=brand_name,
            yarn_name=yarn_name,
            color_name=color_name,
            yarn_weight=yarn_weight,
            grams_per_skein=grams_per_skein,
            meters_per_skein=meters_per_skein,
            generalized_colors=generalized_colors or [],
            material_breakdown=material_breakdown,
            materials=materials,
            care_instruction_ids=care_instruction_ids or [],
            yarn_photo_url=yarn_photo_url,
            label_photo_url=label_photo_url,
            notes=notes,
            is_favorite=1 if is_favorite else 0,
        )
        db.add(yarn)
        db.commit()
        db.refresh(yarn)
        
        # Automatically create a stash entry with 0g for the new yarn
        # This ensures every yarn always has a stash entry, making them interchangeable
        from app.services.stash_service import StashService
        StashService.get_or_create_stash_entry(db, yarn.id)
        
        return yarn
    
    @staticmethod
    def get_yarn(db: Session, yarn_id: int) -> Optional[Yarn]:
        """
        Get a yarn by ID.
        
        Args:
            db: Database session
            yarn_id: ID of the yarn to retrieve
        
        Returns:
            Yarn if found, None otherwise
        """
        return db.query(Yarn).filter(Yarn.id == yarn_id).first()
    
    @staticmethod
    def get_all_yarns(db: Session, skip: int = 0, limit: int = 100) -> List[Yarn]:
        """
        Get all yarns with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
        
        Returns:
            List of Yarn objects
        """
        return db.query(Yarn).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_yarns_by_brand(db: Session, brand_name: str) -> List[Yarn]:
        """
        Get all yarns from a specific brand.
        
        Useful for autocomplete functionality in the frontend.
        
        Args:
            db: Database session
            brand_name: Brand name to search for
        
        Returns:
            List of Yarn objects from that brand
        """
        return db.query(Yarn).filter(Yarn.brand_name == brand_name).all()
    
    @staticmethod
    def get_yarn_properties_by_brand_and_name(
        db: Session, 
        brand_name: str, 
        yarn_name: str
    ) -> Optional[Yarn]:
        """
        Get yarn properties by brand name and yarn name (ignoring color).
        
        Used to autocomplete form fields when adding a new color of an existing yarn.
        Returns the first matching yarn (all colors of the same yarn have same properties).
        
        Args:
            db: Database session
            brand_name: Brand name (exact match)
            yarn_name: Yarn name (exact match)
        
        Returns:
            First Yarn object matching brand and name, or None if not found
        """
        return db.query(Yarn).filter(
            Yarn.brand_name == brand_name,
            Yarn.yarn_name == yarn_name
        ).first()
    
    @staticmethod
    def search_brands(db: Session, search_term: str) -> List[str]:
        """
        Search for brand names (for autocomplete).
        
        Returns unique brand names that match the search term.
        
        Args:
            db: Database session
            search_term: Partial brand name to search for
        
        Returns:
            List of unique brand names (strings)
        """
        # Case-insensitive search
        yarns = db.query(Yarn.brand_name).filter(
            Yarn.brand_name.ilike(f"%{search_term}%")
        ).distinct().all()
        return [brand[0] for brand in yarns]
    
    @staticmethod
    def search_yarn_names(db: Session, search_term: str, brand_name: Optional[str] = None) -> List[str]:
        """
        Search for yarn names (for autocomplete).
        
        Returns unique yarn names that match the search term.
        If brand_name is provided, only returns yarn names for that brand.
        
        Args:
            db: Database session
            search_term: Partial yarn name to search for
            brand_name: Optional brand name to filter by
        
        Returns:
            List of unique yarn names (strings)
        """
        query = db.query(Yarn.yarn_name).filter(
            Yarn.yarn_name.ilike(f"%{search_term}%")
        )
        
        if brand_name:
            query = query.filter(Yarn.brand_name == brand_name)
        
        yarns = query.distinct().all()
        return [name[0] for name in yarns]
    
    @staticmethod
    def search_color_names(db: Session, search_term: str) -> List[str]:
        """
        Search for color names (for autocomplete).
        
        Returns unique color names that match the search term.
        
        Args:
            db: Database session
            search_term: Partial color name to search for
        
        Returns:
            List of unique color names (strings)
        """
        yarns = db.query(Yarn.color_name).filter(
            Yarn.color_name.ilike(f"%{search_term}%")
        ).distinct().all()
        return [color[0] for color in yarns]
    
    @staticmethod
    def search_materials(db: Session, search_term: str) -> List[str]:
        """
        Search for individual materials (for autocomplete).
        
        Returns unique individual materials that match the search term.
        Searches in the materials JSON array, not the full breakdown.
        Case-insensitive search, returns materials in lowercase.
        
        Args:
            db: Database session
            search_term: Partial material name to search for (case-insensitive)
        
        Returns:
            List of unique material names (strings, lowercase)
        """
        # Get all yarns with materials
        yarns = db.query(Yarn.materials).filter(
            Yarn.materials.isnot(None)
        ).all()
        
        # Extract all materials and filter by search term (case-insensitive)
        all_materials = set()
        search_lower = search_term.lower()
        
        for yarn_materials in yarns:
            if yarn_materials[0]:  # Check if materials array exists
                for material in yarn_materials[0]:
                    # Materials are stored in lowercase, so compare directly
                    if search_lower in material.lower():
                        all_materials.add(material.lower())  # Ensure lowercase
        
        return sorted(list(all_materials))
    
    @staticmethod
    def update_yarn(
        db: Session,
        yarn_id: int,
        **kwargs
    ) -> Optional[Yarn]:
        """
        Update yarn properties.
        
        Only updates fields that are provided in kwargs.
        
        Args:
            db: Database session
            yarn_id: ID of yarn to update
            **kwargs: Fields to update (e.g., brand_name="New Brand")
        
        Returns:
            Updated Yarn object, or None if not found
        """
        yarn = db.query(Yarn).filter(Yarn.id == yarn_id).first()
        if not yarn:
            return None
        
        # Handle photo URL updates - delete old files if URLs are being cleared or replaced
        if 'yarn_photo_url' in kwargs:
            old_url = yarn.yarn_photo_url
            new_url = kwargs.get('yarn_photo_url')
            # Delete old file if it exists and is being replaced or cleared
            if old_url and (new_url is None or new_url == '' or new_url != old_url):
                filename = FileService.extract_filename_from_url(old_url)
                if filename:
                    FileService.delete_file(filename)
        
        if 'label_photo_url' in kwargs:
            old_url = yarn.label_photo_url
            new_url = kwargs.get('label_photo_url')
            # Delete old file if it exists and is being replaced or cleared
            if old_url and (new_url is None or new_url == '' or new_url != old_url):
                filename = FileService.extract_filename_from_url(old_url)
                if filename:
                    FileService.delete_file(filename)
        
        # Validate material_breakdown if being updated
        if 'material_breakdown' in kwargs and kwargs['material_breakdown'] is not None:
            from app.services.validation_service import ValidationService
            is_valid, error_message = ValidationService.validate_material_breakdown(kwargs['material_breakdown'])
            if not is_valid:
                raise ValueError(error_message)
            
            # Parse materials from breakdown
            materials = YarnService.parse_materials(kwargs['material_breakdown'])
            
            # If parsing resulted in empty list but breakdown was provided, that's a failure
            if not materials:
                raise ValueError(
                    "Could not parse any materials from the material breakdown. "
                    "Please check your input and try again. "
                    "Example formats: '80% merino wool 20% nylon' or 'acrylic, wool'"
                )
            # Update materials array as well
            kwargs['materials'] = materials
        
        # Update only provided fields
        for key, value in kwargs.items():
            if hasattr(yarn, key):
                # Handle None values for optional photo fields (to clear them)
                if value is None and key in ['yarn_photo_url', 'label_photo_url']:
                    setattr(yarn, key, None)
                elif value is not None:
                    setattr(yarn, key, value)
        
        db.commit()
        db.refresh(yarn)
        return yarn
    
    @staticmethod
    def delete_yarn(db: Session, yarn_id: int) -> bool:
        """
        Delete a yarn.
        
        Note: This will also delete associated stash entries due to CASCADE.
        Cannot delete if yarn is used in any projects.
        
        Args:
            db: Database session
            yarn_id: ID of yarn to delete
        
        Returns:
            True if deleted, False if not found
        
        Raises:
            ValueError: If yarn is used in any projects
        """
        yarn = db.query(Yarn).filter(Yarn.id == yarn_id).first()
        if not yarn:
            return False
        
        # Check if yarn is used in any projects
        project_usages = db.query(ProjectYarnUsage).filter(ProjectYarnUsage.yarn_id == yarn_id).all()
        if project_usages:
            project_count = len(project_usages)
            raise ValueError(
                f"Cannot delete yarn: This yarn is used in {project_count} project(s). "
                f"Please remove it from all projects before deleting."
            )
        
        # Delete associated photo files
        if yarn.yarn_photo_url:
            filename = FileService.extract_filename_from_url(yarn.yarn_photo_url)
            if filename:
                FileService.delete_file(filename)
        
        if yarn.label_photo_url:
            filename = FileService.extract_filename_from_url(yarn.label_photo_url)
            if filename:
                FileService.delete_file(filename)
        
        db.delete(yarn)
        db.commit()
        return True
