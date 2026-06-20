from pydantic import BaseModel, Field


class TechniqueRobustnessResult(BaseModel):
    """Robustness test result for a single technique at one quality factor."""

    ber: float = Field(..., description="Bit Error Rate (0.0 = perfect, 1.0 = complete corruption)")
    post_compression_psnr: float = Field(..., description="Post-compression PSNR in dB")
    extracted_token: str = Field(..., description="Token extracted after compression")
    recovery_status: str = Field(..., description="SUCCESS if BER=0, FAILED otherwise")


class SingleRobustnessResult(BaseModel):
    """Robustness test result for both techniques at one quality factor."""

    quality_factor: int = Field(..., description="JPEG quality factor (30-90)")
    context: str = Field(..., description="Nigerian digital distribution context description")
    lsb: TechniqueRobustnessResult = Field(..., description="LSB robustness result")
    dct: TechniqueRobustnessResult = Field(..., description="DCT robustness result")


class RobustnessResponse(BaseModel):
    """Response from a full robustness test across multiple quality factors."""

    results: list[SingleRobustnessResult] = Field(..., description="Results per quality factor")
    lsb_survival_quality_factors: list[int] = Field(..., description="Quality factors where LSB achieved BER=0")
    dct_survival_quality_factors: list[int] = Field(..., description="Quality factors where DCT achieved BER=0")
    recommendation: str = Field(..., description="Recommendation based on robustness results")
