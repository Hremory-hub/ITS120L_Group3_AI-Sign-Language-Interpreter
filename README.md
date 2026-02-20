# AI-Sign-Language-Interpreter
We propose a mobile app using AI and computer vision to enable real-time communication between hearing-impaired students and non-sign language users. It leverages the smartphone camera and MediaPipe to recognize Filipino Sign Language gestures.

## Setup - FOR INSTALLING PYTHON FRAMEWORKS
NEEDED: Python 3.12
https://www.python.org/downloads/release/python-3120/

# Create and activate venv
cd backend
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run
uvicorn main:app --reload

## Setup - REACT + VITE

cd KamAI/frontend
npm install
npm run dev


## Train
python train_model.py
- For training and fine-tuning models using Tensor
- Nvidia GPUs RECOMMENDED, otherwise IT USES CPU (SLOWER)
- Send ko nalang link ng Model

## Model Accuracy
95% validation accuracy using MobileNetV2 fine-tuning














