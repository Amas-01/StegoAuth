import cv2
import numpy as np


def generate_heatmap(original_bytes: bytes, stego_bytes: bytes) -> bytes:
    """Generate a colour-mapped pixel difference heatmap between two images.

    Red = large difference, black = zero difference.
    Returns PNG bytes of the heatmap image.

    The difference image is amplified by a factor of 20 for visibility,
    then mapped using COLORMAP_JET: black (0 diff) -> blue -> green -> red.

    Args:
        original_bytes: Raw bytes of the original cover image.
        stego_bytes: Raw bytes of the stego image.

    Returns:
        PNG-encoded heatmap image as bytes.

    Raises:
        ValueError: If either image cannot be decoded.
    """
    orig_bgr = cv2.imdecode(
        np.frombuffer(original_bytes, np.uint8), cv2.IMREAD_COLOR
    )
    stego_bgr = cv2.imdecode(
        np.frombuffer(stego_bytes, np.uint8), cv2.IMREAD_COLOR
    )

    if orig_bgr is None or stego_bgr is None:
        raise ValueError("Could not decode one or both images.")

    # Compute absolute difference
    diff = cv2.absdiff(orig_bgr, stego_bgr)

    # Convert to grayscale and amplify for visibility
    diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    diff_amplified = np.clip(
        diff_gray.astype(np.float32) * 20, 0, 255
    ).astype(np.uint8)

    # Apply COLORMAP_JET: black (0 diff) -> blue -> green -> red (large diff)
    heatmap_bgr = cv2.applyColorMap(diff_amplified, cv2.COLORMAP_JET)

    success, buffer = cv2.imencode(".png", heatmap_bgr)
    if not success:
        raise ValueError("Failed to encode heatmap image to PNG format.")

    return buffer.tobytes()
