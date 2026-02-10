"""
Project API Endpoints

REST API endpoints for managing projects.
All business logic is delegated to ProjectService.
Requires authentication; projects are scoped to the current user.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.project_service import ProjectService
from app.api.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AddYarnUsage,
    UpdateYarnUsage,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project for the current user. Optionally attach yarn_usage at creation."""
    try:
        yarn_usage_list = None
        if project.yarn_usage:
            yarn_usage_list = [
                {'yarn_id': u.yarn_id, 'grams_used': u.grams_used, 'update_stash': u.update_stash}
                for u in project.yarn_usage
            ]
        created_project = ProjectService.create_project(
            db=db,
            user_id=current_user.id,
            name=project.name,
            description=project.description,
            notes=project.notes,
            craft_type=project.craft_type,
            date_completed=project.date_completed,
            hook_size=project.hook_size,
            pattern_type=project.pattern_type,
            pattern_reference=project.pattern_reference,
            is_favorite=bool(project.is_favorite),
            tags=project.tags or [],
            image_urls=project.image_urls,
            primary_image_index=project.primary_image_index or 0,
            manual_care_instruction_ids=project.manual_care_instruction_ids,
            yarn_usage=yarn_usage_list,
        )
        if project.yarn_usage:
            for usage in project.yarn_usage:
                try:
                    ProjectService.add_yarn_usage(
                        db=db,
                        project_id=created_project.id,
                        yarn_id=usage.yarn_id,
                        grams_used=usage.grams_used,
                        user_id=current_user.id,
                        update_stash=usage.update_stash,
                    )
                except ValueError as e:
                    print(f"Warning: Failed to add yarn usage for yarn_id {usage.yarn_id}: {e}")
        return created_project
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[ProjectResponse])
def get_all_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all projects for the current user with pagination."""
    return ProjectService.get_all_projects(db=db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/by-yarn")
def get_projects_by_yarn(
    brand_name: str = Query(..., description="Brand name of the yarn"),
    yarn_name: str = Query(..., description="Yarn name (color insensitive)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get projects that use the given brand/yarn name (current user only)."""
    try:
        projects = ProjectService.get_projects_by_yarn_name(
            db=db,
            user_id=current_user.id,
            brand_name=brand_name,
            yarn_name=yarn_name,
        )
        return {"projects": projects or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")


@router.get("/by-yarn-id")
def get_projects_by_yarn_id(
    yarn_id: int = Query(..., ge=1, description="Yarn ID (color-specific)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get projects that use the given yarn_id (current user only)."""
    try:
        projects = ProjectService.get_projects_by_yarn_id(db=db, user_id=current_user.id, yarn_id=yarn_id)
        return {"projects": projects or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific project by ID (must belong to current user)."""
    project = ProjectService.get_project(db=db, project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/details")
def get_project_with_yarns(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a project with yarn usage details (must belong to current user)."""
    project_data = ProjectService.get_project_with_yarns(db=db, project_id=project_id, user_id=current_user.id)
    if not project_data:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_data


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update project properties (owner only)."""
    try:
        update_data = project_update.model_dump(exclude_unset=True)
        if 'date_completed' in update_data and update_data['date_completed'] == '':
            update_data['date_completed'] = None
        project = ProjectService.update_project(db=db, project_id=project_id, user_id=current_user.id, **update_data)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Unexpected error updating project {project_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")


@router.post("/{project_id}/use-yarn", status_code=201)
def add_yarn_usage(
    project_id: int,
    usage: AddYarnUsage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record yarn usage in a project (project and yarn must belong to current user)."""
    try:
        usage_record = ProjectService.add_yarn_usage(
            db=db,
            project_id=project_id,
            yarn_id=usage.yarn_id,
            grams_used=usage.grams_used,
            user_id=current_user.id,
            update_stash=usage.update_stash,
        )
        return {
            "message": "Yarn usage recorded successfully",
            "usage_id": usage_record.id,
            "project_id": project_id,
            "yarn_id": usage.yarn_id,
            "grams_used": usage.grams_used
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}/use-yarn/{usage_id}", status_code=204)
def remove_yarn_usage(
    project_id: int,
    usage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove yarn usage from a project (owner only)."""
    success = ProjectService.remove_yarn_usage(
        db=db,
        project_id=project_id,
        usage_id=usage_id,
        user_id=current_user.id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Yarn usage not found")


@router.put("/{project_id}/use-yarn/{usage_id}")
def update_yarn_usage(
    project_id: int,
    usage_id: int,
    usage_update: UpdateYarnUsage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update yarn usage in a project (owner only)."""
    try:
        updated_usage = ProjectService.update_yarn_usage(
            db=db,
            project_id=project_id,
            usage_id=usage_id,
            user_id=current_user.id,
            grams_used=usage_update.grams_used,
            update_stash=usage_update.update_stash,
        )
        if not updated_usage:
            raise HTTPException(status_code=404, detail="Yarn usage not found")
        return {
            "message": "Yarn usage updated successfully",
            "usage_id": updated_usage.id,
            "project_id": project_id,
            "yarn_id": updated_usage.yarn_id,
            "grams_used": updated_usage.grams_used
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project (owner only)."""
    success = ProjectService.delete_project(db=db, project_id=project_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
