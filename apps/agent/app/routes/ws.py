import json

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.ai.schemas import WsClientEvent
from app.ai.ws_chat_handler import AIWebSocketChatHandler
from app.auth.service import get_current_user
from app.utils.ws_security import verify_ws_token

router = APIRouter(tags=["ws"])
chat_handler = AIWebSocketChatHandler()


@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    """Accept authenticated websocket clients for future realtime events."""
    try:
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4401, reason="Missing websocket token")
            return

        token_payload = verify_ws_token(token)
        session_token = token_payload["session_token"]

        current_user = await get_current_user(session_token)
        user_id = str(current_user.id)

        await websocket.accept()
        await websocket.send_json(
            {
                "type": "system.ready",
                "eventId": "ws-ready",
                "ts": "",
                "payload": {"ok": True},
            }
        )

        while True:
            raw_message = await websocket.receive_text()
            try:
                parsed_message = json.loads(raw_message)
                client_event = WsClientEvent.model_validate(parsed_message)
                if client_event.type == "chat_request":
                    await chat_handler.handle_chat_request(
                        websocket=websocket,
                        user_id=user_id,
                        payload=client_event.payload,
                    )
            except Exception as exc:
                print(f"Error in websocket_events.message_parse: {exc}")
                await websocket.send_json(
                    {
                        "type": "chat_error",
                        "eventId": "chat-invalid-event",
                        "ts": "",
                        "payload": {
                            "chatId": None,
                            "message": "Invalid websocket chat event",
                        },
                    }
                )
    except WebSocketDisconnect:
        return
    except HTTPException as exc:
        print(f"Error in websocket_events: {exc}")
        try:
            await websocket.close(code=4401, reason="Unauthorized")
        except Exception as close_exc:
            print(f"Error in websocket_events.close_http_exception: {close_exc}")
    except Exception as exc:
        print(f"Error in websocket_events: {exc}")
        try:
            await websocket.close(code=1011, reason="Websocket internal error")
        except Exception as close_exc:
            print(f"Error in websocket_events.close_exception: {close_exc}")
