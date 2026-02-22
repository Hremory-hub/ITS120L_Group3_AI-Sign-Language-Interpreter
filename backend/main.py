"""
KamAI FastAPI Backend
  - MySQL 8 (container port 3307 → 3306) via SQLAlchemy
  - Firebase Auth token verification (firebase-admin)
  - /predict/   → FSL model inference
  - /users/*    → profile CRUD + avatar upload
  - /sessions/* → session CRUD + dashboard stats
"""
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
from pathlib import Path

from database import engine, SessionLocal
import models
from routers import users, sessions

# ── Create all tables (safe — skips existing ones) ────────────────────────────
models.Base.metadata.create_all(bind=engine)

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="KamAI API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve uploaded avatars as static files at /uploads/avatars/<filename> ─────
Path("uploads/avatars").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(users.router)
app.include_router(sessions.router)

# ── ML model ──────────────────────────────────────────────────────────────────
model       = load_model("models/asl_model_finetuned.h5")
class_names = [chr(i) for i in range(65, 91)]   # A–Z


@app.get("/")
def root():
    return {"status": "KamAI API is running ✓"}


@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    img       = Image.open(io.BytesIO(img_bytes)).convert("RGB").resize((224, 224))
    arr       = np.expand_dims(np.array(img) / 255.0, axis=0)

    preds           = model.predict(arr)
    predicted_class = class_names[np.argmax(preds)]
    confidence      = float(np.max(preds))

    # Log to DB (no user auth required for predict endpoint)
    db = SessionLocal()
    try:
        db.add(models.Prediction(letter=predicted_class, confidence=confidence))
        db.commit()
    finally:
        db.close()

    return {"letter": predicted_class, "confidence": confidence}
