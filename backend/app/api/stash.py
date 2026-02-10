"""
Stash API Endpoints

REST API endpoints for managing yarn stash (inventory).
All business logic is delegated to StashService.
Requires authentication; stash is scoped to the current user.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.user import User
from app.api.auth import get_current_user
from app.services.stash_service import StashService
from app.api.schemas import (
    StashEntryResponse,
    AddYarnByGrams,
    AddYarnBySkeins,
    UseYarn,
    SetStashQuantity,
)

router = APIRouter(prefix="/stash", tags=["stash"])


@router.get("/")
def get_all_stash(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all stash entries with yarn info for the current user."""
    return StashService.get_stash_with_yarn_info(db=db, user_id=current_user.id)


@router.get("/{yarn_id}", response_model=StashEntryResponse)
def get_stash_entry(
    yarn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get stash entry for a specific yarn (must belong to current user)."""
    stash_entry = StashService.get_stash_entry(db=db, yarn_id=yarn_id, user_id=current_user.id)
    if not stash_entry:
        raise HTTPException(status_code=404, detail="Stash entry not found")
    return stash_entry


@router.post("/add/grams", response_model=StashEntryResponse)
def add_yarn_by_grams(
    data: AddYarnByGrams,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add yarn to stash by grams (yarn must belong to current user)."""
    try:
        return StashService.add_yarn_by_grams(
            db=db,
            user_id=current_user.id,
            yarn_id=data.yarn_id,
            grams=data.grams
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/add/skeins", response_model=StashEntryResponse)
def add_yarn_by_skeins(
    data: AddYarnBySkeins,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add yarn to stash by skeins (yarn must belong to current user)."""
    try:
        return StashService.add_yarn_by_skeins(
            db=db,
            user_id=current_user.id,
            yarn_id=data.yarn_id,
            num_skeins=data.num_skeins
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/use", response_model=StashEntryResponse)
def use_yarn(
    data: UseYarn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deduct yarn from stash (yarn must belong to current user)."""
    try:
        return StashService.use_yarn(
            db=db,
            user_id=current_user.id,
            yarn_id=data.yarn_id,
            grams=data.grams
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/set", response_model=StashEntryResponse)
def set_stash_quantity(
    data: SetStashQuantity,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set stash quantity for a yarn (must belong to current user)."""
    try:
        stash_entry = StashService.set_stash_quantity(
            db=db,
            user_id=current_user.id,
            yarn_id=data.yarn_id,
            grams=data.grams
        )
        if not stash_entry:
            raise HTTPException(status_code=500, detail="Failed to update stash entry")
        return stash_entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
