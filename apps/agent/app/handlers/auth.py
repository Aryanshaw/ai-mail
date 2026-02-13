from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

from app.auth.schemas import GoogleCallbackRequest, GoogleStartResponse
from app.auth.service import (
    complete_google_login,
    create_google_start_payload,
    get_current_user,
    logout,
)


async def handle_google_start() -> JSONResponse:
    try:
        authorization_url, state, code_verifier = create_google_start_payload()
        payload = GoogleStartResponse(
            authorization_url=authorization_url,
            state=state,
            code_verifier=code_verifier,
        )
        return JSONResponse(status_code=status.HTTP_200_OK, content=payload.model_dump(mode="json"))
    except HTTPException as exc:
        print(f"Error in handle_google_start: {exc}")
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    except Exception as exc:
        print(f"Error in handle_google_start: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )


async def handle_google_callback(payload: GoogleCallbackRequest) -> JSONResponse:
    try:
        result = await complete_google_login(payload)
        return JSONResponse(status_code=status.HTTP_200_OK, content=result.model_dump(mode="json"))
    except HTTPException as exc:
        print(f"Error in handle_google_callback: {exc}")
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    except Exception as exc:
        print(f"Error in handle_google_callback: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )


async def handle_me(x_session_token: str | None) -> JSONResponse:
    try:
        if not x_session_token:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"authenticated": False})
        user = await get_current_user(x_session_token)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"authenticated": True, "user": user.model_dump(mode="json")},
        )
    except HTTPException as exc:
        print(f"Error in handle_me: {exc}")
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    except Exception as exc:
        print(f"Error in handle_me: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )


async def handle_logout(x_session_token: str | None) -> JSONResponse:
    try:
        if x_session_token:
            await logout(x_session_token)
        return JSONResponse(status_code=status.HTTP_200_OK, content={"ok": True})
    except HTTPException as exc:
        print(f"Error in handle_logout: {exc}")
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    except Exception as exc:
        print(f"Error in handle_logout: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )
