"""
/vocabulary — Custom Vocabulary CRUD

Access: Professional and Enterprise only. Free users get a 403.

Tier system mirrors the autocomplete corpus weights exactly:
  p1 → weight 100  (Tier 1 — most prominent, same as TIER1 global words)
  p2 → weight 60   (Tier 2)
  p3 → weight 20   (Tier 3 — least prominent, same as TIER3 global words)

Custom words always rank above global corpus at the same tier level
(offset +150) so they surface before built-in words of equal weight.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession
from database import get_db
from auth_middleware import get_current_user
import models, schemas

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])

VALID_TIERS = {t.value for t in models.VocabPriority}   # {"p1", "p2", "p3"}
PRO_TIERS   = {"professional", "enterprise"}             # plans that can use vocabulary


# ── Plan check helper ──────────────────────────────────────────────────────────
def _require_pro(db: DBSession, user: models.User):
    """Raise 403 if the user is on the free plan."""
    sub = db.query(models.Subscription).filter(
        models.Subscription.user_id == user.id
    ).first()
    tier = sub.tier.value if sub and sub.tier else "free"
    if tier not in PRO_TIERS:
        raise HTTPException(
            403,
            detail="Custom Vocabulary is available on Professional and Enterprise plans."
        )


# GET /vocabulary ──────────────────────────────────────────────────────────────
@router.get("", response_model=list[schemas.VocabWordOut])
def list_vocab(
    q:     str = Query(default="", description="Search word or definition"),
    tag:   str = Query(default="", description="Filter by tag"),
    tier:  str = Query(default="", description="p1 | p2 | p3"),
    skip:  int = Query(default=0,  ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db:           DBSession   = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_pro(db, current_user)

    query = db.query(models.VocabWord).filter(
        models.VocabWord.user_id == current_user.id
    )
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            models.VocabWord.word.ilike(like) |
            models.VocabWord.definition.ilike(like)
        )
    if tag:
        query = query.filter(models.VocabWord.tags.ilike(f"%{tag}%"))
    if tier and tier in VALID_TIERS:
        query = query.filter(models.VocabWord.tier == tier)

    return query.order_by(
        models.VocabWord.tier.asc(),       # p1 → p2 → p3
        models.VocabWord.use_count.desc(),
        models.VocabWord.word.asc()
    ).offset(skip).limit(limit).all()


# POST /vocabulary ─────────────────────────────────────────────────────────────
@router.post("", response_model=schemas.VocabWordOut, status_code=201)
def add_word(
    payload:      schemas.VocabWordCreate,
    db:           DBSession   = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_pro(db, current_user)

    word = payload.word.strip().lower()
    if not word:
        raise HTTPException(400, detail="Word cannot be empty.")
    if len(word) > 120:
        raise HTTPException(400, detail="Word must be 120 characters or less.")
    if payload.tier not in VALID_TIERS:
        raise HTTPException(400, detail=f"tier must be one of: p1, p2, p3")

    exists = db.query(models.VocabWord).filter(
        models.VocabWord.user_id == current_user.id,
        models.VocabWord.word    == word,
    ).first()
    if exists:
        raise HTTPException(409, detail=f'"{word}" already exists in your vocabulary.')

    entry = models.VocabWord(
        user_id    = current_user.id,
        word       = word,
        definition = payload.definition or None,
        tags       = payload.tags       or None,
        tier       = payload.tier,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


# PATCH /vocabulary/{id} ───────────────────────────────────────────────────────
@router.patch("/{word_id}", response_model=schemas.VocabWordOut)
def update_word(
    word_id:      int,
    payload:      schemas.VocabWordUpdate,
    db:           DBSession   = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_pro(db, current_user)
    entry = _get_owned(db, current_user.id, word_id)
    data  = payload.model_dump(exclude_unset=True)

    if "word" in data:
        data["word"] = data["word"].strip().lower()
        if not data["word"]:
            raise HTTPException(400, detail="Word cannot be empty.")
    if "tier" in data and data["tier"] not in VALID_TIERS:
        raise HTTPException(400, detail="tier must be one of: p1, p2, p3")

    for k, v in data.items():
        setattr(entry, k, v or None if k in ("definition", "tags") else v)

    db.commit()
    db.refresh(entry)
    return entry


# DELETE /vocabulary/{id} ──────────────────────────────────────────────────────
@router.delete("/{word_id}", status_code=204)
def delete_word(
    word_id:      int,
    db:           DBSession   = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_pro(db, current_user)
    entry = _get_owned(db, current_user.id, word_id)
    db.delete(entry)
    db.commit()


# POST /vocabulary/{id}/use ────────────────────────────────────────────────────
@router.post("/{word_id}/use", status_code=204)
def mark_used(
    word_id:      int,
    db:           DBSession   = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_pro(db, current_user)
    entry = _get_owned(db, current_user.id, word_id)
    entry.use_count += 1
    db.commit()


# ── Helper ────────────────────────────────────────────────────────────────────
def _get_owned(db: DBSession, user_id: int, word_id: int) -> models.VocabWord:
    entry = db.query(models.VocabWord).filter(
        models.VocabWord.id      == word_id,
        models.VocabWord.user_id == user_id,
    ).first()
    if not entry:
        raise HTTPException(404, detail="Word not found.")
    return entry


# ── Utility for autocomplete ──────────────────────────────────────────────────
def get_user_vocab_words(db: DBSession, user_id: int) -> dict[str, int]:
    """
    Returns { word: weight } for all vocab words owned by user_id.

    Weights mirror the global corpus tiers exactly, with a +150 offset
    so custom words always rank above built-in words at the same tier:
      p1 → 100 + 150 = 250   (outranks global TIER1 = 100)
      p2 →  60 + 150 = 210   (outranks global TIER2 =  60)
      p3 →  20 + 150 = 170   (outranks global TIER3 =  20)

    use_count adds +5 per usage so frequently-tapped words climb further.
    """
    rows = db.query(
        models.VocabWord.word,
        models.VocabWord.tier,
        models.VocabWord.use_count
    ).filter(models.VocabWord.user_id == user_id).all()

    WEIGHT = {
        "p1": 250, "p2": 210, "p3": 170,
        # Legacy values — safe fallback if migration hasn't run yet
        "free": 170, "professional": 210, "enterprise": 250,
    }
    return {
        row.word: WEIGHT.get(str(row.tier), 170) + row.use_count * 5
        for row in rows
    }
