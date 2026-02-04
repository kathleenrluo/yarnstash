"""
Project Service

Handles all business logic related to projects.
This includes creating projects, tracking yarn usage, and computing care instructions.
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
from app.models.project import Project, ProjectYarnUsage
from app.models.yarn import Yarn
from app.services.stash_service import StashService
from app.services.care_instruction_service import CareInstructionService
from app.services.file_service import FileService


class ProjectService:
    """
    Service for managing projects.
    
    This service handles:
    - Creating and updating projects
    - Tracking yarn usage in projects
    - Automatically updating stash when yarn is used
    - Computing care instructions from yarns used
    """
    
    @staticmethod
    def create_project(
        db: Session,
        name: str,
        description: Optional[str] = None,
        notes: Optional[str] = None,
        craft_type: Optional[str] = None,
        date_completed: Optional[str] = None,
        hook_size: Optional[str] = None,
        pattern_type: Optional[str] = None,
        pattern_reference: Optional[str] = None,
        is_favorite: bool = False,
        tags: Optional[List[str]] = None,
        image_urls: Optional[List[str]] = None,
        primary_image_index: int = 0,
        manual_care_instruction_ids: Optional[List[int]] = None,
        yarn_usage: Optional[List[Dict]] = None,
    ) -> Project:
        """
        Create a new project.
        
        Args:
            db: Database session
            name: Project name
            description: Project description (optional)
            notes: Project notes (optional)
            craft_type: Craft type - "knit" or "crochet" (optional)
            date_completed: Completion date - can be null, year (e.g., "2024"), month+year (e.g., "2024-03"), or full date (e.g., "2024-03-15")
            hook_size: Hook/needle size used (optional, e.g., "5mm" or "5mm (G)")
            pattern_type: Type of pattern - "pdf", "link", or "freehand" (optional)
            pattern_reference: URL or reference to pattern (optional)
            manual_care_instruction_ids: Manual care instruction IDs (optional, overrides computed)
            yarn_usage: List of yarn usage dicts (optional)
        
        Returns:
            Created Project object
        
        Raises:
            ValueError: If date_completed format is invalid, or if no yarn usage and no manual care instructions
        """
        # Validate date_completed if provided
        if date_completed:
            from app.services.validation_service import ValidationService
            is_valid, error_message = ValidationService.validate_date_completed(date_completed)
            if not is_valid:
                raise ValueError(error_message)
        
        # Validate: if no yarn usage, manual care instructions are required
        has_yarn_usage = yarn_usage and len(yarn_usage) > 0
        has_manual_care = manual_care_instruction_ids and len(manual_care_instruction_ids) > 0
        
        if not has_yarn_usage and not has_manual_care:
            raise ValueError("Care instructions are required when no yarn usage is specified. Please add manual care instructions or attach yarns to the project.")
        
        # Validate care instruction IDs if provided
        if manual_care_instruction_ids:
            from app.models.care_instructions import ALL_CARE_INSTRUCTIONS
            invalid_ids = [id for id in manual_care_instruction_ids if id not in ALL_CARE_INSTRUCTIONS]
            if invalid_ids:
                raise ValueError(f"Invalid care instruction IDs: {invalid_ids}. Valid IDs are: {ALL_CARE_INSTRUCTIONS}")
        
        project = Project(
            name=name,
            description=description,
            notes=notes,
            craft_type=craft_type,
            date_completed=date_completed,
            hook_size=hook_size,
            pattern_type=pattern_type,
            pattern_reference=pattern_reference,
            is_favorite=1 if is_favorite else 0,
            tags=tags or [],
            image_urls=image_urls,
            primary_image_index=primary_image_index,
            manual_care_instruction_ids=manual_care_instruction_ids or [],
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        
        # If manual care instructions are provided, format them
        if manual_care_instruction_ids:
            from app.models.care_instructions import format_care_instructions
            project.computed_care_instruction = format_care_instructions(manual_care_instruction_ids)
            db.commit()
        
        return project
    
    @staticmethod
    def get_project(db: Session, project_id: int) -> Optional[Project]:
        """
        Get a project by ID.
        
        Args:
            db: Database session
            project_id: ID of the project
        
        Returns:
            Project if found, None otherwise
        """
        return db.query(Project).filter(Project.id == project_id).first()
    
    @staticmethod
    def get_all_projects(db: Session, skip: int = 0, limit: int = 100) -> List[Project]:
        """
        Get all projects with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Project objects
        """
        return db.query(Project).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_project(
        db: Session,
        project_id: int,
        **kwargs
    ) -> Optional[Project]:
        """
        Update project properties.
        
        Args:
            db: Database session
            project_id: ID of project to update
            **kwargs: Fields to update
        
        Returns:
            Updated Project object, or None if not found
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
        
        # Normalize empty arrays to None for image_urls and video_urls (before processing)
        if 'image_urls' in kwargs and kwargs['image_urls'] == []:
            kwargs['image_urls'] = None
        if 'video_urls' in kwargs and kwargs['video_urls'] == []:
            kwargs['video_urls'] = None
        
        # Handle image_urls update - delete removed images from filesystem
        if 'image_urls' in kwargs:
            old_image_urls = project.image_urls or []
            new_image_urls = kwargs.get('image_urls')
            
            # Find images that were removed (only if new_image_urls is not None)
            if new_image_urls is not None:
                removed_urls = [url for url in old_image_urls if url not in new_image_urls]
            else:
                # All images removed
                removed_urls = old_image_urls
            
            # Delete removed image files
            for url in removed_urls:
                filename = FileService.extract_filename_from_url(url)
                if filename:
                    FileService.delete_file(filename)
        
        # Handle video_urls update - delete removed videos from filesystem
        if 'video_urls' in kwargs:
            old_video_urls = project.video_urls or []
            new_video_urls = kwargs.get('video_urls')
            
            # Find videos that were removed (only if new_video_urls is not None)
            if new_video_urls is not None:
                removed_urls = [url for url in old_video_urls if url not in new_video_urls]
            else:
                # All videos removed
                removed_urls = old_video_urls
            
            # Delete removed video files
            for url in removed_urls:
                filename = FileService.extract_filename_from_url(url)
                if filename:
                    FileService.delete_file(filename)
        
        # Validate date_completed if provided
        if 'date_completed' in kwargs and kwargs['date_completed'] is not None:
            from app.services.validation_service import ValidationService
            is_valid, error_message = ValidationService.validate_date_completed(kwargs['date_completed'])
            if not is_valid:
                raise ValueError(error_message)
        
        # Handle manual_care_instruction_ids specially
        if 'manual_care_instruction_ids' in kwargs:
            manual_care_ids = kwargs.pop('manual_care_instruction_ids')
            # Validate care instruction IDs if provided
            if manual_care_ids and len(manual_care_ids) > 0:
                from app.models.care_instructions import ALL_CARE_INSTRUCTIONS
                invalid_ids = [id for id in manual_care_ids if id not in ALL_CARE_INSTRUCTIONS]
                if invalid_ids:
                    raise ValueError(f"Invalid care instruction IDs: {invalid_ids}. Valid IDs are: {ALL_CARE_INSTRUCTIONS}")
            
            project.manual_care_instruction_ids = manual_care_ids or []
            # Format manual care instructions
            if manual_care_ids and len(manual_care_ids) > 0:
                from app.models.care_instructions import format_care_instructions
                project.computed_care_instruction = format_care_instructions(manual_care_ids)
            else:
                # If manual care is cleared, recompute from yarns
                ProjectService._recompute_care_instructions(db, project_id)
        
        # Validate: if no yarn usage and no manual care instructions, require manual care
        if 'manual_care_instruction_ids' not in kwargs:  # Only validate if we're not updating manual care
            usages = db.query(ProjectYarnUsage).filter(ProjectYarnUsage.project_id == project_id).all()
            has_yarn_usage = len(usages) > 0
            has_manual_care = project.manual_care_instruction_ids and len(project.manual_care_instruction_ids) > 0
            
            if not has_yarn_usage and not has_manual_care:
                raise ValueError("Care instructions are required when no yarn usage is specified. Please add manual care instructions or attach yarns to the project.")
        
        # Update only provided fields
        for key, value in kwargs.items():
            if hasattr(project, key):
                # Handle None values for optional fields (to clear them)
                if value is None and key in ['image_urls', 'video_urls', 'date_completed']:
                    # Clear the field
                    setattr(project, key, None)
                elif value is not None:
                    setattr(project, key, value)
        
        db.commit()
        db.refresh(project)
        return project
    
    @staticmethod
    def add_yarn_usage(
        db: Session,
        project_id: int,
        yarn_id: int,
        grams_used: float,
        update_stash: bool = True
    ) -> ProjectYarnUsage:
        """
        Record yarn usage in a project.
        
        This method:
        1. Creates a ProjectYarnUsage entry
        2. Optionally deducts yarn from stash
        3. Recomputes care instructions for the project
        
        Args:
            db: Database session
            project_id: ID of the project
            yarn_id: ID of the yarn used
            grams_used: Grams of yarn used
            update_stash: Whether to deduct from stash (default: True)
        
        Returns:
            Created ProjectYarnUsage object
        
        Raises:
            ValueError: If project or yarn doesn't exist, or insufficient stash
        """
        # Verify project exists
        project = ProjectService.get_project(db, project_id)
        if not project:
            raise ValueError(f"Project with id {project_id} does not exist")
        
        # Verify yarn exists
        yarn = db.query(Yarn).filter(Yarn.id == yarn_id).first()
        if not yarn:
            raise ValueError(f"Yarn with id {yarn_id} does not exist")
        
        # Deduct from stash if requested and grams_used > 0
        # If grams_used is 0, it means "unknown" so we don't update stash
        if update_stash and grams_used > 0:
            StashService.use_yarn(db, yarn_id, grams_used)
        
        # Create usage record
        usage = ProjectYarnUsage(
            project_id=project_id,
            yarn_id=yarn_id,
            grams_used=grams_used
        )
        db.add(usage)
        db.commit()
        db.refresh(usage)
        
        # Recompute care instructions
        ProjectService._recompute_care_instructions(db, project_id)
        
        return usage
    
    @staticmethod
    def remove_yarn_usage(
        db: Session,
        project_id: int,
        usage_id: int
    ) -> bool:
        """
        Remove yarn usage from a project.
        
        Note: This does NOT restore stash - yarn that was used remains used.
        
        Args:
            db: Database session
            project_id: ID of the project
            usage_id: ID of the ProjectYarnUsage record to remove
        
        Returns:
            True if removed, False if not found
        
        Raises:
            ValueError: If usage doesn't belong to the project
        """
        usage = db.query(ProjectYarnUsage).filter(
            ProjectYarnUsage.id == usage_id,
            ProjectYarnUsage.project_id == project_id
        ).first()
        
        if not usage:
            return False
        
        db.delete(usage)
        db.commit()
        
        # Recompute care instructions
        ProjectService._recompute_care_instructions(db, project_id)
        
        return True
    
    @staticmethod
    def update_yarn_usage(
        db: Session,
        project_id: int,
        usage_id: int,
        grams_used: Optional[float] = None,
        update_stash: Optional[bool] = None
    ) -> Optional[ProjectYarnUsage]:
        """
        Update yarn usage in a project.
        
        This can update the grams used and optionally adjust stash.
        If update_stash is True and grams_used changes, stash will be adjusted.
        
        Args:
            db: Database session
            project_id: ID of the project
            usage_id: ID of the ProjectYarnUsage record to update
            grams_used: New grams used (optional)
            update_stash: Whether to update stash (optional, only used if grams_used changes)
        
        Returns:
            Updated ProjectYarnUsage object, or None if not found
        
        Raises:
            ValueError: If usage doesn't belong to the project, or insufficient stash
        """
        usage = db.query(ProjectYarnUsage).filter(
            ProjectYarnUsage.id == usage_id,
            ProjectYarnUsage.project_id == project_id
        ).first()
        
        if not usage:
            return None
        
        # If grams_used is being updated, adjust stash based on update_stash flag
        if grams_used is not None and grams_used != usage.grams_used:
            if update_stash is True:
                # If update_stash is True: Adjust stash by exact difference (original - new)
                difference = usage.grams_used - grams_used  # original - new
                if difference > 0:
                    # Adding back to stash (e.g., 10g -> 5g adds 5g back, 10g -> 0g adds 10g back)
                    StashService.add_yarn_by_grams(db, usage.yarn_id, difference)
                elif difference < 0:
                    # Deducting from stash (e.g., 5g -> 10g deducts 5g)
                    StashService.use_yarn(db, usage.yarn_id, abs(difference))
                # If difference == 0, no change needed
            # If update_stash is False: Do nothing to stash (no changes at all)
        
        # Update grams_used if provided
        if grams_used is not None:
            usage.grams_used = grams_used
        
        db.commit()
        db.refresh(usage)
        
        # Recompute care instructions
        ProjectService._recompute_care_instructions(db, project_id)
        
        return usage
    
    @staticmethod
    def _recompute_care_instructions(db: Session, project_id: int) -> None:
        """
        Recompute care instructions for a project based on all yarns used.
        
        This is called automatically when yarn usage changes.
        Only recomputes if manual care instructions are not set.
        
        Args:
            db: Database session
            project_id: ID of the project
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return
        
        # If manual care instructions are set, don't recompute
        if project.manual_care_instruction_ids and len(project.manual_care_instruction_ids) > 0:
            # Format manual care instructions
            from app.models.care_instructions import format_care_instructions
            project.computed_care_instruction = format_care_instructions(project.manual_care_instruction_ids)
            db.commit()
            return
        
        # Get all yarns used in this project
        usages = db.query(ProjectYarnUsage).filter(
            ProjectYarnUsage.project_id == project_id
        ).all()
        
        if not usages:
            project.computed_care_instruction = None
            db.commit()
            return
        
        # Get yarn objects
        yarn_ids = [usage.yarn_id for usage in usages]
        yarns = db.query(Yarn).filter(Yarn.id.in_(yarn_ids)).all()
        
        # Compute care instruction
        care_instruction = CareInstructionService.compute_care_instruction(yarns)
        project.computed_care_instruction = care_instruction
        
        db.commit()
    
    @staticmethod
    def delete_project(db: Session, project_id: int) -> bool:
        """
        Delete a project.
        
        Note: This will also delete associated yarn usage records due to CASCADE.
        However, stash is NOT restored - yarn that was used remains used.
        Also deletes all associated image files from the uploads folder.
        
        Args:
            db: Database session
            project_id: ID of project to delete
        
        Returns:
            True if deleted, False if not found
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return False
        
        # Delete associated image files
        if project.image_urls:
            for url in project.image_urls:
                filename = FileService.extract_filename_from_url(url)
                if filename:
                    FileService.delete_file(filename)
        
        # Delete associated video files (if any)
        if project.video_urls:
            for url in project.video_urls:
                filename = FileService.extract_filename_from_url(url)
                if filename:
                    FileService.delete_file(filename)
        
        db.delete(project)
        db.commit()
        return True
    
    @staticmethod
    def get_project_with_yarns(db: Session, project_id: int) -> Optional[Dict]:
        """
        Get a project with all its yarn usage information.
        
        This is useful for the frontend to display project details.
        
        Args:
            db: Database session
            project_id: ID of the project
        
        Returns:
            Dictionary containing project and yarn usage info, or None
        """
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return None
        
        # Get yarn usages
        usages = db.query(ProjectYarnUsage).filter(
            ProjectYarnUsage.project_id == project_id
        ).all()
        
        # Get yarn details
        yarn_details = []
        for usage in usages:
            yarn = db.query(Yarn).filter(Yarn.id == usage.yarn_id).first()
            if yarn:
                yarn_details.append({
                    "usage_id": usage.id,
                    "yarn_id": yarn.id,
                    "brand_name": yarn.brand_name,
                    "yarn_name": yarn.yarn_name,
                    "color_name": yarn.color_name,
                    "grams_used": usage.grams_used,
                })
        
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "notes": project.notes,
            "craft_type": project.craft_type,
            "date_completed": project.date_completed,
            "hook_size": project.hook_size,
            "pattern_type": project.pattern_type,
            "pattern_reference": project.pattern_reference,
            "computed_care_instruction": project.computed_care_instruction,
            "manual_care_instruction_ids": project.manual_care_instruction_ids or [],
            "is_favorite": bool(project.is_favorite),
            "tags": project.tags or [],
            "image_urls": project.image_urls,
            "primary_image_index": project.primary_image_index if project.primary_image_index is not None else 0,
            "video_urls": project.video_urls,
            "yarns_used": yarn_details,
        }

    @staticmethod
    def get_projects_by_yarn_name(db: Session, brand_name: str, yarn_name: str) -> List[Dict]:
        """
        Get all projects that use a yarn with the given brand and yarn name (color insensitive).
        
        Args:
            db: Database session
            brand_name: Brand name of the yarn
            yarn_name: Yarn name (color insensitive)
        
        Returns:
            List of project dictionaries with basic info
        """
        # Find all yarns with matching brand and yarn name (any color)
        yarns = db.query(Yarn).filter(
            Yarn.brand_name.ilike(f"%{brand_name}%"),
            Yarn.yarn_name.ilike(f"%{yarn_name}%")
        ).all()
        
        if not yarns:
            return []
        
        yarn_ids = [yarn.id for yarn in yarns]
        
        # Find all projects that use any of these yarns
        project_usages = db.query(ProjectYarnUsage).filter(
            ProjectYarnUsage.yarn_id.in_(yarn_ids)
        ).all()
        
        project_ids = list(set([usage.project_id for usage in project_usages]))
        
        if not project_ids:
            return []
        
        # Get project details
        projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
        
        return [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "craft_type": project.craft_type,
                "date_completed": project.date_completed,
                "is_favorite": bool(project.is_favorite),
                "tags": project.tags or [],
            }
            for project in projects
        ]

    @staticmethod
    def get_projects_by_yarn_id(db: Session, yarn_id: int) -> List[Dict]:
        """
        Get all projects that use a specific yarn by yarn_id (color-specific).

        Args:
            db: Database session
            yarn_id: ID of the yarn

        Returns:
            List of project dictionaries with basic info
        """
        project_usages = (
            db.query(ProjectYarnUsage)
            .filter(ProjectYarnUsage.yarn_id == yarn_id)
            .all()
        )

        project_ids = list(set([usage.project_id for usage in project_usages]))
        if not project_ids:
            return []

        projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
        return [
            {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "craft_type": project.craft_type,
                "date_completed": project.date_completed,
                "is_favorite": bool(project.is_favorite),
                "tags": project.tags or [],
            }
            for project in projects
        ]
