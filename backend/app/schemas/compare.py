from pydantic import BaseModel, Field

from app.schemas.embed import MetricsSchema


class VerdictSchema(BaseModel):
    """Automated comparative verdict answering research questions."""

    better_imperceptibility: str = Field(..., description="Technique with better PSNR/SSIM (LSB or DCT)")
    better_robustness: str = Field(..., description="Technique with better compression resistance (LSB or DCT)")
    better_capacity: str = Field(..., description="Technique with higher embedding capacity (LSB or DCT)")
    recommended_for_authentication: str = Field(..., description="Recommended technique for authentication (LSB or DCT)")
    rq1_answer: str = Field(..., description="Answer to RQ1: which technique provides higher imperceptibility")
    rq3_answer: str = Field(..., description="Answer to RQ3: differences in embedding capacity")
    rq4_answer: str = Field(..., description="Answer to RQ4: which technique is more suitable for Nigerian digital environment")


class CompareResponse(BaseModel):
    """Response from a side-by-side comparison of LSB and DCT embedding."""

    original_b64: str = Field(..., description="Original cover image as base64-encoded PNG")
    lsb_stego_b64: str = Field(..., description="LSB stego image as base64-encoded PNG")
    dct_stego_b64: str = Field(..., description="DCT stego image as base64-encoded PNG")
    lsb_heatmap_b64: str = Field(..., description="LSB pixel difference heatmap as base64-encoded PNG")
    dct_heatmap_b64: str = Field(..., description="DCT pixel difference heatmap as base64-encoded PNG")
    lsb_metrics: MetricsSchema = Field(..., description="LSB image quality metrics")
    dct_metrics: MetricsSchema = Field(..., description="DCT image quality metrics")
    verdict: VerdictSchema = Field(..., description="Automated comparative verdict")
