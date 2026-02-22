"""
ORM models for KamAI.
Tables auto-created on startup via Base.metadata.create_all().
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text,
    DateTime, ForeignKey, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from database import Base
import enum


# ── Enums ─────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    faculty       = "Faculty"
    administrator = "Administrator"
    student       = "Student"
    parent        = "Parent"
    other         = "Other"


class SessionFeature(str, enum.Enum):
    sign_to_text      = "Sign To Text"
    speech_to_sign    = "Speech to Sign"
    custom_vocabulary = "Custom Vocabulary"


# ── Tables ────────────────────────────────────────────────────────────────────

class User(Base):
    """
    One row per Firebase user.
    firebase_uid links back to Firebase Auth; all extra profile fields live here.
    Created automatically on first login via the auth middleware.
    """
    __tablename__ = "users"

    id           = Column(Integer,     primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=True)
    email        = Column(String(255), nullable=True)
    role         = Column(SAEnum(UserRole), nullable=True)
    school       = Column(String(255), nullable=True)
    phone        = Column(String(32),  nullable=True)
    bio          = Column(Text,        nullable=True)
    photo_url    = Column(String(512), nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions    = relationship("Session",    back_populates="user", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    """A single usage session of a KamAI feature."""
    __tablename__ = "sessions"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    feature          = Column(SAEnum(SessionFeature), nullable=False)
    status           = Column(String(32), default="completed")
    duration_minutes = Column(Integer, nullable=True)
    word_count       = Column(Integer, nullable=True)
    started_at       = Column(DateTime, default=datetime.utcnow)
    ended_at         = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")


class Prediction(Base):
    """Existing FSL prediction log — extended with optional user FK."""
    __tablename__ = "predictions"

    id         = Column(Integer,    primary_key=True, index=True)
    user_id    = Column(Integer,    ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    letter     = Column(String(1))
    confidence = Column(Float)
    created_at = Column(DateTime,   default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
