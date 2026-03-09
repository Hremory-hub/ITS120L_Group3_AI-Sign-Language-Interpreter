# AI-Sign-Language-Interpreter
We propose a mobile app using AI and computer vision to enable real-time communication between hearing-impaired students and non-sign language users. It leverages the smartphone camera and MediaPipe to recognize Filipino Sign Language gestures.

## Setup - FOR INSTALLING PYTHON BACKEND (API SERVER)
**• PREQUISITE:** Python 3.12

https://www.python.org/downloads/release/python-3120/

Make sure:
- Click Add python.exe to PATH
- Custom Installation > Optional Features
    - Tick all boxes
- Advanced Options
    - Tick Install Python 3.12 for all users

**• IMPORTANT**
- Open CMD then type:
```
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple 

```

### 1. Create and Activate Venv
**Using CMD:**
```
cd KamAI/backend
python -m venv venv
venv\Scripts\activate
```

### 2. Install dependencies (NOT USING REQUIREMENTS.TXT ANYMORE DUE TO DEPENDENCY HELL)

**IMPORTANT! MAKE SURE YOU RUN THE PIP INSTALL COMMANDS BY ITS ORDER TO AVOID VENV CORRUPTION**

**Using CMD:**
```
pip install -c constraints.txt tensorflow==2.16.1 mediapipe==0.10.14 protobuf==4.25.3
pip install -c constraints.txt fastapi uvicorn python-multipart scikit-learn sqlalchemy pymysql
pip install -c constraints.txt --no-deps firebase-admin google-cloud-storage google-cloud-firestore
pip install -c constraints.txt --no-deps google-auth cryptography pyasn1 pyasn1-modules rsa
pip install -c constraints.txt --no-deps httpx cachecontrol msgpack dotenv fast-autocomplete
```

**TO REMOVE UNUSED/OLD DEPENDENCIES:**
1. Make sure you are in KamAI directory
2. Remove backend\venv
3. Using CMD, run:
```
python -m venv venv
pip install -r requirements.txt
```

### HOW TO RUN:

```
cd KamAI/backend
venv\Scripts\activate
uvicorn main:app --reload
```

Open at: 
```
http://127.0.0.1:8000/
```

## Setup - INSTALLING REACT + VITE

### 1. Installing Frameworks

**Using CMD:**
```
cd KamAI/frontend
npm install
```
### HOW TO RUN:
```
cd KamAI/frontend
npm run dev
```

## Setup - CREATING DOCKER CONTAINER (MYSQL8)

**• PREQUISITE:** Docker

https://www.docker.com/

### 1. Open CMD

**Using CMD:**
```
docker run -d ^
  --name mysql-ai ^
  -e MYSQL_ROOT_PASSWORD=root ^
  -e MYSQL_DATABASE=ai_app ^
  -p 3307:3306 ^
  mysql:8
```

### 2. Sanity Check

**Using CMD:**
```
docker ps
```
### 3. Add Database
**Using CMD:**
```
docker exec -it <container_name_or_id> mysql -u root -p
```

**After Logging In:**
```
CREATE DATABASE asldb;
USE asldb;
CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(50));
```


### HOW TO RUN:

Just Start on Docker instead or use CMD

## Firebase Token Verifications.

**Setup:**
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Click "Generate new private key" → save as backend/serviceAccountKey.json
  3. OR set env var:  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json


## Train
**feature_extraction.py**
- For feature extraction through CNN (Convolutional Neutral Network) using Mediapipe
- Creates landmarks_dataset.csv for landmarks using Pandas

**train_landmarks.py**
-  For landmark training and data processing using SciKit-Learn
- Creates the final models
    - asl_landmark_model.h5
    - label_encoder.h5

## Model Accuracy
~98% validation accuracy using Mediapipe Blazepose


