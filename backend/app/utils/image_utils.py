import cv2
import numpy as np


def load_rgb_from_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Load image bytes and convert to RGB numpy array.

    Handles BGR-to-RGB conversion and grayscale-to-RGB conversion.

    Args:
        image_bytes: Raw image bytes (JPEG or PNG).

    Returns:
        RGB numpy array with shape (H, W, 3) and dtype uint8.

    Raises:
        ValueError: If image bytes cannot be decoded by OpenCV.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Could not decode image bytes.")

    # Handle grayscale images
    if len(bgr.shape) == 2 or bgr.shape[2] == 1:
        bgr = cv2.cvtColor(bgr, cv2.COLOR_GRAY2BGR)

    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    return rgb


def encode_to_png_bytes(image_array: np.ndarray) -> bytes:
    """
    Encode a numpy image array to PNG bytes (lossless).

    Args:
        image_array: Image as numpy array (RGB or BGR, uint8).

    Returns:
        PNG-encoded image as bytes.

    Raises:
        ValueError: If encoding fails.
    """
    # Ensure BGR for OpenCV encoding
    if len(image_array.shape) == 3 and image_array.shape[2] == 3:
        # Check if it's RGB by comparing channel stats
        # For encoding, OpenCV expects BGR
        bgr = cv2.cvtColor(image_array.astype(np.uint8), cv2.COLOR_RGB2BGR)
    else:
        bgr = image_array.astype(np.uint8)

    success, buffer = cv2.imencode('.png', bgr)
    if not success:
        raise ValueError("Failed to encode image to PNG format.")
    return buffer.tobytes()


def load_bgr_from_bytes(image_bytes: bytes) -> np.ndarray:
    """
    Load image bytes as BGR numpy array.

    Args:
        image_bytes: Raw image bytes (JPEG or PNG).

    Returns:
        BGR numpy array with shape (H, W, 3) and dtype uint8.

    Raises:
        ValueError: If image bytes cannot be decoded.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Could not decode image bytes.")
    return bgr
