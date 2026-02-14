import base64
import hashlib
import hmac
import json
import os

from fastapi import HTTPException, status


def _base64_url_encode(value: bytes) -> str:
    """Encode bytes into URL-safe base64 without padding."""
    try:
        return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")
    except Exception as exc:
        print(f"Error in _base64_url_encode: {exc}")
        raise


def _base64_url_decode(value: str) -> bytes:
    """Decode URL-safe base64 string that may be missing padding."""
    try:
        padding = "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(f"{value}{padding}")
    except Exception as exc:
        print(f"Error in _base64_url_decode: {exc}")
        raise


def _get_ws_token_secret() -> str:
    """Load websocket token secret from environment variables."""
    try:
        secret = os.getenv("WS_TOKEN_SECRET")
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Missing WS_TOKEN_SECRET",
            )
        return secret
    except HTTPException as exc:
        print(f"Error in _get_ws_token_secret: {exc}")
        raise
    except Exception as exc:
        print(f"Error in _get_ws_token_secret: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load websocket secret",
        ) from exc


def create_ws_token(user_id: str, session_token: str) -> str:
    """Create a signed websocket token bound to user and session token."""
    try:
        payload = {
            "user_id": user_id,
            "session_token": session_token,
        }
        payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        payload_part = _base64_url_encode(payload_json)

        secret = _get_ws_token_secret().encode("utf-8")
        signature = hmac.new(secret, payload_part.encode("utf-8"), hashlib.sha256).digest()
        signature_part = _base64_url_encode(signature)

        return f"{payload_part}.{signature_part}"
    except HTTPException as exc:
        print(f"Error in create_ws_token: {exc}")
        raise
    except Exception as exc:
        print(f"Error in create_ws_token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create websocket token",
        ) from exc


def verify_ws_token(token: str) -> dict[str, str]:
    """Verify websocket token signature and return payload values."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid websocket token format",
            )

        payload_part, signature_part = parts
        secret = _get_ws_token_secret().encode("utf-8")
        expected_signature = hmac.new(
            secret,
            payload_part.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        provided_signature = _base64_url_decode(signature_part)

        if not hmac.compare_digest(expected_signature, provided_signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid websocket token signature",
            )

        payload_raw = _base64_url_decode(payload_part)
        payload = json.loads(payload_raw.decode("utf-8"))

        user_id = payload.get("user_id")
        session_token = payload.get("session_token")
        if not user_id or not session_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid websocket token payload",
            )

        return {
            "user_id": str(user_id),
            "session_token": str(session_token),
        }
    except HTTPException as exc:
        print(f"Error in verify_ws_token: {exc}")
        raise
    except Exception as exc:
        print(f"Error in verify_ws_token: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify websocket token",
        ) from exc
