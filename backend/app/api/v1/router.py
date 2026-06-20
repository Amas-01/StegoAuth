from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.embed import router as embed_router
from app.api.v1.extract import router as extract_router
from app.api.v1.compare import router as compare_router
from app.api.v1.robustness import router as robustness_router
from app.api.v1.report import router as report_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(embed_router, tags=["Embed"])
api_router.include_router(extract_router, tags=["Extract"])
api_router.include_router(compare_router, tags=["Compare"])
api_router.include_router(robustness_router, tags=["Robustness"])
api_router.include_router(report_router, tags=["Report"])
