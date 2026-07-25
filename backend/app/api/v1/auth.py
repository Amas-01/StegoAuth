from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import (
    find_auth_record,
    get_session_records,
    save_auth_record,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class SaveRecordRequest(BaseModel):
    session_id: str = Field(..., description="Browser session ID for user isolation")
    image_hash: str = Field(..., description="SHA-256 hash of the original image")
    original_filename: str = Field(default="", description="Original uploaded filename")


class LookupRequest(BaseModel):
    image_hash: str = Field(..., description="SHA-256 hash to look up in auth history")


class SessionRequest(BaseModel):
    session_id: str = Field(..., description="Browser session ID")


@router.post("/auth/record")
@limiter.limit("30/minute")
async def save_record(request: Request, data: SaveRecordRequest):
    save_auth_record(data.session_id, data.image_hash, data.original_filename)
    return {"status": "saved"}


@router.post("/auth/records")
@limiter.limit("30/minute")
async def list_records(request: Request, data: SessionRequest):
    records = get_session_records(data.session_id)
    return {"records": records}


@router.post("/auth/lookup")
@limiter.limit("30/minute")
async def lookup_record(request: Request, data: LookupRequest):
    record = find_auth_record(data.image_hash)
    return {"found": record is not None, "record": record}