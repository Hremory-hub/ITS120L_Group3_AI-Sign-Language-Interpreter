import os
import cv2
import mediapipe as mp
import pandas as pd

mp_hands = mp.solutions.hands
# Using static_image_mode=True is correct for a dataset
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5)

DATASET_PATH = "data/train" 
csv_data = []

for label in sorted(os.listdir(DATASET_PATH)):
    label_path = os.path.join(DATASET_PATH, label)
    if not os.path.isdir(label_path): continue
    
    print(f"Processing folder: {label}")
    for img_name in os.listdir(label_path):
        img_path = os.path.join(label_path, img_name)
        image = cv2.imread(img_path)
        if image is None: continue
        
        results = hands.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # 1. Get the wrist (reference point)
                wrist = hand_landmarks.landmark[0]
                landmarks = []
                # 2. Subtract wrist from every point to get relative coordinates
                for lm in hand_landmarks.landmark:
                    landmarks.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
                csv_data.append(landmarks + [label])

df = pd.DataFrame(csv_data)
df.to_csv("landmarks_dataset.csv", index=False, header=False)
print("CSV Generated with relative coordinates!")