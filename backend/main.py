from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
import pickle
from pathlib import Path
from database import engine, SessionLocal
import models
from routers import users, sessions, payments, autocomplete

from dotenv import load_dotenv
load_dotenv() # Load variables immediately

# 1. Setup Database
models.Base.metadata.create_all(bind=engine)

# 2. App & CORS
app = FastAPI(title="KamAI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Static Files
Path("uploads/avatars").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 4. Routers
app.include_router(users.router)
app.include_router(sessions.router)
app.include_router(payments.router)
app.include_router(autocomplete.router)

# 5. Load AI Model & Landmark Tools
# Ensure these paths match your folder structure
model = tf.keras.models.load_model("models/asl_landmark_model.h5")
with open("models/label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.3)

@app.get("/")
def root():
    return {"status": "KamAI API is running with Landmark AI"}

# Add this at the top of your predict route
CONFIDENCE_THRESHOLD = 0.75 

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        results = hands.process(img_rgb)
        
        if not results.multi_hand_landmarks:
            return {"letter": "None", "confidence": 0.0}

        # --- UPDATED NORMALIZATION LOGIC ---
        hand_landmarks = results.multi_hand_landmarks[0]
        wrist = hand_landmarks.landmark[0]
        
        landmark_list = []
        for lm in hand_landmarks.landmark:
            # Subtract wrist to keep input format identical to training data!
            landmark_list.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
        # -----------------------------------
        
        input_data = np.array([landmark_list], dtype=np.float32)
        prediction = model.predict(input_data, verbose=0)
        
        # Now the confidence gate will work correctly
        confidence = float(np.max(prediction))
        if confidence < CONFIDENCE_THRESHOLD:
            return {"letter": "None", "confidence": confidence}

        predicted_idx = np.argmax(prediction)
        predicted_letter = label_encoder.inverse_transform([predicted_idx])[0]
        
        # ... rest of your database logging logic ...
        return {"letter": str(predicted_letter), "confidence": round(confidence, 2)}

    except Exception as e:
        return {"letter": "None", "details": str(e)}