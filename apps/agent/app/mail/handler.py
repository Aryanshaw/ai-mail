from fastapi import HTTPException, status
from fastapi.responses import JSONResponse

from app.mail.service import GmailMailService


class MailHandler:
    """Handle API responses for mailbox operations."""

    def __init__(self):
        self.mail_service = GmailMailService()

    async def handle_list_messages(
        self,
        user_id: str,
        mailbox: str,
        page_token: str | None,
        page_size: int,
    ) -> JSONResponse:
        """List mailbox messages and return paginated response payload."""
        try:
            result = await self.mail_service.list_messages(user_id, mailbox, page_token, page_size)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=result.model_dump(by_alias=True),
            )
        except HTTPException as exc:
            print(f"Error in MailHandler.handle_list_messages: {exc}")
            return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
        except Exception as exc:
            print(f"Error in MailHandler.handle_list_messages: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"},
            )

    async def handle_get_message_detail(self, user_id: str, message_id: str) -> JSONResponse:
        """Get full content for one message id in the currently selected mailbox."""
        try:
            result = await self.mail_service.get_message_detail(user_id, message_id)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=result.model_dump(by_alias=True),
            )
        except HTTPException as exc:
            print(f"Error in MailHandler.handle_get_message_detail: {exc}")
            return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
        except Exception as exc:
            print(f"Error in MailHandler.handle_get_message_detail: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"},
            )

    async def handle_mark_message_read(self, user_id: str, message_id: str) -> JSONResponse:
        """Set a message as read and return updated unread status."""
        try:
            result = await self.mail_service.mark_message_read(user_id, message_id)
            return JSONResponse(status_code=status.HTTP_200_OK, content=result.model_dump())
        except HTTPException as exc:
            print(f"Error in MailHandler.handle_mark_message_read: {exc}")
            return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
        except Exception as exc:
            print(f"Error in MailHandler.handle_mark_message_read: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"},
            )

    async def handle_send_message(
        self,
        user_id: str,
        to: str,
        cc: str | None,
        subject: str,
        body: str,
    ) -> JSONResponse:
        """Send a compose draft via Gmail API and return send result."""
        try:
            result = await self.mail_service.send_message(user_id, to, cc, subject, body)
            return JSONResponse(status_code=status.HTTP_200_OK, content=result.model_dump())
        except HTTPException as exc:
            print(f"Error in MailHandler.handle_send_message: {exc}")
            return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})
        except Exception as exc:
            print(f"Error in MailHandler.handle_send_message: {exc}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"},
            )
