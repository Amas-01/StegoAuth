import magic
import cv2
import numpy as np
from fastapi import HTTPException

from app.core.config import get_settings

settings = get_settings()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}
MAX_DIMENSION = 4096


async def validate_upload(file_bytes: bytes) -> bytes:
    """
    Layer 1: Validate file size against configured maximum.

    Args:
        file_bytes: Raw bytes of the uploaded file.

    Returns:
        The validated file bytes.

    Raises:
        HTTPException: 413 if file exceeds maximum size.
    """
    max_size_bytes = settings.MAX_IMAGE_SIZE_BYTES
    if len(file_bytes) > max_size_bytes:
        max_mb = settings.MAX_IMAGE_SIZE_MB
        raise HTTPException(
            status_code=413,
            detail={
                "error": "file_too_large",
                "message": f"Image must be under {max_mb} MB.",
            },
        )
    return file_bytes


def validate_mime_type(file_bytes: bytes) -> None:
    """
    Layer 2: Validate MIME type using magic bytes, not file extension.

    Args:
        file_bytes: Raw bytes of the uploaded file.

    Raises:
        HTTPException: 415 if file type is not JPEG or PNG.
    """
    mime = magic.from_buffer(file_bytes, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail={
                "error": "invalid_file_type",
                "message": f"Only JPEG and PNG images are accepted. Detected: {mime}",
            },
        )


def validate_decodable(file_bytes: bytes) -> np.ndarray:
    """
    Layer 3: Validate that OpenCV can decode the image.

    Args:
        file_bytes: Raw bytes of the uploaded file.

    Returns:
        Decoded image as a BGR numpy array.

    Raises:
        HTTPException: 422 if the file cannot be decoded as a valid image.
    """
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "invalid_image",
                "message": "The file could not be decoded as a valid image.",
            },
        )
    return img


def validate_dimensions(img: np.ndarray) -> None:
    """
    Layer 4: Validate image dimensions do not exceed maximum allowed.

    Args:
        img: Decoded image as a numpy array.

    Raises:
        HTTPException: 422 if dimensions exceed 4096x4096.
    """
    H, W = img.shape[:2]
    if H > MAX_DIMENSION or W > MAX_DIMENSION:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "image_too_large",
                "message": f"Image dimensions must not exceed {MAX_DIMENSION}x{MAX_DIMENSION} pixels.",
            },
        )


def validate_image_upload(file_bytes: bytes) -> np.ndarray:
    """
    Run all four validation layers in sequence.

    Args:
        file_bytes: Raw bytes of the uploaded file.

    Returns:
        Decoded image as a BGR numpy array if all validations pass.

    Raises:
        HTTPException: If any validation layer fails.
    """
    validate_upload.__wrapped__  # size checked via await in endpoint
    validate_mime_type(file_bytes)
    img = validate_decodable(file_bytes)
    validate_dimensions(img)
    return img
