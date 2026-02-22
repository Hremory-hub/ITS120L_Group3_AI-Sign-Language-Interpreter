"""
/users routes
  GET    /users/me          → return my profile
  PATCH  /users/me          → update editable fields
  POST   /users/me/photo    → upload avatar image
"""
import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth_middleware import get_current_user
import models, schemas

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR    = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_BYTES     = 5 * 1024 * 1024  # 5 MB
VALID_ROLES   = {r.value for r in models.UserRole}


# GET /users/me ─────────────────────────────────────────────────────────────
@router.get("/me", response_model=schemas.UserOut)
def get_my_profile(current_user: models.User = Depends(get_current_user)):
    return current_user


# PATCH /users/me ───────────────────────────────────────────────────────────
@router.patch("/me", response_model=schemas.UserOut)
def update_my_profile(
    payload:      schemas.UserUpdate,
    db:           Session      = Depends(get_db),
    current_user: models.User  = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)

    if "role" in data and data["role"] and data["role"] not in VALID_ROLES:
        raise HTTPException(422, detail=f"role must be one of: {sorted(VALID_ROLES)}")

    for field, value in data.items():
        setattr(current_user, field, value or None)   # store empty string as NULL

    db.commit()
    db.refresh(current_user)
    return current_user


# POST /users/me/photo ──────────────────────────────────────────────────────
@router.post("/me/photo")
async def upload_avatar(
    photo:        UploadFile   = File(...),
    db:           Session      = Depends(get_db),
    current_user: models.User  = Depends(get_current_user),
):
    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail="Must be JPEG, PNG, WebP, or GIF.")

    data = await photo.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, detail="File must be under 5 MB.")

    # Overwrite previous avatar — one file per user, keyed by firebase_uid
    ext      = Path(photo.filename or "avatar.jpg").suffix or ".jpg"
    filename = f"{current_user.firebase_uid}{ext}"
    (UPLOAD_DIR / filename).write_bytes(data)

    base_url  = os.getenv("API_BASE_URL", "http://localhost:8000")
    photo_url = f"{base_url}/uploads/avatars/{filename}"

    current_user.photo_url = photo_url
    db.commit()

    return {"photo_url": photo_url}
