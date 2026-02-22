"""
Firebase token verification + auto-provisioning of MySQL user rows.

Setup:
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Click "Generate new private key" → save as backend/serviceAccountKey.json
  3. OR set env var:  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
"""
import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models

# Initialise Firebase Admin SDK exactly once
if not firebase_admin._apps:
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
    try:
        cred = credentials.Certificate(key_path)
    except Exception:
        # Fallback for cloud environments with Application Default Credentials
        cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

_bearer = HTTPBearer()


def get_current_user(
    token_data: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    """
    FastAPI dependency used on every protected route.

    1. Verifies the Firebase JWT from Authorization: Bearer <token>
    2. Looks up the user in MySQL by firebase_uid
    3. If not found (first ever login), creates the row automatically
    4. Returns the SQLAlchemy User object
    """
    try:
        decoded = firebase_auth.verify_id_token(token_data.credentials)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired — please sign in again.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    uid = decoded["uid"]

    user = db.query(models.User).filter(models.User.firebase_uid == uid).first()

    if not user:
        # First login — seed the row from the Firebase token claims
        user = models.User(
            firebase_uid = uid,
            display_name = decoded.get("name"),
            email        = decoded.get("email"),
            photo_url    = decoded.get("picture"),   # populated for Google Sign-In
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
