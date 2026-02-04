"""
Script to update existing yarns with parsed materials.

This script parses material_breakdown for all existing yarns and populates
the materials JSON array field.
"""

import os
import sys
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Adjust the path to import from the correct app directory
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
sys.path.insert(0, project_root)

from backend.app.models.database import DATABASE_URL
from backend.app.services.yarn_service import YarnService

def update_materials():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # Get all yarns
        result = db.execute(text("SELECT id, material_breakdown FROM yarns"))
        yarns = result.fetchall()
        
        print(f"Found {len(yarns)} yarns to update...")
        
        updated_count = 0
        for yarn_id, material_breakdown in yarns:
            if material_breakdown:
                # Parse materials using the service method
                materials = YarnService.parse_materials(material_breakdown)
                materials_json = json.dumps(materials)
                
                # Update the yarn
                db.execute(
                    text("UPDATE yarns SET materials = :materials WHERE id = :id"),
                    {"materials": materials_json, "id": yarn_id}
                )
                updated_count += 1
        
        db.commit()
        print(f"[OK] Successfully updated {updated_count} yarns with parsed materials")
    except Exception as e:
        print(f"[ERROR] Failed to update materials: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_materials()
