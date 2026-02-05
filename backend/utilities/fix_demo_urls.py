"""
Fix Demo Database URLs

Converts all localhost URLs in the demo database to relative paths.
This ensures images work correctly in production.
"""

import sqlite3
import re
from pathlib import Path

# Path to demo database
BACKEND_DIR = Path(__file__).parent.parent
DB_PATH = BACKEND_DIR / "yarn_stash_demo.db"

def fix_url(url):
    """Convert localhost URLs to relative paths."""
    if not url:
        return url
    
    # If it's a localhost URL, extract the path
    if 'localhost' in url or '127.0.0.1' in url or '0.0.0.0' in url:
        # Extract path from URL
        match = re.search(r'/uploads/[^/\s]+', url)
        if match:
            return match.group(0)  # Returns /uploads/filename.jpg
    
    # If it's already a relative path, return as is
    if url.startswith('/uploads/'):
        return url
    
    # If it's just a filename, prepend /uploads/
    if '/' not in url and url:
        return f'/uploads/{url}'
    
    return url

def update_demo_urls():
    """Update all URLs in the demo database to use relative paths."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    updated_count = 0
    
    # Update yarn photo URLs
    cursor.execute("SELECT id, yarn_photo_url, label_photo_url FROM yarns")
    yarns = cursor.fetchall()
    
    for yarn_id, yarn_photo_url, label_photo_url in yarns:
        updates = []
        params = []
        
        if yarn_photo_url:
            new_url = fix_url(yarn_photo_url)
            if new_url != yarn_photo_url:
                updates.append("yarn_photo_url = ?")
                params.append(new_url)
        
        if label_photo_url:
            new_url = fix_url(label_photo_url)
            if new_url != label_photo_url:
                updates.append("label_photo_url = ?")
                params.append(new_url)
        
        if updates:
            params.append(yarn_id)
            query = f"UPDATE yarns SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, params)
            updated_count += 1
    
    # Update project image URLs
    cursor.execute("SELECT id, image_urls FROM projects WHERE image_urls IS NOT NULL")
    projects = cursor.fetchall()
    
    for project_id, image_urls_json in projects:
        if not image_urls_json:
            continue
        
        import json
        try:
            image_urls = json.loads(image_urls_json)
            if isinstance(image_urls, list):
                fixed_urls = [fix_url(url) for url in image_urls]
                if fixed_urls != image_urls:
                    cursor.execute(
                        "UPDATE projects SET image_urls = ? WHERE id = ?",
                        (json.dumps(fixed_urls), project_id)
                    )
                    updated_count += 1
        except json.JSONDecodeError:
            continue
    
    conn.commit()
    conn.close()
    
    print(f"Updated {updated_count} records in demo database")
    print(f"All localhost URLs have been converted to relative paths")

if __name__ == "__main__":
    if not DB_PATH.exists():
        print(f"Demo database not found at {DB_PATH}")
        exit(1)
    
    print(f"Fixing URLs in demo database: {DB_PATH}")
    update_demo_urls()
    print("Done!")
