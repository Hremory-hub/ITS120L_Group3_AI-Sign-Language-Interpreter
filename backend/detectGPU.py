import tensorflow as tf

# List all physical devices
print("Available devices:", tf.config.list_physical_devices())

# Specifically check for GPUs
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    print("TensorFlow detected GPU(s):", gpus)
else:
    print("No GPU detected by TensorFlow")
