from fastapi import APIRouter, Request
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
async def me(request: Request) -> JSONResponse:
    return await handle_me(request)


@router.post("/logout")
async def logout_route(request: Request) -> JSONResponse:
    return await handle_logout(request)
