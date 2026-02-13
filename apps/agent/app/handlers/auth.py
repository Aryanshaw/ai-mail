from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.auth.schemas import GoogleCallbackRequest, GoogleStartResponse
from app.auth.service import complete_google_login, create_google_start_payload, logout


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


async def handle_me(request: Request) -> JSONResponse:
    try:
        user = getattr(request.state, "current_user", None)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
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


async def handle_logout(request: Request) -> JSONResponse:
    try:
        session_token = getattr(request.state, "session_token", None)
        if not session_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
        await logout(session_token)
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
