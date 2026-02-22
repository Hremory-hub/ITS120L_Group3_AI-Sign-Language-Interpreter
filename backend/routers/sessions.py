"""
/sessions routes
  GET    /sessions        → paginated list of my sessions
  POST   /sessions        → start a new session
  PATCH  /sessions/{id}   → update (e.g. mark ended, add duration/words)
  DELETE /sessions/{id}   → remove a session
  GET    /sessions/stats  → aggregated stats for dashboard hero
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from database import get_db
from auth_middleware import get_current_user
import models, schemas

router = APIRouter(prefix="/sessions", tags=["sessions"])

VALID_FEATURES = {f.value for f in models.SessionFeature}


# GET /sessions ────────────────────────────────────────────────────────────
@router.get("", response_model=schemas.SessionListOut)
def list_sessions(
    page:         int         = Query(1,  ge=1),
    limit:        int         = Query(20, ge=1, le=100),
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    base  = (db.query(models.Session)
               .filter(models.Session.user_id == current_user.id)
               .order_by(models.Session.started_at.desc()))
    total = base.count()
    rows  = base.offset((page - 1) * limit).limit(limit).all()
    return {"sessions": rows, "total": total}


# POST /sessions ───────────────────────────────────────────────────────────
@router.post("", response_model=schemas.SessionOut, status_code=201)
def create_session(
    payload:      schemas.SessionCreate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.feature not in VALID_FEATURES:
        raise HTTPException(422, detail=f"feature must be one of: {sorted(VALID_FEATURES)}")

    session = models.Session(user_id=current_user.id, feature=payload.feature)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


# GET /sessions/stats ──────────────────────────────────────────────────────
# NOTE: must be declared BEFORE /{session_id} or FastAPI will try to match
#       "stats" as an integer ID and 422.
@router.get("/stats", response_model=schemas.StatsOut)
def get_stats(
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = (db.query(
                func.count(models.Session.id)                          .label("total_sessions"),
                func.coalesce(func.sum(models.Session.duration_minutes), 0).label("total_minutes"),
                func.coalesce(func.sum(models.Session.word_count),       0).label("total_words"),
           )
           .filter(models.Session.user_id == current_user.id)
           .one())
    return {"total_sessions": row.total_sessions,
            "total_minutes":  row.total_minutes,
            "total_words":    row.total_words}


# PATCH /sessions/{id} ─────────────────────────────────────────────────────
@router.patch("/{session_id}", response_model=schemas.SessionOut)
def update_session(
    session_id:   int,
    payload:      schemas.SessionUpdate,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    s = (db.query(models.Session)
           .filter(models.Session.id == session_id,
                   models.Session.user_id == current_user.id)
           .first())
    if not s:
        raise HTTPException(404, detail="Session not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.commit()
    db.refresh(s)
    return s


# DELETE /sessions/{id} ────────────────────────────────────────────────────
@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id:   int,
    db:           Session     = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    s = (db.query(models.Session)
           .filter(models.Session.id == session_id,
                   models.Session.user_id == current_user.id)
           .first())
    if not s:
        raise HTTPException(404, detail="Session not found.")
    db.delete(s)
    db.commit()
