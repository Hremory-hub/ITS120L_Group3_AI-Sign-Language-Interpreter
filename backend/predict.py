# predict.py

import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import sys

MODEL_PATH = "models/asl_model_finetuned.keras"
IMG_SIZE = (224, 224)

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Get image path from command line
img_path = sys.argv[1]

# Load and preprocess image
img = image.load_img(img_path, target_size=IMG_SIZE)
img_array = image.img_to_array(img)
img_array = np.expand_dims(img_array, axis=0)
img_array = img_array / 255.0

# Predict
predictions = model.predict(img_array)
predicted_class = np.argmax(predictions)

print(f"Predicted letter: {chr(predicted_class + 65)}")