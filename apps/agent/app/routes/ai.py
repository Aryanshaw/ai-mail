from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.ai.handler import handle_ai_chat
from app.ai.schemas import AIChatRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat")
async def ai_chat(request: Request, payload: AIChatRequest) -> JSONResponse:
    user_id = request.state.current_user.id
    return await handle_ai_chat(str(user_id), payload)
