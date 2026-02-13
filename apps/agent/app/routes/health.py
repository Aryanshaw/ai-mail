from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.handlers.health import handle_health_check

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> JSONResponse:
    return await handle_health_check()
