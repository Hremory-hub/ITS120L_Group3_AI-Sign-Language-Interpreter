# train_model.py
import os
import tensorflow as tf
from tensorflow.keras import layers, Sequential
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import ModelCheckpoint

# -------------------------------
# SETTINGS
# -------------------------------
DATA_DIR = "data/train"  # path to your folder with A-Z subfolders
MODEL_DIR = "models"
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS_HEAD = 15  # frozen base training
NUM_CLASSES = 26

os.makedirs(MODEL_DIR, exist_ok=True)

# -------------------------------
# LOAD DATA
# -------------------------------
train_ds = image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=42,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

val_ds = image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=42,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

# -------------------------------
# DATA AUGMENTATION
# -------------------------------
data_augmentation = Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.15),
    layers.RandomZoom(0.1),
    layers.RandomContrast(0.1)
])

# -------------------------------
# BASE MODEL (MobileNetV2)
# -------------------------------
base_model = MobileNetV2(
    input_shape=IMG_SIZE + (3,),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False  # freeze base

# -------------------------------
# COMPLETE MODEL
# -------------------------------
model = Sequential([
    data_augmentation,
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(NUM_CLASSES, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# -------------------------------
# CHECKPOINTS
# -------------------------------
checkpoint_cb = ModelCheckpoint(
    os.path.join(MODEL_DIR, "asl_model.h5"),
    save_best_only=True,
    monitor="val_accuracy"
)

# -------------------------------
# TRAIN MODEL
# -------------------------------
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS_HEAD,
    callbacks=[checkpoint_cb]
)

model.load_weights(os.path.join(MODEL_DIR, "asl_model.h5"))

# -------------------------------
# FINE TUNING
# -------------------------------

print("\nStarting fine-tuning...\n")

# Unfreeze the top 30 layers of base_model
base_model.trainable = True

for layer in base_model.layers[:-30]:
    layer.trainable = False

# Recompile with LOWER learning rate
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

FINE_TUNE_EPOCHS = 10

history_fine = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=FINE_TUNE_EPOCHS
)

# Save final fine-tuned model
model.save("models/asl_model_finetuned.h5")

print("Fine-tuned model saved!")

print(f"Model trained and saved to {MODEL_DIR}/asl_model.h5")
