from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import desc, select

from app.config.db import get_session_maker
from app.models import AIConversation, AIConversationMessage


class AIConversationMemoryService:
    """Persist and retrieve chat memory for context-aware AI conversations."""

    async def resolve_conversation(
        self,
        user_id: str,
        mailbox: str,
        conversation_id: str | None,
    ) -> AIConversation:
        """Resolve existing conversation or create one when no valid id is provided."""
        try:
            parsed_user_id = UUID(user_id)
            parsed_conversation_id = self._parse_uuid_or_none(conversation_id)
            normalized_mailbox = mailbox if mailbox in {"inbox", "sent"} else "inbox"
            session_maker = get_session_maker()

            async with session_maker() as session:
                if parsed_conversation_id is not None:
                    conversation = await session.get(AIConversation, parsed_conversation_id)
                    if conversation is None or conversation.user_id != parsed_user_id:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail="Conversation not found",
                        )
                    if conversation.is_archived:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Conversation is archived",
                        )
                    return conversation

                latest_conversation = await session.scalar(
                    select(AIConversation)
                    .where(
                        AIConversation.user_id == parsed_user_id,
                        AIConversation.mailbox == normalized_mailbox,
                        AIConversation.is_archived.is_(False),
                    )
                    .order_by(desc(AIConversation.last_message_at))
                )
                if latest_conversation is not None:
                    return latest_conversation

                conversation = AIConversation(
                    user_id=parsed_user_id,
                    mailbox=normalized_mailbox,
                    title=f"{normalized_mailbox.title()} chat",
                )
                session.add(conversation)
                await session.commit()
                await session.refresh(conversation)
                return conversation
        except HTTPException as exc:
            print(f"Error in AIConversationMemoryService.resolve_conversation: {exc}")
            raise
        except Exception as exc:
            print(f"Error in AIConversationMemoryService.resolve_conversation: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to resolve conversation",
            ) from exc

    async def append_message(
        self,
        conversation_id: str,
        user_id: str,
        role: str,
        content: str,
        ui_actions_json: list[dict] | None = None,
        trace_json: dict | None = None,
    ) -> AIConversationMessage:
        """Persist one conversation message and bump conversation last activity timestamp."""
        try:
            parsed_conversation_id = UUID(conversation_id)
            parsed_user_id = UUID(user_id)
            session_maker = get_session_maker()
            async with session_maker() as session:
                conversation = await session.get(AIConversation, parsed_conversation_id)
                if conversation is None or conversation.user_id != parsed_user_id:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Conversation not found",
                    )

                message = AIConversationMessage(
                    conversation_id=parsed_conversation_id,
                    user_id=parsed_user_id,
                    role=role,
                    content=content,
                    ui_actions_json=(
                        {"items": ui_actions_json} if ui_actions_json is not None else None
                    ),
                    trace_json=trace_json,
                    token_count=self._estimate_token_count(content),
                )
                conversation.last_message_at = datetime.now(UTC)
                session.add(message)
                await session.commit()
                await session.refresh(message)
                return message
        except HTTPException as exc:
            print(f"Error in AIConversationMemoryService.append_message: {exc}")
            raise
        except Exception as exc:
            print(f"Error in AIConversationMemoryService.append_message: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist conversation message",
            ) from exc

    async def fetch_recent_messages(
        self,
        conversation_id: str,
        user_id: str,
        limit: int = 12,
    ) -> list[AIConversationMessage]:
        """Fetch recent conversation turns for server-side memory context."""
        try:
            parsed_conversation_id = UUID(conversation_id)
            parsed_user_id = UUID(user_id)
            session_maker = get_session_maker()
            async with session_maker() as session:
                messages = await session.scalars(
                    select(AIConversationMessage)
                    .where(
                        AIConversationMessage.conversation_id == parsed_conversation_id,
                        AIConversationMessage.user_id == parsed_user_id,
                    )
                    .order_by(desc(AIConversationMessage.created_at))
                    .limit(limit)
                )
                return list(reversed(list(messages)))
        except Exception as exc:
            print(f"Error in AIConversationMemoryService.fetch_recent_messages: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch conversation history",
            ) from exc

    def build_history_context(
        self,
        messages: list[AIConversationMessage],
    ) -> list[dict[str, str]]:
        """Convert persisted history rows into role/content records for prompt context."""
        try:
            history_context: list[dict[str, str]] = []
            for message in messages:
                history_context.append(
                    {
                        "role": message.role,
                        "content": message.content,
                    }
                )
            return history_context
        except Exception as exc:
            print(f"Error in AIConversationMemoryService.build_history_context: {exc}")
            return []

    def _estimate_token_count(self, content: str) -> int:
        """Approximate token count for metadata analytics and future trimming."""
        try:
            return max(1, len(content.split()))
        except Exception as exc:
            print(f"Error in AIConversationMemoryService._estimate_token_count: {exc}")
            return 0

    def _parse_uuid_or_none(self, raw_value: str | None) -> UUID | None:
        """Parse UUID safely from optional input and return None for invalid values."""
        try:
            if not raw_value:
                return None
            return UUID(raw_value)
        except Exception as exc:
            print(f"Error in AIConversationMemoryService._parse_uuid_or_none: {exc}")
            return None
