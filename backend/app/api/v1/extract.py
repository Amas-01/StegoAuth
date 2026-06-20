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
from app.schemas.embed import ExtractResponse
from app.services.dct_service import extract_dct, sanitise_token
from app.services.lsb_service import extract_lsb

settings = get_settings()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


async def _process_extract(
    request: Request,
    stego_image: UploadFile,
    technique: str,
    extract_fn,
) -> ExtractResponse:
    """Shared logic for both LSB and DCT extraction endpoints."""
    content = await stego_image.read()
    await validate_upload(content)
    validate_mime_type(content)
    img = validate_decodable(content)
    validate_dimensions(img)

    extracted = extract_fn(content)
    token_bits = len(extracted) * 8

    return ExtractResponse(
        extracted_token=extracted,
        token_length_bits=token_bits,
        technique=technique,
    )


@router.post("/extract/lsb")
@limiter.limit("20/minute")
async def extract_lsb_endpoint(
    request: Request,
    stego_image: UploadFile = File(..., description="Stego image with embedded LSB token"),
):
    """Extract an authentication token from an LSB-stego image."""
    return await _process_extract(request, stego_image, "LSB", extract_lsb)


@router.post("/extract/dct")
@limiter.limit("20/minute")
async def extract_dct_endpoint(
    request: Request,
    stego_image: UploadFile = File(..., description="Stego image with embedded DCT token"),
):
    """Extract an authentication token from a DCT-stego image."""
    return await _process_extract(request, stego_image, "DCT", extract_dct)
