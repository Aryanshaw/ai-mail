from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

from app.ai.schemas import AIChatRequest
from app.ai.search_agent import SearchAgent

search_agent = SearchAgent()


async def handle_ai_chat(user_id: str, payload: AIChatRequest) -> JSONResponse:
    """Execute SearchAgent workflow and return UI-actionable chat response."""
    try:
        result = await search_agent.search(
            user_id=user_id,
            message=payload.message,
            context=payload.context.model_dump(by_alias=True),
            model_selector=payload.model,
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=result.model_dump(by_alias=True),
        )
    except HTTPException as exc:
        print(f"Error in handle_ai_chat: {exc}")
        return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
    except Exception as exc:
        print(f"Error in handle_ai_chat: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Internal server error"},
        )
