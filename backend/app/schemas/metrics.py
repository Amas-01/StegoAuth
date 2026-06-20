from pydantic import BaseModel, Field


class MetricsSchema(BaseModel):
    """Image quality metrics for a single stego image."""

    mse: float = Field(..., description="Mean Squared Error (lower is better)")
    psnr: float = Field(..., description="Peak Signal-to-Noise Ratio in dB (higher is better)")
    ssim: float = Field(..., description="Structural Similarity Index (max 1.0)")
    capacity_bits: int = Field(..., description="Total embedding capacity in bits")
    capacity_bytes: int = Field(..., description="Total embedding capacity in bytes")
    processing_time_ms: float = Field(..., description="Embedding processing time in milliseconds")
