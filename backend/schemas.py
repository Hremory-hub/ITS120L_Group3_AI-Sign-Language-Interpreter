"""Pydantic v2 schemas for request/response validation."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── User ──────────────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email:        Optional[str] = None
    role:         Optional[str] = None
    school:       Optional[str] = None
    phone:        Optional[str] = None
    bio:          Optional[str] = None
    photo_url:    Optional[str] = None

class UserOut(BaseModel):
    id:           int
    firebase_uid: str
    display_name: Optional[str] = None
    email:        Optional[str] = None
    role:         Optional[str] = None
    school:       Optional[str] = None
    phone:        Optional[str] = None
    bio:          Optional[str] = None
    photo_url:    Optional[str] = None
    created_at:   datetime
    updated_at:   datetime

    model_config = {"from_attributes": True}


# ── Session ───────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    feature: str

class SessionUpdate(BaseModel):
    status:           Optional[str]      = None
    duration_minutes: Optional[int]      = None
    word_count:       Optional[int]      = None
    ended_at:         Optional[datetime] = None

class SessionOut(BaseModel):
    id:               int
    feature:          str
    status:           Optional[str]      = None
    duration_minutes: Optional[int]      = None
    word_count:       Optional[int]      = None
    started_at:       datetime
    ended_at:         Optional[datetime] = None

    model_config = {"from_attributes": True}

class SessionListOut(BaseModel):
    sessions: list[SessionOut]
    total:    int


# ── Stats ─────────────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    total_sessions: int
    total_minutes:  int
    total_words:    int


# ── Subscription ──────────────────────────────────────────────────────────────

class SubscriptionOut(BaseModel):
    tier:           str
    billing_period: Optional[str]    = None
    status:         str
    started_at:     datetime
    expires_at:     Optional[datetime] = None

    model_config = {"from_attributes": True}

class UserOutWithTier(UserOut):
    """UserOut extended with the subscription tier (defaults to free)."""
    tier:   str = "free"
    sub_status: str = "active"

# ── PayMongo checkout ─────────────────────────────────────────────────────────

class CreateCheckoutRequest(BaseModel):
    tier:           str   # "professional" | "enterprise"
    billing_period: str   # "monthly" | "annual"


# ── Vocabulary ────────────────────────────────────────────────────────────────

class VocabWordCreate(BaseModel):
    word:       str
    definition: Optional[str] = None
    tags:       Optional[str] = None   # comma-separated
    tier:       str           = "p3"

class VocabWordUpdate(BaseModel):
    word:       Optional[str] = None
    definition: Optional[str] = None
    tags:       Optional[str] = None
    tier:       Optional[str] = None

class VocabWordOut(BaseModel):
    id:         int
    word:       str
    definition: Optional[str] = None
    tags:       Optional[str] = None
    tier:       str
    use_count:  int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
