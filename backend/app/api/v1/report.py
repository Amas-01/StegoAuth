from datetime import datetime

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from typing import Optional

from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.services.report_service import generate_pdf_report

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ReportRequest(BaseModel):
    """Request body for PDF report generation."""

    original_b64: str = Field(default="", description="Original image as base64 PNG")
    lsb_stego_b64: str = Field(default="", description="LSB stego image as base64 PNG")
    dct_stego_b64: str = Field(default="", description="DCT stego image as base64 PNG")
    lsb_heatmap_b64: str = Field(default="", description="LSB heatmap as base64 PNG")
    dct_heatmap_b64: str = Field(default="", description="DCT heatmap as base64 PNG")
    lsb_metrics: dict = Field(default_factory=dict, description="LSB metrics dict")
    dct_metrics: dict = Field(default_factory=dict, description="DCT metrics dict")
    robustness_results: list = Field(default_factory=list, description="Robustness test results")
    verdict: dict = Field(default_factory=dict, description="Comparative verdict")
    original_token: str = Field(default="", description="Original embedded token")
    extracted_token: str = Field(default="", description="Extracted token for verification")
    token_match: Optional[bool] = Field(default=None, description="Whether extracted token matches original (None = not verified)")


@router.post("/report/generate")
@limiter.limit("5/minute")
async def report_endpoint(
    request: Request,
    data: ReportRequest,
):
    """Generate a full PDF analysis report.

    Accepts session data including images, metrics, robustness results,
    and authentication verification. Returns a PDF file.
    """
    pdf_bytes = generate_pdf_report(data.model_dump())

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"stegoauth_report_{timestamp}.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
