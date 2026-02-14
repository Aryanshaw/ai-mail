from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.auth.service import get_current_user

PROTECTED_PATHS = {"/auth/me", "/auth/logout", "/ws/token"}
PROTECTED_PREFIXES = ("/mail",)


async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if path in PROTECTED_PATHS or path.startswith(PROTECTED_PREFIXES):
        session_token = request.headers.get("x-session-token")
        if not session_token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Unauthorized"},
            )

        try:
            current_user = await get_current_user(session_token)
            request.state.current_user = current_user
            request.state.session_token = session_token
        except HTTPException as exc:
            print(f"Error in auth_middleware: {exc}")
            return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
        except Exception as exc:
            print(f"Error in auth_middleware: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"},
            )

    return await call_next(request)
