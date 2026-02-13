import base64
import hashlib
import secrets
from datetime import UTC, datetime, timedelta


def generate_state() -> str:
    return secrets.token_urlsafe(32)


def generate_code_verifier() -> str:
    return secrets.token_urlsafe(64)


def create_code_challenge(code_verifier: str) -> str:
    digest = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def get_session_expiry(days: int = 7) -> datetime:
    return datetime.now(UTC) + timedelta(days=days)
