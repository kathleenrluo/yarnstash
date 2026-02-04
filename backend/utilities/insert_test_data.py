"""
Script to insert test data into the database.

Run this script to populate the database with sample yarns and projects
for testing the frontend.
"""

import os
import sys
from datetime import datetime

# Adjust the path to import from the correct app directory
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.insert(0, backend_dir)

from sqlalchemy.orm import Session
from app.models.database import SessionLocal, init_db
from app.services.yarn_service import YarnService
from app.services.stash_service import StashService
from app.services.project_service import ProjectService

def insert_test_data():
    """Insert 3 test yarns and 2 test projects."""
    
    # Initialize database
    init_db()
    
    # Get database session
    db = SessionLocal()
    
    try:
        print("Inserting test data...")
        
        # Create 3 test yarns
        yarn1 = YarnService.create_yarn(
            db=db,
            brand_name="Caron",
            yarn_name="Simply Soft",
            color_name="Soft Pink",
            yarn_weight=4,  # Worsted
            grams_per_skein=170,
            meters_per_skein=288,
            generalized_colors=["pink"],
            material_breakdown="100% acrylic",
            care_instruction_ids=[1],  # Machine wash
            yarn_photo_url=None,
            label_photo_url=None
        )
        # Update notes and favorite separately if needed
        if hasattr(yarn1, 'notes'):
            yarn1.notes = "Great for amigurumi"
        if hasattr(yarn1, 'is_favorite'):
            yarn1.is_favorite = False
        db.commit()
        db.refresh(yarn1)
        print(f"[OK] Created yarn: {yarn1.brand_name} {yarn1.yarn_name}")
        
        yarn2 = YarnService.create_yarn(
            db=db,
            brand_name="Red Heart",
            yarn_name="Super Saver",
            color_name="Cherry Red",
            yarn_weight=4,  # Worsted
            grams_per_skein=198,
            meters_per_skein=236,
            generalized_colors=["red"],
            material_breakdown="100% acrylic",
            care_instruction_ids=[1],  # Machine wash
            yarn_photo_url=None,
            label_photo_url=None
        )
        if hasattr(yarn2, 'is_favorite'):
            yarn2.is_favorite = True
        db.commit()
        db.refresh(yarn2)
        print(f"[OK] Created yarn: {yarn2.brand_name} {yarn2.yarn_name}")
        
        yarn3 = YarnService.create_yarn(
            db=db,
            brand_name="Lion Brand",
            yarn_name="Wool-Ease",
            color_name="Fisherman",
            yarn_weight=4,  # Worsted
            grams_per_skein=85,
            meters_per_skein=197,
            generalized_colors=["cream", "beige"],
            material_breakdown="80% acrylic, 20% wool",
            care_instruction_ids=[1, 2],  # Machine wash, lay flat to dry
            yarn_photo_url=None,
            label_photo_url=None
        )
        if hasattr(yarn3, 'notes'):
            yarn3.notes = "Warm and soft"
        if hasattr(yarn3, 'is_favorite'):
            yarn3.is_favorite = False
        db.commit()
        db.refresh(yarn3)
        print(f"[OK] Created yarn: {yarn3.brand_name} {yarn3.yarn_name}")
        
        # Add yarns to stash
        StashService.add_yarn_by_grams(db, yarn1.id, 340)  # 2 skeins
        StashService.add_yarn_by_grams(db, yarn2.id, 198)  # 1 skein
        StashService.add_yarn_by_grams(db, yarn3.id, 170)  # 2 skeins
        print("[OK] Added yarns to stash")
        
        # Create 2 test projects
        project1 = ProjectService.create_project(
            db=db,
            name="Pink Amigurumi Bear",
            description="A cute pink teddy bear made with Caron Simply Soft",
            notes="First amigurumi project!",
            craft_type="crochet",
            hook_size="5mm (H/8)",
            pattern_type="freehand",
            pattern_reference=None,
            tags=["amigurumi", "stuffed animal", "bear"],
            is_favorite=True
        )
        
        # Add yarn usage for project1
        ProjectService.add_yarn_usage(
            db=db,
            project_id=project1.id,
            yarn_id=yarn1.id,
            grams_used=85,
            update_stash=True
        )
        print(f"[OK] Created project: {project1.name}")
        
        project2 = ProjectService.create_project(
            db=db,
            name="Red Scarf",
            description="A warm red scarf for winter",
            notes="Quick project, took 2 days",
            craft_type="knit",
            hook_size="6mm",
            pattern_type="tutorial",
            pattern_reference="https://example.com/scarf-pattern",
            tags=["garment", "accessory", "scarf"],
            is_favorite=False
        )
        
        # Add yarn usage for project2
        ProjectService.add_yarn_usage(
            db=db,
            project_id=project2.id,
            yarn_id=yarn2.id,
            grams_used=150,
            update_stash=True
        )
        print(f"[OK] Created project: {project2.name}")
        
        db.commit()
        print("\n[OK] Test data insertion complete!")
        print("\nYou can now:")
        print("- Click 'Stash' to see your 3 test yarns")
        print("- Click 'Projects' to see your 2 test projects")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to insert test data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    insert_test_data()
