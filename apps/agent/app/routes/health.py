from fastapi import APIRouter

from app.handlers.health import get_health_payload

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    return get_health_payload()
