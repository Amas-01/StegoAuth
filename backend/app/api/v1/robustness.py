from fastapi import APIRouter, File, Form, Request, UploadFile
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import (
    validate_decodable,
    validate_dimensions,
    validate_mime_type,
    validate_upload,
)
from app.schemas.robustness import (
    RobustnessResponse,
    SingleRobustnessResult,
    TechniqueRobustnessResult,
)
from app.services.dct_service import embed_dct
from app.services.lsb_service import embed_lsb
from app.services.robustness_service import run_robustness_test

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _build_recommendation(
    lsb_survival: list[int],
    dct_survival: list[int],
) -> str:
    """Build a recommendation string based on survival quality factors.

    Args:
        lsb_survival: Quality factors where LSB achieved BER=0.
        dct_survival: Quality factors where DCT achieved BER=0.

    Returns:
        Human-readable recommendation string.
    """
    lsb_str = ", ".join(str(qf) for qf in lsb_survival) if lsb_survival else "none"
    dct_str = ", ".join(str(qf) for qf in dct_survival) if dct_survival else "none"

    recommendation_parts = [
        f"LSB embedding survives JPEG compression at quality factors: {lsb_str}.",
        f"DCT embedding survives JPEG compression at quality factors: {dct_str}.",
    ]

    if 60 in dct_survival or 75 in dct_survival or 90 in dct_survival:
        recommendation_parts.append(
            "For images distributed via Nigerian mobile messaging platforms "
            "(quality ~60), DCT provides greater authentication reliability "
            "due to its compression resistance."
        )
    elif lsb_survival:
        recommendation_parts.append(
            "LSB may be suitable only if images are stored and transmitted "
            "in lossless formats (PNG)."
        )
    else:
        recommendation_parts.append(
            "Neither technique reliably survives JPEG compression at the "
            "tested quality levels. Consider alternative authentication methods."
        )

    return " ".join(recommendation_parts)


@router.post("/robustness")
@limiter.limit("5/minute")
async def robustness_endpoint(
    request: Request,
    image: UploadFile = File(..., description="Cover image (JPEG or PNG, max 5 MB)"),
    token: str = Form(..., description="Authentication token to embed (max 64 chars)"),
    quality_factors: str = Form(
        "90,75,60,50,30",
        description="Comma-separated JPEG quality factors to test",
    ),
) -> RobustnessResponse:
    """Test robustness of both LSB and DCT embedding against JPEG compression.

    For each quality factor, compresses the stego image via JPEG, attempts
    token extraction, and computes BER and post-compression PSNR.
    """
    # Read and validate file
    content = await image.read()
    await validate_upload(content)
    validate_mime_type(content)
    img = validate_decodable(content)
    validate_dimensions(img)

    # Parse quality factors
    qf_list = []
    for part in quality_factors.split(","):
        part = part.strip()
        if part:
            try:
                qf = int(part)
                if 1 <= qf <= 100:
                    qf_list.append(qf)
            except ValueError:
                pass

    if not qf_list:
        qf_list = [90, 75, 60, 50, 30]

    # Embed both techniques
    lsb_stego_bytes = embed_lsb(content, token)
    dct_stego_bytes = embed_dct(content, token)

    # Run robustness tests
    raw_results = run_robustness_test(
        cover_bytes=content,
        token=token,
        lsb_stego_bytes=lsb_stego_bytes,
        dct_stego_bytes=dct_stego_bytes,
        quality_factors=qf_list,
    )

    # Build typed response
    results: list[SingleRobustnessResult] = []
    lsb_survival: list[int] = []
    dct_survival: list[int] = []

    for r in raw_results:
        lsb_tech = TechniqueRobustnessResult(
            ber=r["lsb"]["ber"],
            post_compression_psnr=r["lsb"]["post_compression_psnr"],
            extracted_token=r["lsb"]["extracted_token"],
            recovery_status=r["lsb"]["recovery_status"],
        )
        dct_tech = TechniqueRobustnessResult(
            ber=r["dct"]["ber"],
            post_compression_psnr=r["dct"]["post_compression_psnr"],
            extracted_token=r["dct"]["extracted_token"],
            recovery_status=r["dct"]["recovery_status"],
        )

        if lsb_tech.recovery_status == "SUCCESS":
            lsb_survival.append(r["quality_factor"])
        if dct_tech.recovery_status == "SUCCESS":
            dct_survival.append(r["quality_factor"])

        results.append(
            SingleRobustnessResult(
                quality_factor=r["quality_factor"],
                context=r["context"],
                lsb=lsb_tech,
                dct=dct_tech,
            )
        )

    recommendation = _build_recommendation(lsb_survival, dct_survival)

    return RobustnessResponse(
        results=results,
        lsb_survival_quality_factors=lsb_survival,
        dct_survival_quality_factors=dct_survival,
        recommendation=recommendation,
    )
