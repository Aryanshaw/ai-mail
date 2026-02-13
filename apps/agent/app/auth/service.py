import os
from datetime import UTC, datetime, timedelta
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
from sqlalchemy import select

from app.auth.constants import (
    GOOGLE_AUTH_URL,
    GOOGLE_SCOPES,
    GOOGLE_TOKEN_URL,
    GOOGLE_USERINFO_URL,
    PROVIDER_NAME,
)
from app.auth.schemas import AuthUserResponse, GoogleCallbackRequest, GoogleCallbackResponse
from app.auth.security import (
    create_code_challenge,
    generate_code_verifier,
    generate_session_token,
    generate_state,
    get_session_expiry,
)
from app.config.db import get_session_maker
from app.models import OauthAccount, RefreshToken, User


def _required_env(name: str) -> str:
    try:
        value = os.getenv(name)
        if not value:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Missing required env var: {name}",
            )
        return value
    except HTTPException as exc:
        print(f"Error in _required_env: {exc}")
        raise
    except Exception as exc:
        print(f"Error in _required_env: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load environment variable",
        ) from exc


def create_google_start_payload() -> tuple[str, str, str]:
    try:
        client_id = _required_env("GOOGLE_CLIENT_ID")
        redirect_uri = _required_env("GOOGLE_REDIRECT_URI")

        state = generate_state()
        code_verifier = generate_code_verifier()
        code_challenge = create_code_challenge(code_verifier)

        query = urlencode(
            {
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": " ".join(GOOGLE_SCOPES),
                "access_type": "offline",
                "prompt": "consent",
                "include_granted_scopes": "true",
                "state": state,
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
            }
        )
        return f"{GOOGLE_AUTH_URL}?{query}", state, code_verifier
    except HTTPException as exc:
        print(f"Error in create_google_start_payload: {exc}")
        raise
    except Exception as exc:
        print(f"Error in create_google_start_payload: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Google auth payload",
        ) from exc


def _to_user_response(user: User) -> AuthUserResponse:
    try:
        return AuthUserResponse(
            id=str(user.id),
            first_name=user.first_name,
            last_name=user.last_name,
            country_code=user.country_code,
            avatar=user.avatar,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    except Exception as exc:
        print(f"Error in _to_user_response: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to serialize user response",
        ) from exc


async def _exchange_code_for_tokens(code: str, code_verifier: str) -> dict:
    try:
        client_id = _required_env("GOOGLE_CLIENT_ID")
        client_secret = _required_env("GOOGLE_CLIENT_SECRET")
        redirect_uri = _required_env("GOOGLE_REDIRECT_URI")

        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=payload)

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange Google authorization code",
            )

        return response.json()
    except HTTPException as exc:
        print(f"Error in _exchange_code_for_tokens: {exc}")
        raise
    except Exception as exc:
        print(f"Error in _exchange_code_for_tokens: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to exchange authorization code",
        ) from exc


async def _fetch_google_profile(access_token: str) -> dict:
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(GOOGLE_USERINFO_URL, headers=headers)

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to fetch Google user profile",
            )

        return response.json()
    except HTTPException as exc:
        print(f"Error in _fetch_google_profile: {exc}")
        raise
    except Exception as exc:
        print(f"Error in _fetch_google_profile: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch Google profile",
        ) from exc


async def complete_google_login(payload: GoogleCallbackRequest) -> GoogleCallbackResponse:
    try:
        if payload.state != payload.expected_state:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state")

        token_data = await _exchange_code_for_tokens(payload.code, payload.code_verifier)
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing access token from Google token response",
            )

        profile = await _fetch_google_profile(access_token)
        provider_user_id = profile.get("id")
        email = profile.get("email")
        if not provider_user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required profile fields from Google",
            )

        session_maker = get_session_maker()
        async with session_maker() as session:
            existing_account = await session.scalar(
                select(OauthAccount).where(
                    OauthAccount.provider == PROVIDER_NAME,
                    OauthAccount.provider_user_id == provider_user_id,
                )
            )

            user: User | None = None
            if existing_account is not None:
                user = await session.get(User, existing_account.user_id)
            else:
                user = User(
                    first_name=profile.get("given_name") or "Google",
                    last_name=profile.get("family_name") or "User",
                    avatar=profile.get("picture"),
                )
                session.add(user)
                await session.flush()

                existing_account = OauthAccount(
                    user_id=user.id,
                    provider=PROVIDER_NAME,
                    provider_user_id=provider_user_id,
                    email=email,
                    access_token=access_token,
                    refresh_token=token_data.get("refresh_token"),
                    token_type=token_data.get("token_type"),
                    scope=token_data.get("scope"),
                    expires_at=datetime.now(UTC)
                    + timedelta(seconds=int(token_data.get("expires_in", 3600))),
                )
                session.add(existing_account)

            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to resolve user after Google auth",
                )

            if existing_account is not None:
                existing_account.email = email
                existing_account.access_token = access_token
                if token_data.get("refresh_token"):
                    existing_account.refresh_token = token_data["refresh_token"]
                existing_account.token_type = token_data.get("token_type")
                existing_account.scope = token_data.get("scope")
                existing_account.expires_at = datetime.now(UTC) + timedelta(
                    seconds=int(token_data.get("expires_in", 3600))
                )
                user.avatar = profile.get("picture")

            session_token = generate_session_token()
            session_expiry = get_session_expiry(days=int(os.getenv("SESSION_TTL_DAYS", "7")))
            session.add(
                RefreshToken(
                    user_id=user.id,
                    token_id=session_token,
                    expires_at=session_expiry,
                    user_agent=payload.user_agent,
                    ip_address=payload.ip_address,
                )
            )

            await session.commit()
            await session.refresh(user)

            return GoogleCallbackResponse(
                session_token=session_token,
                expires_at=session_expiry,
                user=_to_user_response(user),
            )
    except HTTPException as exc:
        print(f"Error in complete_google_login: {exc}")
        raise
    except Exception as exc:
        print(f"Error in complete_google_login: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete Google login",
        ) from exc


async def get_current_user(session_token: str) -> AuthUserResponse:
    try:
        session_maker = get_session_maker()
        async with session_maker() as session:
            refresh_token = await session.scalar(
                select(RefreshToken).where(
                    RefreshToken.token_id == session_token,
                    RefreshToken.revoked.is_(False),
                    RefreshToken.expires_at > datetime.now(UTC),
                )
            )
            if refresh_token is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

            refresh_token.last_used_at = datetime.now(UTC)
            user = await session.get(User, refresh_token.user_id)
            if user is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

            await session.commit()
            return _to_user_response(user)
    except HTTPException as exc:
        print(f"Error in get_current_user: {exc}")
        raise
    except Exception as exc:
        print(f"Error in get_current_user: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get current user",
        ) from exc


async def logout(session_token: str) -> None:
    try:
        session_maker = get_session_maker()
        async with session_maker() as session:
            refresh_token = await session.scalar(
                select(RefreshToken).where(RefreshToken.token_id == session_token)
            )
            if refresh_token is None:
                return
            refresh_token.revoked = True
            await session.commit()
    except Exception as exc:
        print(f"Error in logout: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout",
        ) from exc
