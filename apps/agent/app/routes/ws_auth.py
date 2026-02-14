from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.utils.ws_security import create_ws_token

router = APIRouter(prefix="/ws", tags=["ws"])


@router.post("/token")
async def issue_ws_token(request: Request) -> JSONResponse:
    """Issue a signed websocket token for authenticated app users."""
    try:
        current_user = getattr(request.state, "current_user", None)
        session_token = getattr(request.state, "session_token", None)
        if current_user is None or not session_token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Unauthorized"},
            )

        token = create_ws_token(str(current_user.id), str(session_token))
        return JSONResponse(status_code=status.HTTP_200_OK, content={"token": token})
    except Exception as exc:
        print(f"Error in issue_ws_token: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )
