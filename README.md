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

### 2. Install dependencies
```
pip install -r requirements.txt
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

### HOW TO RUN:

Just Start on Docker instead

## Firebase token verification + auto-provisioning of MySQL user rows.

Setup:
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Click "Generate new private key" → save as backend/serviceAccountKey.json
  3. OR set env var:  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json


## Train
python train_model.py
- For training and fine-tuning models using Tensor
- Nvidia GPUs RECOMMENDED, otherwise IT USES CPU (SLOWER)
- Send ko nalang link ng Model

## Model Accuracy
95% validation accuracy using MobileNetV2 fine-tuning














