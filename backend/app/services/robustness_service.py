import os
import tempfile

import cv2
import numpy as np

from app.services.lsb_service import extract_lsb
from app.services.dct_service import extract_dct
from app.services.metrics_service import compute_ber, compute_mse, compute_psnr
from app.utils.image_utils import load_rgb_from_bytes, load_bgr_from_bytes

QUALITY_CONTEXT_MAP = {
    90: "High-quality social media upload",
    75: "Standard web distribution",
    60: "Nigerian mobile messaging",
    50: "Low-bandwidth mobile messaging",
    30: "Stress test — extreme compression",
}


def _compress_and_extract(
    stego_bytes: bytes,
    quality_factor: int,
    original_token: str,
    extract_fn,
) -> dict:
    """Compress stego image via JPEG and attempt extraction.

    Args:
        stego_bytes: Raw bytes of the stego image (PNG).
        quality_factor: JPEG quality factor (0-100).
        original_token: The token that was embedded, for BER computation.
        extract_fn: Function to extract token (extract_lsb or extract_dct).

    Returns:
        Dictionary with ber, post_compression_psnr, extracted_token,
        and recovery_status.
    """
    tmp_path = None
    try:
        # Step i: Decode stego and write to temporary JPEG file
        stego_bgr = cv2.imdecode(
            np.frombuffer(stego_bytes, np.uint8), cv2.IMREAD_COLOR
        )

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name

        cv2.imwrite(
            tmp_path,
            stego_bgr,
            [int(cv2.IMWRITE_JPEG_QUALITY), quality_factor],
        )

        # Step ii: Read back the compressed-then-decompressed image
        compressed_bgr = cv2.imread(tmp_path)

        # Encode compressed image to bytes for extraction
        success, buffer = cv2.imencode(".jpg", compressed_bgr)
        if not success:
            return {
                "ber": 1.0,
                "post_compression_psnr": 0.0,
                "extracted_token": "",
                "recovery_status": "FAILED",
            }
        compressed_bytes = buffer.tobytes()

        # Step iii: Attempt extraction
        try:
            extracted_token = extract_fn(compressed_bytes)
        except (ValueError, Exception):
            extracted_token = ""

        # Step iv: Compute BER
        ber = compute_ber(original_token, extracted_token)

        # Step v: Compute post-compression PSNR
        try:
            compressed_rgb = cv2.cvtColor(compressed_bgr, cv2.COLOR_BGR2RGB)
            mse_post = compute_mse(
                load_rgb_from_bytes(stego_bytes), compressed_rgb
            )
            psnr_post = compute_psnr(mse_post)
        except Exception:
            psnr_post = 0.0

        recovery_status = "SUCCESS" if ber == 0.0 else "FAILED"

        return {
            "ber": round(ber, 4),
            "post_compression_psnr": round(psnr_post, 2),
            "extracted_token": extracted_token if extracted_token else "",
            "recovery_status": recovery_status,
        }

    finally:
        # Guarantee temp file cleanup
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def run_robustness_test(
    cover_bytes: bytes,
    token: str,
    lsb_stego_bytes: bytes,
    dct_stego_bytes: bytes,
    quality_factors: list[int] | None = None,
) -> list[dict]:
    """Run JPEG compression robustness testing for both LSB and DCT techniques.

    For each quality factor, compresses the stego image via JPEG, attempts
    token extraction, computes BER and post-compression PSNR.

    Quality levels tested: 90, 75, 60, 50, 30.

    Args:
        cover_bytes: Raw bytes of the original cover image.
        token: The original embedded token (for BER computation).
        lsb_stego_bytes: LSB stego image as PNG bytes.
        dct_stego_bytes: DCT stego image as PNG bytes.
        quality_factors: List of JPEG quality factors to test.
            Defaults to [90, 75, 60, 50, 30].

    Returns:
        List of dictionaries, one per quality factor, each containing:
            quality_factor, context, lsb, dct
        where lsb and dct each contain:
            ber, post_compression_psnr, extracted_token, recovery_status
    """
    if quality_factors is None:
        quality_factors = [90, 75, 60, 50, 30]

    results: list[dict] = []

    for qf in quality_factors:
        lsb_result = _compress_and_extract(
            lsb_stego_bytes, qf, token, extract_lsb
        )
        dct_result = _compress_and_extract(
            dct_stego_bytes, qf, token, extract_dct
        )

        context = QUALITY_CONTEXT_MAP.get(qf, f"Quality factor {qf}")

        results.append({
            "quality_factor": qf,
            "context": context,
            "lsb": lsb_result,
            "dct": dct_result,
        })

    return results
