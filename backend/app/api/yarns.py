"""
Yarn API Endpoints

REST API endpoints for managing yarn metadata.
All business logic is delegated to YarnService.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db
from app.services.yarn_service import YarnService
from app.api.schemas import (
    YarnCreate,
    YarnUpdate,
    YarnResponse,
    BrandSearchResponse,
)

router = APIRouter(prefix="/yarns", tags=["yarns"])


@router.post("/", response_model=YarnResponse, status_code=201)
def create_yarn(yarn: YarnCreate, db: Session = Depends(get_db)):
    """
    Create a new yarn entry.
    
    This endpoint creates yarn metadata and automatically creates
    a stash entry with 0g. You can then update the stash quantity
    using the stash endpoints.
    """
    try:
        return YarnService.create_yarn(
            db=db,
            brand_name=yarn.brand_name,
            yarn_name=yarn.yarn_name,
            color_name=yarn.color_name,
            yarn_weight=yarn.yarn_weight,
            grams_per_skein=yarn.grams_per_skein,
            meters_per_skein=yarn.meters_per_skein,
            generalized_colors=yarn.generalized_colors,
            material_breakdown=yarn.material_breakdown,
            care_instruction_ids=yarn.care_instruction_ids,
            yarn_photo_url=yarn.yarn_photo_url,
            label_photo_url=yarn.label_photo_url,
            notes=yarn.notes,
            is_favorite=yarn.is_favorite if yarn.is_favorite is not None else False,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[YarnResponse])
def get_all_yarns(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get all yarns with pagination.
    
    Use skip and limit for pagination.
    """
    return YarnService.get_all_yarns(db=db, skip=skip, limit=limit)


@router.get("/properties", response_model=YarnResponse)
def get_yarn_properties(
    brand_name: str = Query(..., description="Brand name"),
    yarn_name: str = Query(..., description="Yarn name"),
    db: Session = Depends(get_db)
):
    """
    Get yarn properties by brand and yarn name (for autocomplete).
    
    Returns the properties of an existing yarn (any color) so the form
    can be auto-filled when adding a new color of the same yarn.
    """
    yarn = YarnService.get_yarn_properties_by_brand_and_name(
        db=db,
        brand_name=brand_name,
        yarn_name=yarn_name
    )
    if not yarn:
        raise HTTPException(status_code=404, detail="Yarn not found")
    return yarn


@router.get("/{yarn_id}", response_model=YarnResponse)
def get_yarn(yarn_id: int, db: Session = Depends(get_db)):
    """
    Get a specific yarn by ID.
    """
    yarn = YarnService.get_yarn(db=db, yarn_id=yarn_id)
    if not yarn:
        raise HTTPException(status_code=404, detail="Yarn not found")
    return yarn


@router.put("/{yarn_id}", response_model=YarnResponse)
def update_yarn(
    yarn_id: int,
    yarn_update: YarnUpdate,
    db: Session = Depends(get_db)
):
    """
    Update yarn properties.
    
    Only provided fields will be updated. All fields are optional.
    """
    try:
        # Convert Pydantic model to dict, excluding None values
        update_data = yarn_update.model_dump(exclude_unset=True)
        
        # Normalize empty strings to None for material_breakdown
        if 'material_breakdown' in update_data and update_data['material_breakdown'] == '':
            update_data['material_breakdown'] = None
        
        yarn = YarnService.update_yarn(db=db, yarn_id=yarn_id, **update_data)
        if not yarn:
            raise HTTPException(status_code=404, detail="Yarn not found")
        return yarn
    except ValueError as e:
        # Catch validation errors (e.g., invalid material breakdown, duplicate yarn)
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        import traceback
        print(f"Unexpected error updating yarn {yarn_id}: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error updating yarn: {str(e)}")


@router.delete("/{yarn_id}", status_code=204)
def delete_yarn(yarn_id: int, db: Session = Depends(get_db)):
    """
    Delete a yarn.
    
    This will also delete associated stash entries due to CASCADE.
    Cannot delete if yarn is used in any projects.
    """
    try:
        success = YarnService.delete_yarn(db=db, yarn_id=yarn_id)
        if not success:
            raise HTTPException(status_code=404, detail="Yarn not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/brands", response_model=BrandSearchResponse)
def search_brands(
    q: str = Query(..., min_length=1, description="Search term for brand name"),
    db: Session = Depends(get_db)
):
    """
    Search for brand names (for autocomplete).
    
    Returns unique brand names that match the search term.
    """
    brands = YarnService.search_brands(db=db, search_term=q)
    return BrandSearchResponse(brands=brands)


@router.get("/search/yarn-names", response_model=BrandSearchResponse)
def search_yarn_names(
    q: str = Query(..., min_length=1, description="Search term for yarn name"),
    brand: Optional[str] = Query(None, description="Optional brand name to filter by"),
    db: Session = Depends(get_db)
):
    """
    Search for yarn names (for autocomplete).
    
    Returns unique yarn names that match the search term.
    If brand is provided, only returns yarn names for that brand.
    """
    names = YarnService.search_yarn_names(db=db, search_term=q, brand_name=brand)
    return BrandSearchResponse(brands=names)


@router.get("/search/color-names", response_model=BrandSearchResponse)
def search_color_names(
    q: str = Query(..., min_length=1, description="Search term for color name"),
    db: Session = Depends(get_db)
):
    """
    Search for color names (for autocomplete).
    
    Returns unique color names that match the search term.
    """
    colors = YarnService.search_color_names(db=db, search_term=q)
    return BrandSearchResponse(brands=colors)


@router.get("/search/materials", response_model=BrandSearchResponse)
def search_materials(
    q: str = Query(..., min_length=1, description="Search term for material breakdown"),
    db: Session = Depends(get_db)
):
    """
    Search for material breakdowns (for autocomplete).
    
    Returns unique material breakdowns that match the search term.
    """
    materials = YarnService.search_materials(db=db, search_term=q)
    return BrandSearchResponse(brands=materials)
