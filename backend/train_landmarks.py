import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle

# 1. Load the data
df = pd.read_csv("landmarks_dataset.csv", header=None)
X = df.iloc[:, :-1].values.astype('float32')
y_raw = df.iloc[:, -1].values

# 2. Encode labels
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y_raw)
with open('label_encoder.pkl', 'wb') as f:
    pickle.dump(label_encoder, f)

# 3. Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Build a more robust model
# Using BatchNormalization helps prevent the model from getting 
# confused by slight variations in hand scale/rotation.
model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(63,)),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(len(np.unique(y)), activation='softmax') 
])

model.compile(optimizer='adam', 
              loss='sparse_categorical_crossentropy', 
              metrics=['accuracy'])

# 5. Train with EarlyStopping to avoid overfitting
callback = tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=5)
print("Starting training...")
model.fit(X_train, y_train, epochs=100, batch_size=32, 
          validation_data=(X_test, y_test), callbacks=[callback])

model.save("asl_landmark_model.h5")
print("Model saved as asl_landmark_model.h5")