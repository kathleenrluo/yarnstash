"""
One-time admin endpoints (e.g. bulk upload of existing uploads into a volume).
Protected by BULK_UPLOAD_SECRET; if unset, endpoints return 404.
"""

import io
import os
import zipfile
from pathlib import Path
from fastapi import APIRouter, File, Header, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/admin", tags=["admin"])

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def _require_secret(x_bulk_upload_secret: str | None) -> None:
    secret = os.getenv("BULK_UPLOAD_SECRET")
    if not secret:
        raise HTTPException(status_code=404, detail="Not found")
    if not x_bulk_upload_secret or x_bulk_upload_secret.strip() != secret:
        raise HTTPException(status_code=403, detail="Invalid or missing secret")


@router.post("/bulk-upload-uploads")
async def bulk_upload_uploads(
    file: UploadFile = File(...),
    x_bulk_upload_secret: str | None = Header(default=None, alias="X-Bulk-Upload-Secret"),
):
    """
    One-time: upload a zip of image files; they are extracted into the uploads directory
    with the same filenames. Use this to seed the volume with your existing backend/uploads.
    Requires header: X-Bulk-Upload-Secret: <BULK_UPLOAD_SECRET>.
    """
    _require_secret(x_bulk_upload_secret)

    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Upload a .zip file")

    count = 0
    try:
        contents = await file.read()
        with zipfile.ZipFile(io.BytesIO(contents), "r") as zf:
            for name in zf.namelist():
                if name.endswith("/"):
                    continue
                base = Path(name).name
                if not base:
                    continue
                ext = Path(base).suffix.lower()
                if ext not in ALLOWED_EXTENSIONS:
                    continue
                # Avoid path traversal: write only under UPLOADS_DIR with a safe filename
                out_path = UPLOADS_DIR / base
                try:
                    data = zf.read(name)
                    out_path.write_bytes(data)
                    count += 1
                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to write {base}: {e}",
                    )
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid zip file")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "extracted": count}


@router.post("/clear-uploads")
async def clear_uploads(
    x_bulk_upload_secret: str | None = Header(default=None, alias="X-Bulk-Upload-Secret"),
):
    """
    Delete all image files in the uploads directory (e.g. to reset volume before re-uploading).
    Requires header: X-Bulk-Upload-Secret: <BULK_UPLOAD_SECRET>.
    """
    _require_secret(x_bulk_upload_secret)

    if not UPLOADS_DIR.exists():
        return {"ok": True, "deleted": 0}

    deleted = 0
    for f in UPLOADS_DIR.iterdir():
        if not f.is_file():
            continue
        if f.suffix.lower() in ALLOWED_EXTENSIONS:
            try:
                f.unlink()
                deleted += 1
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete {f.name}: {e}")
    return {"ok": True, "deleted": deleted}


@router.get("/export-uploads")
async def export_uploads(
    x_bulk_upload_secret: str | None = Header(default=None, alias="X-Bulk-Upload-Secret"),
):
    """
    Download the uploads directory as a zip. Use this to back up your volume.
    Requires header: X-Bulk-Upload-Secret: <BULK_UPLOAD_SECRET>.
    """
    _require_secret(x_bulk_upload_secret)

    if not UPLOADS_DIR.exists():
        raise HTTPException(status_code=404, detail="Uploads directory not found")

    def zip_generator():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in UPLOADS_DIR.iterdir():
                if not f.is_file():
                    continue
                if f.suffix.lower() not in ALLOWED_EXTENSIONS:
                    continue
                zf.write(f, f.name)
        buf.seek(0)
        yield buf.getvalue()

    return StreamingResponse(
        zip_generator(),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=uploads-backup.zip"},
    )
