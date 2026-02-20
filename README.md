# KamAI - ASL Classifier

## Setup - FOR INSTALLING PYTHON FRAMEWORKS

cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

## Train
python train_model.py
- For training and fine-tuning models using Tensor
- Nvidia GPUs RECOMMENDED, otherwise IT USES CPU (SLOWER)
- Send ko nalang link ng Model

## Model Accuracy
95% validation accuracy using MobileNetV2 fine-tuning