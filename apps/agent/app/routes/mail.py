from fastapi import APIRouter, Query, Request
from fastapi.responses import JSONResponse

from app.mail.handler import MailHandler
from app.mail.schemas import SendMailRequest

router = APIRouter(prefix="/mail", tags=["mail"])
mail_handler = MailHandler()


@router.get("/inbox")
async def get_inbox_messages(
    request: Request,
    page_token: str | None = Query(default=None),
    page_size: int = Query(default=20, ge=1, le=50),
) -> JSONResponse:
    user_id = request.state.current_user.id
    return await mail_handler.handle_list_messages(user_id, "inbox", page_token, page_size)


@router.get("/sent")
async def get_sent_messages(
    request: Request,
    page_token: str | None = Query(default=None),
    page_size: int = Query(default=20, ge=1, le=50),
) -> JSONResponse:
    user_id = request.state.current_user.id
    return await mail_handler.handle_list_messages(user_id, "sent", page_token, page_size)


@router.get("/{message_id}")
async def get_message_detail(request: Request, message_id: str) -> JSONResponse:
    user_id = request.state.current_user.id
    return await mail_handler.handle_get_message_detail(user_id, message_id)


@router.post("/{message_id}/read")
async def mark_message_read(request: Request, message_id: str) -> JSONResponse:
    user_id = request.state.current_user.id
    return await mail_handler.handle_mark_message_read(user_id, message_id)


@router.post("/send")
async def send_message(request: Request, payload: SendMailRequest) -> JSONResponse:
    user_id = request.state.current_user.id
    return await mail_handler.handle_send_message(
        user_id=user_id,
        to=payload.to,
        cc=payload.cc,
        subject=payload.subject,
        body=payload.body,
    )
