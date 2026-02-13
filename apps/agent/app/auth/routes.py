from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

from app.auth.schemas import GoogleCallbackRequest
from app.handlers.auth import handle_google_callback, handle_google_start, handle_logout, handle_me

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/start")
async def google_start() -> JSONResponse:
    return await handle_google_start()


@router.post("/google/callback")
async def google_callback(payload: GoogleCallbackRequest) -> JSONResponse:
    return await handle_google_callback(payload)


@router.get("/me")
async def me(x_session_token: str | None = Header(default=None)) -> JSONResponse:
    return await handle_me(x_session_token)


@router.post("/logout")
async def logout_route(x_session_token: str | None = Header(default=None)) -> JSONResponse:
    return await handle_logout(x_session_token)
