from typing import Any

from pydantic import BaseModel, Field


class MetricsSchema(BaseModel):
    """Image quality metrics for a single stego image."""

    mse: float = Field(..., description="Mean Squared Error (lower is better)")
    psnr: float = Field(..., description="Peak Signal-to-Noise Ratio in dB (higher is better)")
    ssim: float = Field(..., description="Structural Similarity Index (max 1.0)")
    capacity_bits: int = Field(..., description="Total embedding capacity in bits")
    capacity_bytes: int = Field(..., description="Total embedding capacity in bytes")
    processing_time_ms: float = Field(..., description="Embedding processing time in milliseconds")


class EmbedResponse(BaseModel):
    """Response from a single-technique embedding operation."""

    stego_image_b64: str = Field(..., description="Stego image as base64-encoded PNG")
    heatmap_b64: str = Field(..., description="Pixel difference heatmap as base64-encoded PNG")
    technique: str = Field(..., description="Embedding technique used (LSB or DCT)")
    metrics: MetricsSchema = Field(..., description="Image quality metrics")
    image_dimensions: list[int] = Field(..., description="Image dimensions as [height, width]")
    token_length_bits: int = Field(..., description="Length of embedded token in bits")
    sanitised_token: str = Field(..., description="Sanitised token that was embedded")


class ExtractResponse(BaseModel):
    """Response from a token extraction operation."""

    extracted_token: str = Field(..., description="Token extracted from stego image")
    token_length_bits: int = Field(..., description="Length of extracted token in bits")
    technique: str = Field(..., description="Technique used for extraction (LSB or DCT)")
