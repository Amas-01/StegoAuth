import time

from fastapi import APIRouter, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import (
    validate_decodable,
    validate_dimensions,
    validate_mime_type,
    validate_upload,
)
from app.schemas.compare import CompareResponse, VerdictSchema
from app.services.dct_service import embed_dct, sanitise_token
from app.services.heatmap_service import generate_heatmap
from app.services.lsb_service import embed_lsb
from app.services.metrics_service import compute_all_metrics
from app.services.report_service import image_to_base64
from app.utils.image_utils import load_bgr_from_bytes, load_rgb_from_bytes

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _compute_verdict(lsb_metrics: dict, dct_metrics: dict) -> VerdictSchema:
    """Compute automated comparative verdict between LSB and DCT results.

    Determines which technique is better for imperceptibility, capacity,
    and makes a recommendation for Nigerian digital media authentication.

    Args:
        lsb_metrics: Metrics dict from LSB embedding.
        dct_metrics: Metrics dict from DCT embedding.

    Returns:
        VerdictSchema with answers to RQ1, RQ3, and RQ4.
    """
    # RQ1: Imperceptibility — higher PSNR and SSIM wins
    lsb_psnr = lsb_metrics.get("psnr", 0)
    dct_psnr = dct_metrics.get("psnr", 0)
    lsb_ssim = lsb_metrics.get("ssim", 0)
    dct_ssim = dct_metrics.get("ssim", 0)

    lsb_avg_imperceptibility = (lsb_psnr + lsb_ssim * 50) / 2
    dct_avg_imperceptibility = (dct_psnr + dct_ssim * 50) / 2

    better_imperceptibility = "LSB" if lsb_avg_imperceptibility >= dct_avg_imperceptibility else "DCT"

    # RQ1 formatted answer
    rq1_answer = (
        f"LSB achieves higher imperceptibility "
        f"(PSNR {lsb_psnr:.2f} dB vs {dct_psnr:.2f} dB; "
        f"SSIM {lsb_ssim:.6f} vs {dct_ssim:.6f})."
    )
    if better_imperceptibility == "DCT":
        rq1_answer = (
            f"DCT achieves higher imperceptibility "
            f"(PSNR {dct_psnr:.2f} dB vs {lsb_psnr:.2f} dB; "
            f"SSIM {dct_ssim:.6f} vs {lsb_ssim:.6f})."
        )

    # Robustness — DCT is inherently more robust to JPEG compression
    better_robustness = "DCT"

    # RQ3: Capacity — LSB offers much more
    lsb_cap = lsb_metrics.get("capacity_bits", 0)
    dct_cap = dct_metrics.get("capacity_bits", 0)
    better_capacity = "LSB" if lsb_cap >= dct_cap else "DCT"

    capacity_ratio = lsb_cap // dct_cap if dct_cap > 0 else 0
    rq3_answer = (
        f"LSB provides {capacity_ratio}× greater embedding capacity "
        f"({lsb_cap:,} bits vs {dct_cap:,} bits for DCT)."
    )

    # RQ4: Recommendation for Nigerian digital environment
    rq4_answer = (
        "For Nigerian digital media distributed via mobile platforms "
        "applying JPEG compression, DCT is recommended for authentication "
        "applications due to its compression resistance. LSB is suitable "
        "where images will not be re-compressed."
    )

    recommended = "DCT"

    return VerdictSchema(
        better_imperceptibility=better_imperceptibility,
        better_robustness=better_robustness,
        better_capacity=better_capacity,
        recommended_for_authentication=recommended,
        rq1_answer=rq1_answer,
        rq3_answer=rq3_answer,
        rq4_answer=rq4_answer,
    )


@router.post("/compare")
@limiter.limit("10/minute")
async def compare_endpoint(
    request: Request,
    image: UploadFile = File(..., description="Cover image (JPEG or PNG, max 5 MB)"),
    token: str = Form(..., description="Authentication token to embed (max 64 chars)"),
) -> CompareResponse:
    """Run both LSB and DCT embedding on one image and compare results.

    Returns the original image, both stego images, their quality metrics,
    pixel difference heatmaps, and an automated verdict answering the
    thesis research questions (RQ1, RQ3, RQ4).
    """
    # Read and validate file
    content = await image.read()
    await validate_upload(content)
    validate_mime_type(content)
    img = validate_decodable(content)
    validate_dimensions(img)

    # Get original RGB for metrics
    original_rgb = load_rgb_from_bytes(content)

    # Embed using LSB
    start_lsb = time.perf_counter()
    lsb_stego_bytes = embed_lsb(content, token)
    lsb_time = (time.perf_counter() - start_lsb) * 1000.0
    lsb_rgb = load_rgb_from_bytes(lsb_stego_bytes)
    lsb_metrics = compute_all_metrics(original_rgb, lsb_rgb, "LSB", lsb_time)

    # Embed using DCT
    start_dct = time.perf_counter()
    dct_stego_bytes = embed_dct(content, token)
    dct_time = (time.perf_counter() - start_dct) * 1000.0
    dct_rgb = load_rgb_from_bytes(dct_stego_bytes)
    dct_metrics = compute_all_metrics(original_rgb, dct_rgb, "DCT", dct_time)

    # Generate heatmaps
    lsb_heatmap_bytes = generate_heatmap(content, lsb_stego_bytes)
    dct_heatmap_bytes = generate_heatmap(content, dct_stego_bytes)

    # Encode all images as base64
    original_b64 = image_to_base64(content)
    lsb_stego_b64 = image_to_base64(lsb_stego_bytes)
    dct_stego_b64 = image_to_base64(dct_stego_bytes)
    lsb_heatmap_b64 = image_to_base64(lsb_heatmap_bytes)
    dct_heatmap_b64 = image_to_base64(dct_heatmap_bytes)

    # Compute verdict
    verdict = _compute_verdict(lsb_metrics, dct_metrics)

    return CompareResponse(
        original_b64=original_b64,
        lsb_stego_b64=lsb_stego_b64,
        dct_stego_b64=dct_stego_b64,
        lsb_heatmap_b64=lsb_heatmap_b64,
        dct_heatmap_b64=dct_heatmap_b64,
        lsb_metrics=lsb_metrics,
        dct_metrics=dct_metrics,
        verdict=verdict,
    )
