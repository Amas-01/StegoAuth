from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "environment": "development",
    }
