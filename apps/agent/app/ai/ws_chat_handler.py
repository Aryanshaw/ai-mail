from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import WebSocket
from pydantic import ValidationError

from app.ai.schemas import AIWsChatRequestPayload
from app.ai.search_agent import SearchAgent


class AIWebSocketChatHandler:
    """Handle websocket-based AI chat lifecycle events and streamed assistant updates."""

    def __init__(self):
        self.search_agent = SearchAgent()

    async def handle_chat_request(
        self,
        websocket: WebSocket,
        user_id: str,
        payload: dict[str, Any],
    ) -> None:
        """Validate chat payload, run search agent, stream deltas, and emit UI action events."""
        try:
            request_payload = AIWsChatRequestPayload.model_validate(payload)
            chat_id = request_payload.chat_id
            message = request_payload.message.strip()
            if not message:
                await self._emit_chat_error(websocket, chat_id, "Message cannot be empty")
                return

            await self._emit_chat_start(
                websocket=websocket,
                chat_id=chat_id,
                user_message=message,
                model=request_payload.model,
            )

            response = await self.search_agent.search(
                user_id=user_id,
                message=message,
                context=request_payload.context.model_dump(by_alias=True),
                model_selector=request_payload.model,
            )

            for chunk in self._chunk_message(response.assistant_message):
                await self._emit_chat_delta(websocket=websocket, chat_id=chat_id, delta=chunk)

            serialized_results = [
                item.model_dump(by_alias=True) for item in response.results
            ]
            for action in response.ui_actions:
                await self._emit_chat_action(
                    websocket=websocket,
                    chat_id=chat_id,
                    action=action.model_dump(by_alias=True),
                    results=serialized_results,
                )

            await self._emit_chat_completed(
                websocket=websocket,
                chat_id=chat_id,
                response_payload=response.model_dump(by_alias=True),
            )
        except ValidationError as exc:
            print(f"Error in AIWebSocketChatHandler.handle_chat_request.validation: {exc}")
            await self._emit_chat_error(websocket, None, "Invalid chat request payload")
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler.handle_chat_request: {exc}")
            chat_id = payload.get("chatId") if isinstance(payload, dict) else None
            await self._emit_chat_error(websocket, chat_id, "AI chat failed")

    async def _emit_chat_start(
        self,
        websocket: WebSocket,
        chat_id: str,
        user_message: str,
        model: str,
    ) -> None:
        """Send chat_start event to mark beginning of agent processing."""
        try:
            await websocket.send_json(
                {
                    "type": "chat_start",
                    "eventId": f"{chat_id}-start",
                    "ts": self._utc_now_iso(),
                    "payload": {
                        "chatId": chat_id,
                        "userMessage": user_message,
                        "model": model,
                    },
                }
            )
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._emit_chat_start: {exc}")
            raise

    async def _emit_chat_delta(self, websocket: WebSocket, chat_id: str, delta: str) -> None:
        """Send one incremental assistant text chunk to drive streaming UI updates."""
        try:
            await websocket.send_json(
                {
                    "type": "chat_delta",
                    "eventId": f"{chat_id}-delta-{datetime.now(UTC).timestamp()}",
                    "ts": self._utc_now_iso(),
                    "payload": {
                        "chatId": chat_id,
                        "delta": delta,
                    },
                }
            )
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._emit_chat_delta: {exc}")
            raise

    async def _emit_chat_action(
        self,
        websocket: WebSocket,
        chat_id: str,
        action: dict[str, Any],
        results: list[dict[str, Any]],
    ) -> None:
        """Send a UI action event so client can update mail panel without waiting for completion."""
        try:
            await websocket.send_json(
                {
                    "type": "chat_action",
                    "eventId": f"{chat_id}-action-{datetime.now(UTC).timestamp()}",
                    "ts": self._utc_now_iso(),
                    "payload": {
                        "chatId": chat_id,
                        "action": action,
                        "results": results,
                    },
                }
            )
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._emit_chat_action: {exc}")
            raise

    async def _emit_chat_completed(
        self,
        websocket: WebSocket,
        chat_id: str,
        response_payload: dict[str, Any],
    ) -> None:
        """Send final chat payload with assistant text, actions, results, and trace metadata."""
        try:
            await websocket.send_json(
                {
                    "type": "chat_completed",
                    "eventId": f"{chat_id}-completed",
                    "ts": self._utc_now_iso(),
                    "payload": {
                        "chatId": chat_id,
                        **response_payload,
                    },
                }
            )
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._emit_chat_completed: {exc}")
            raise

    async def _emit_chat_error(
        self,
        websocket: WebSocket,
        chat_id: str | None,
        message: str,
    ) -> None:
        """Send error event for malformed requests or agent failures."""
        try:
            await websocket.send_json(
                {
                    "type": "chat_error",
                    "eventId": f"{chat_id or 'chat'}-error",
                    "ts": self._utc_now_iso(),
                    "payload": {
                        "chatId": chat_id,
                        "message": message,
                    },
                }
            )
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._emit_chat_error: {exc}")

    def _chunk_message(self, message: str) -> list[str]:
        """Split final assistant message into token-like chunks for progressive rendering."""
        try:
            if not message:
                return [""]
            words = message.split()
            if not words:
                return [message]
            chunk_size = 4
            chunks: list[str] = []
            for index in range(0, len(words), chunk_size):
                chunk_words = words[index : index + chunk_size]
                chunk_text = " ".join(chunk_words)
                if index + chunk_size < len(words):
                    chunk_text = f"{chunk_text} "
                chunks.append(chunk_text)
            return chunks
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._chunk_message: {exc}")
            return [message]

    def _utc_now_iso(self) -> str:
        """Return UTC timestamp string used by websocket event envelopes."""
        try:
            return datetime.now(UTC).isoformat()
        except Exception as exc:
            print(f"Error in AIWebSocketChatHandler._utc_now_iso: {exc}")
            return ""
