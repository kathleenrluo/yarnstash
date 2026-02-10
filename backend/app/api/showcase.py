"""
Showcase API — read-only data for Kat's Gallery (b.lakout.kat@gmail.com).

No auth required. Used by the Gallery page to display a fixed user's stash and projects.
"""

import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.user import User
from app.api.schemas import YarnResponse
from app.services.stash_service import StashService
from app.services.project_service import ProjectService
from app.services.yarn_service import YarnService

SHOWCASE_EMAIL = os.getenv("SHOWCASE_EMAIL", "b.lakout.kat@gmail.com")

router = APIRouter(prefix="/showcase", tags=["showcase"])


def get_showcase_user_id(db: Session) -> int:
    """Resolve showcase user id from email. Raises 503 if not configured."""
    user = db.query(User).filter(User.email == SHOWCASE_EMAIL).first()
    if not user:
        raise HTTPException(
            status_code=503,
            detail=f"Showcase not configured: user {SHOWCASE_EMAIL} not found. Sign in once with that account.",
        )
    return user.id


@router.get("/stash")
def get_showcase_stash(db: Session = Depends(get_db)):
    """Get showcase user's stash with yarn info (read-only)."""
    user_id = get_showcase_user_id(db)
    return StashService.get_stash_with_yarn_info(db=db, user_id=user_id)


@router.get("/stash/{yarn_id}")
def get_showcase_stash_entry(yarn_id: int, db: Session = Depends(get_db)):
    """Get showcase stash entry for a yarn (read-only). For gallery yarn modal."""
    user_id = get_showcase_user_id(db)
    entry = StashService.get_stash_entry(db=db, user_id=user_id, yarn_id=yarn_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Stash entry not found")
    return {
        "id": entry.id,
        "yarn_id": entry.yarn_id,
        "total_grams_owned": entry.total_grams_owned,
        "last_updated": entry.last_updated.isoformat() if entry.last_updated else None,
    }


@router.get("/yarns/{yarn_id}", response_model=YarnResponse)
def get_showcase_yarn(yarn_id: int, db: Session = Depends(get_db)):
    """Get one showcase yarn by id (read-only). For gallery yarn modal."""
    user_id = get_showcase_user_id(db)
    yarn = YarnService.get_yarn(db=db, yarn_id=yarn_id, user_id=user_id)
    if not yarn:
        raise HTTPException(status_code=404, detail="Yarn not found")
    return YarnResponse.model_validate(yarn)


@router.get("/projects")
def get_showcase_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Get showcase user's projects (read-only)."""
    user_id = get_showcase_user_id(db)
    projects = ProjectService.get_all_projects(db=db, user_id=user_id, skip=skip, limit=limit)
    return projects


@router.get("/projects/by-yarn-id")
def get_showcase_projects_by_yarn_id(
    yarn_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
):
    """Get showcase projects that use this yarn (read-only)."""
    user_id = get_showcase_user_id(db)
    projects = ProjectService.get_projects_by_yarn_id(db=db, user_id=user_id, yarn_id=yarn_id)
    return {"projects": projects or []}


@router.get("/projects/by-yarn")
def get_showcase_projects_by_yarn_name(
    brand_name: str = Query(..., description="Brand name"),
    yarn_name: str = Query(..., description="Yarn name"),
    db: Session = Depends(get_db),
):
    """Get showcase projects that use a yarn with this brand/name (read-only)."""
    user_id = get_showcase_user_id(db)
    projects = ProjectService.get_projects_by_yarn_name(
        db=db, user_id=user_id, brand_name=brand_name, yarn_name=yarn_name
    )
    return {"projects": projects or []}


@router.get("/projects/{project_id}/details")
def get_showcase_project_details(project_id: int, db: Session = Depends(get_db)):
    """Get one showcase project with yarn usage details (read-only)."""
    user_id = get_showcase_user_id(db)
    project = ProjectService.get_project_with_yarns(db=db, project_id=project_id, user_id=user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
