import numpy as np
from skimage.metrics import structural_similarity


def compute_mse(original: np.ndarray, stego: np.ndarray) -> float:
    """Compute Mean Squared Error between original and stego images.

    Average squared per-channel pixel difference between original and stego image.
    Both images must be RGB uint8 arrays of identical shape.

    Args:
        original: Original cover image as RGB uint8 numpy array.
        stego: Stego image as RGB uint8 numpy array.

    Returns:
        MSE value as float. Lower = less distortion = better quality.
    """
    orig_f = original.astype(np.float64)
    steg_f = stego.astype(np.float64)
    return float(np.mean((orig_f - steg_f) ** 2))


def compute_psnr(mse: float) -> float:
    """Compute Peak Signal-to-Noise Ratio from MSE.

    Logarithmic distortion measure derived from MSE. Returns value in
    decibels (dB). Higher = better quality.

    Interpretation thresholds from thesis:
        > 50 dB  → imperceptible (typical for LSB single-bit embedding)
        40-50 dB → imperceptible to excellent (typical for DCT embedding)
        > 40 dB  → generally imperceptible (accepted threshold in literature)
        30-40 dB → moderate distortion, may be visible under close inspection
        < 30 dB  → visible degradation under normal viewing

    Args:
        mse: Mean Squared Error value.

    Returns:
        PSNR value in dB, or float('inf') if MSE is 0.
    """
    if mse == 0.0:
        return float("inf")
    return float(10.0 * np.log10((255.0 ** 2) / mse))


def compute_ssim(original: np.ndarray, stego: np.ndarray) -> float:
    """Compute Structural Similarity Index between original and stego images.

    Perceptual similarity metric measuring luminance, contrast, and structure.
    Applied to full colour (multichannel) RGB image arrays.

    Window size: 7×7 pixels (scikit-image default, consistent with Wang et al. 2004).

    Args:
        original: Original cover image as RGB uint8 numpy array.
        stego: Stego image as RGB uint8 numpy array.

    Returns:
        SSIM value in range [-1, 1]. Higher = more similar. 1.0 = identical.

    Interpretation from thesis:
        > 0.98  → high perceptual fidelity (imperceptible embedding)
        < 0.90  → distortion may be noticeable under ordinary viewing
    """
    return float(structural_similarity(
        original,
        stego,
        channel_axis=-1,  # multichannel colour images (RGB)
        data_range=255,
    ))


def compute_ber(original_token: str, extracted_token: str) -> float:
    """Compute Bit Error Rate between original and extracted tokens.

    Proportion of payload bits incorrectly recovered after JPEG compression.
    BER = 0.0 → perfect recovery (all bits correct).
    BER = 1.0 → complete corruption (all bits wrong).
    Handles length mismatches by treating missing bits as errors.

    Args:
        original_token: The original token that was embedded.
        extracted_token: The token extracted from the stego image.

    Returns:
        BER value as float in range [0.0, 1.0].
    """
    def token_to_bits(token: str) -> list[int]:
        """Convert token string to flat bit list."""
        bits: list[int] = []
        for ch in token:
            byte_val = ord(ch)
            for i in range(7, -1, -1):
                bits.append((byte_val >> i) & 1)
        return bits

    orig_bits = token_to_bits(original_token)

    try:
        extr_bits = token_to_bits(extracted_token) if extracted_token else []
    except Exception:
        extr_bits = []

    n_total = len(orig_bits)
    n_errors = 0
    for j in range(n_total):
        if j >= len(extr_bits):
            n_errors += 1  # missing bits count as errors
        elif extr_bits[j] != orig_bits[j]:
            n_errors += 1

    return n_errors / n_total if n_total > 0 else 0.0


def compute_capacity(image: np.ndarray, technique: str) -> dict:
    """Compute theoretical maximum payload capacity for each technique.

    LSB: 1 bit per channel value = H × W × 3 bits total.
    DCT: 1 bit per 8×8 block = (H//8) × (W//8) bits total.

    Args:
        image: Original cover image as numpy array.
        technique: "LSB" or "DCT".

    Returns:
        Dictionary with capacity_bits, capacity_bytes, and image_dimensions.
    """
    H, W = image.shape[:2]
    if technique.upper() == "LSB":
        capacity_bits = H * W * 3
    else:  # DCT
        capacity_bits = (H // 8) * (W // 8)

    return {
        "capacity_bits": capacity_bits,
        "capacity_bytes": capacity_bits // 8,
        "image_dimensions": [H, W],
    }


def compute_all_metrics(
    original: np.ndarray,
    stego: np.ndarray,
    technique: str,
    processing_time_ms: float,
) -> dict:
    """Compute all metrics for a stego image in one call.

    Args:
        original: Original cover image as RGB uint8 numpy array.
        stego: Stego image as RGB uint8 numpy array.
        technique: "LSB" or "DCT".
        processing_time_ms: Time taken for embedding in milliseconds.

    Returns:
        Dictionary with mse, psnr, ssim, capacity_bits, capacity_bytes,
        and processing_time_ms.
    """
    mse = compute_mse(original, stego)
    psnr = compute_psnr(mse)
    ssim = compute_ssim(original, stego)
    capacity = compute_capacity(original, technique)

    return {
        "mse": round(mse, 4),
        "psnr": round(psnr, 2),
        "ssim": round(ssim, 6),
        "capacity_bits": capacity["capacity_bits"],
        "capacity_bytes": capacity["capacity_bytes"],
        "processing_time_ms": round(processing_time_ms, 1),
    }
