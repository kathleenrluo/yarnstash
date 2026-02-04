"""
Stash API Endpoints

REST API endpoints for managing yarn stash (inventory).
All business logic is delegated to StashService.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
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
def get_all_stash(db: Session = Depends(get_db)):
    """
    Get all stash entries with yarn information.
    
    Returns all stash entries, including those with 0g.
    Note: Using dict response instead of schema to avoid validation issues with nested objects.
    """
    return StashService.get_stash_with_yarn_info(db=db)


@router.get("/{yarn_id}", response_model=StashEntryResponse)
def get_stash_entry(yarn_id: int, db: Session = Depends(get_db)):
    """
    Get stash entry for a specific yarn.
    """
    stash_entry = StashService.get_stash_entry(db=db, yarn_id=yarn_id)
    if not stash_entry:
        raise HTTPException(status_code=404, detail="Stash entry not found")
    return stash_entry


@router.post("/add/grams", response_model=StashEntryResponse)
def add_yarn_by_grams(data: AddYarnByGrams, db: Session = Depends(get_db)):
    """
    Add yarn to stash by specifying grams.
    
    Use this when you know exactly how many grams you're adding.
    """
    try:
        return StashService.add_yarn_by_grams(
            db=db,
            yarn_id=data.yarn_id,
            grams=data.grams
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/add/skeins", response_model=StashEntryResponse)
def add_yarn_by_skeins(data: AddYarnBySkeins, db: Session = Depends(get_db)):
    """
    Add yarn to stash by specifying number of skeins.
    
    This method looks up the grams_per_skein from the yarn metadata
    and calculates the total grams to add.
    """
    try:
        return StashService.add_yarn_by_skeins(
            db=db,
            yarn_id=data.yarn_id,
            num_skeins=data.num_skeins
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/use", response_model=StashEntryResponse)
def use_yarn(data: UseYarn, db: Session = Depends(get_db)):
    """
    Deduct yarn from stash (when used in a project).
    
    This is typically called when recording yarn usage in a project.
    """
    try:
        return StashService.use_yarn(
            db=db,
            yarn_id=data.yarn_id,
            grams=data.grams
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/set", response_model=StashEntryResponse)
def set_stash_quantity(data: SetStashQuantity, db: Session = Depends(get_db)):
    """
    Set stash quantity to a specific amount.
    
    Use this when you want to directly set the quantity
    (e.g., "I have 64g left").
    """
    try:
        stash_entry = StashService.set_stash_quantity(
            db=db,
            yarn_id=data.yarn_id,
            grams=data.grams
        )
        # Ensure we return the stash entry
        if not stash_entry:
            raise HTTPException(status_code=500, detail="Failed to update stash entry")
        return stash_entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
