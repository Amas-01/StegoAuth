import time

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.security import (
    validate_decodable,
    validate_dimensions,
    validate_mime_type,
    validate_upload,
)
from app.schemas.embed import EmbedResponse
from app.services.dct_service import embed_dct
from app.services.heatmap_service import generate_heatmap
from app.services.lsb_service import embed_lsb
from app.services.metrics_service import compute_all_metrics
from app.services.report_service import image_to_base64
from app.utils.image_utils import load_bgr_from_bytes, load_rgb_from_bytes

settings = get_settings()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


async def _process_embed(
    request: Request,
    file: UploadFile,
    token: str,
    technique: str,
    embed_fn,
) -> EmbedResponse:
    """Shared logic for both LSB and DCT embedding endpoints."""
    # Read and validate file
    content = await file.read()
    await validate_upload(content)
    validate_mime_type(content)
    img = validate_decodable(content)
    validate_dimensions(img)

    # Get original RGB image for metrics
    original_rgb = load_rgb_from_bytes(content)
    original_bgr = load_bgr_from_bytes(content)

    # Timing: wrap embedding call
    start = time.perf_counter()
    stego_bytes = embed_fn(content, token)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    # Load stego image for metrics
    stego_rgb = load_rgb_from_bytes(stego_bytes)

    # Compute metrics
    metrics = compute_all_metrics(original_rgb, stego_rgb, technique, elapsed_ms)

    # Generate heatmap
    heatmap_bytes = generate_heatmap(content, stego_bytes)

    # Encode images as base64
    stego_b64 = image_to_base64(stego_bytes)
    heatmap_b64 = image_to_base64(heatmap_bytes)

    H, W = original_rgb.shape[:2]

    # Sanitise token for response
    from app.services.lsb_service import sanitise_token

    sanitised = sanitise_token(token)
    token_bits = len(sanitised) * 8

    return EmbedResponse(
        stego_image_b64=stego_b64,
        heatmap_b64=heatmap_b64,
        technique=technique,
        metrics=metrics,
        image_dimensions=[H, W],
        token_length_bits=token_bits,
        sanitised_token=sanitised,
    )


@router.post("/embed/lsb")
@limiter.limit("20/minute")
async def embed_lsb_endpoint(
    request: Request,
    image: UploadFile = File(..., description="Cover image (JPEG or PNG, max 5 MB)"),
    token: str = Form(..., description="Authentication token to embed (max 64 chars)"),
):
    """Embed an authentication token using LSB steganography.

    Operates in the spatial domain by modifying 1 LSB per colour channel.
    Returns the stego image, pixel difference heatmap, and quality metrics.
    """
    return await _process_embed(request, image, token, "LSB", embed_lsb)


@router.post("/embed/dct")
@limiter.limit("20/minute")
async def embed_dct_endpoint(
    request: Request,
    image: UploadFile = File(..., description="Cover image (JPEG or PNG, max 5 MB)"),
    token: str = Form(..., description="Authentication token to embed (max 64 chars)"),
):
    """Embed an authentication token using DCT steganography.

    Operates in the frequency domain by modifying DCT coefficients
    in the luminance (Y) channel. Returns the stego image, pixel
    difference heatmap, and quality metrics.
    """
    return await _process_embed(request, image, token, "DCT", embed_dct)
