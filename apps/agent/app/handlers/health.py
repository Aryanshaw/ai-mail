from datetime import UTC, datetime

from fastapi import status
from fastapi.responses import JSONResponse


def get_health_payload() -> dict[str, str]:
    return {
        "status": "ok",
        "timestamp": datetime.now(UTC).isoformat(),
    }


async def handle_health_check() -> JSONResponse:
    try:
        return JSONResponse(status_code=status.HTTP_200_OK, content=get_health_payload())
    except Exception as exc:
        print(f"Error in handle_health_check: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )
