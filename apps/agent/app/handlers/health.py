from datetime import UTC, datetime


def get_health_payload() -> dict[str, str]:
    return {
        "status": "ok",
        "timestamp": datetime.now(UTC).isoformat(),
    }
