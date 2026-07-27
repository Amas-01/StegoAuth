import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.middleware import SecurityHeadersMiddleware
from app.core.database import init_db
from app.api.v1.router import api_router

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="StegoAuth Comparator",
    description=(
        "A Web-Based Comparative Tool for Spatial-Domain (LSB) and "
        "Frequency-Domain (DCT) Steganography in Digital Media Authentication"
    ),
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.add_middleware(SecurityHeadersMiddleware)

init_db()
app.include_router(api_router, prefix="/api/v1")


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add request processing time to response headers."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response
    
@app.get("/healthz")
def render_health_check_endpoint():
    return {"status": healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
