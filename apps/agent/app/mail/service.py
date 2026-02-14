import base64
import os
import uuid
from datetime import UTC, datetime, timedelta

import aiohttp
from fastapi import HTTPException, status
from sqlalchemy import select

from app.config.db import get_session_maker
from app.mail.schemas import (
    MailDetailResponse,
    MailListItem,
    MailListResponse,
    MarkMailReadResponse,
)
from app.models import OauthAccount
from app.utils.constants import GMAIL_API_BASE_URL, GOOGLE_TOKEN_URL, PROVIDER_NAME


class GmailTokenService:
    """Resolve and refresh Gmail access tokens for authenticated users."""

    async def get_valid_access_token(self, user_id: str) -> str:
        """Return a non-expired Google access token for the given app user id."""
        try:
            oauth_account = await self._get_oauth_account(user_id)
            oauth_account = await self.refresh_access_token_if_needed(oauth_account)
            if not oauth_account.access_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Missing Google access token",
                )
            return oauth_account.access_token
        except HTTPException as exc:
            print(f"Error in GmailTokenService.get_valid_access_token: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailTokenService.get_valid_access_token: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to resolve Google access token",
            ) from exc

    async def refresh_access_token_if_needed(self, oauth_account: OauthAccount) -> OauthAccount:
        """Refresh token with Google when expiry is near and persist updated credentials."""
        try:
            expiry = oauth_account.expires_at
            should_refresh = expiry is not None and expiry <= datetime.now(UTC) + timedelta(
                seconds=60
            )
            if not should_refresh:
                return oauth_account

            if not oauth_account.refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google refresh token unavailable; re-authenticate",
                )

            client_id = os.getenv("GOOGLE_CLIENT_ID")
            client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
            if not client_id or not client_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Google OAuth credentials missing",
                )

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as client:
                async with client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": oauth_account.refresh_token,
                        "grant_type": "refresh_token",
                    },
                ) as response:
                    payload = await response.json(content_type=None)
                    if response.status >= 400:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=payload.get("error_description")
                            or payload.get("error")
                            or "Failed to refresh Google token",
                        )

            access_token = payload.get("access_token")
            expires_in = int(payload.get("expires_in", 3600))
            if not access_token:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Invalid Google refresh response",
                )

            session_maker = get_session_maker()
            async with session_maker() as session:
                db_account = await session.get(OauthAccount, oauth_account.id)
                if db_account is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="OAuth account no longer exists",
                    )
                db_account.access_token = access_token
                db_account.expires_at = datetime.now(UTC) + timedelta(seconds=expires_in)
                if payload.get("scope"):
                    db_account.scope = payload["scope"]
                if payload.get("token_type"):
                    db_account.token_type = payload["token_type"]
                await session.commit()
                await session.refresh(db_account)
                return db_account
        except HTTPException as exc:
            print(f"Error in GmailTokenService.refresh_access_token_if_needed: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailTokenService.refresh_access_token_if_needed: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to refresh Google token",
            ) from exc

    async def _get_oauth_account(self, user_id: str) -> OauthAccount:
        """Load Google OAuth credentials for the app user."""
        try:
            parsed_user_id = uuid.UUID(user_id)
            session_maker = get_session_maker()
            async with session_maker() as session:
                oauth_account = await session.scalar(
                    select(OauthAccount).where(
                        OauthAccount.user_id == parsed_user_id,
                        OauthAccount.provider == PROVIDER_NAME,
                    )
                )
            if oauth_account is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Google account not connected",
                )
            return oauth_account
        except ValueError as exc:
            print(f"Error in GmailTokenService._get_oauth_account: {exc}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user id",
            ) from exc
        except HTTPException as exc:
            print(f"Error in GmailTokenService._get_oauth_account: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailTokenService._get_oauth_account: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to load OAuth account",
            ) from exc


class GmailMailService:
    """Read and update Gmail messages used by the mail workspace UI."""

    def __init__(self):
        self.token_service = GmailTokenService()

    async def list_messages(
        self,
        user_id: str,
        mailbox: str,
        page_token: str | None,
        page_size: int,
    ) -> MailListResponse:
        """Fetch paginated inbox or sent messages and return summarized list items."""
        try:
            access_token = await self.token_service.get_valid_access_token(user_id)
            headers = {"Authorization": f"Bearer {access_token}"}

            params: dict[str, str | int] = {"maxResults": page_size}
            if page_token:
                params["pageToken"] = page_token
            params["labelIds"] = "SENT" if mailbox == "sent" else "INBOX"

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as client:
                async with client.get(
                    f"{GMAIL_API_BASE_URL}/users/me/messages",
                    headers=headers,
                    params=params,
                ) as response:
                    payload = await response.json(content_type=None)
                    if response.status >= 400:
                        detail = payload.get("error", {}).get(
                            "message", "Failed to fetch Gmail messages"
                        )
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=detail,
                        )

                messages = payload.get("messages", [])
                items = await self._fetch_list_items(client, headers, messages)

            return MailListResponse(items=items, nextPageToken=payload.get("nextPageToken"))
        except HTTPException as exc:
            print(f"Error in GmailMailService.list_messages: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailMailService.list_messages: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list mail messages",
            ) from exc

    async def get_message_detail(self, user_id: str, message_id: str) -> MailDetailResponse:
        """Fetch a single Gmail message with full body content for the detail panel."""
        try:
            access_token = await self.token_service.get_valid_access_token(user_id)
            headers = {"Authorization": f"Bearer {access_token}"}
            params = {
                "format": "full",
                "fields": (
                    "id,snippet,labelIds,internalDate,payload/headers,"
                    "payload/body,payload/parts"
                ),
            }

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as client:
                async with client.get(
                    f"{GMAIL_API_BASE_URL}/users/me/messages/{message_id}",
                    headers=headers,
                    params=params,
                ) as response:
                    payload = await response.json(content_type=None)
                    if response.status >= 400:
                        detail = payload.get("error", {}).get(
                            "message", "Failed to fetch message detail"
                        )
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=detail,
                        )

            header_map = self._extract_header_map(payload.get("payload", {}).get("headers", []))
            sender = header_map.get("from", "Unknown sender")
            subject = header_map.get("subject", "(no subject)")
            internal_date = payload.get("internalDate")
            unread = "UNREAD" in (payload.get("labelIds") or [])
            body = self._extract_plain_text_body(payload.get("payload", {}))

            return MailDetailResponse(
                id=payload.get("id", message_id),
                sender=sender,
                subject=subject,
                snippet=payload.get("snippet", ""),
                body=body or payload.get("snippet", ""),
                dateLabel=self._format_date_label(internal_date),
                unread=unread,
            )
        except HTTPException as exc:
            print(f"Error in GmailMailService.get_message_detail: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailMailService.get_message_detail: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch message detail",
            ) from exc

    async def mark_message_read(self, user_id: str, message_id: str) -> MarkMailReadResponse:
        """Mark a Gmail message as read by removing the UNREAD label."""
        try:
            access_token = await self.token_service.get_valid_access_token(user_id)
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as client:
                async with client.post(
                    f"{GMAIL_API_BASE_URL}/users/me/messages/{message_id}/modify",
                    headers=headers,
                    json={"removeLabelIds": ["UNREAD"]},
                ) as response:
                    payload = await response.json(content_type=None)
                    if response.status >= 400:
                        detail = payload.get("error", {}).get(
                            "message", "Failed to mark message as read"
                        )
                        raise HTTPException(
                            status_code=status.HTTP_502_BAD_GATEWAY,
                            detail=detail,
                        )

            unread = "UNREAD" in (payload.get("labelIds") or [])
            return MarkMailReadResponse(ok=True, id=message_id, unread=unread)
        except HTTPException as exc:
            print(f"Error in GmailMailService.mark_message_read: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailMailService.mark_message_read: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update message read state",
            ) from exc

    async def _fetch_list_items(
        self,
        client: aiohttp.ClientSession,
        headers: dict[str, str],
        messages: list[dict],
    ) -> list[MailListItem]:
        """Resolve message metadata for each listed Gmail message id."""
        try:
            results: list[MailListItem] = []
            for message in messages:
                message_id = message.get("id")
                if not message_id:
                    continue
                item = await self._fetch_single_list_item(client, headers, message_id)
                results.append(item)
            return results
        except Exception as exc:
            print(f"Error in GmailMailService._fetch_list_items: {exc}")
            raise

    async def _fetch_single_list_item(
        self,
        client: aiohttp.ClientSession,
        headers: dict[str, str],
        message_id: str,
    ) -> MailListItem:
        """Fetch metadata for one message id and map it to list item shape."""
        try:
            params = {
                "format": "metadata",
                "metadataHeaders": ["From", "Subject", "Date"],
                "fields": "id,snippet,labelIds,internalDate,payload/headers",
            }
            async with client.get(
                f"{GMAIL_API_BASE_URL}/users/me/messages/{message_id}",
                headers=headers,
                params=params,
            ) as response:
                payload = await response.json(content_type=None)
                if response.status >= 400:
                    detail = payload.get("error", {}).get(
                        "message", "Failed to fetch message summary"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=detail,
                    )

            headers_map = self._extract_header_map(payload.get("payload", {}).get("headers", []))
            return MailListItem(
                id=payload.get("id", message_id),
                sender=headers_map.get("from", "Unknown sender"),
                subject=headers_map.get("subject", "(no subject)"),
                snippet=payload.get("snippet", ""),
                dateLabel=self._format_date_label(payload.get("internalDate")),
                unread="UNREAD" in (payload.get("labelIds") or []),
            )
        except HTTPException as exc:
            print(f"Error in GmailMailService._fetch_single_list_item: {exc}")
            raise
        except Exception as exc:
            print(f"Error in GmailMailService._fetch_single_list_item: {exc}")
            raise

    def _extract_header_map(self, headers: list[dict]) -> dict[str, str]:
        """Convert Gmail header array into case-insensitive lookup map."""
        return {
            str(header.get("name", "")).lower(): str(header.get("value", "")) for header in headers
        }

    def _extract_plain_text_body(self, payload: dict) -> str:
        """Decode the first text/plain body part from a Gmail payload tree."""
        try:
            direct_body = payload.get("body", {}).get("data")
            if direct_body:
                decoded = self._decode_base64_urlsafe(direct_body)
                if decoded:
                    return decoded

            parts = payload.get("parts", []) or []
            for part in parts:
                mime_type = part.get("mimeType")
                if mime_type == "text/plain":
                    data = part.get("body", {}).get("data")
                    if data:
                        decoded = self._decode_base64_urlsafe(data)
                        if decoded:
                            return decoded

                nested_parts = part.get("parts", []) or []
                for nested in nested_parts:
                    if nested.get("mimeType") == "text/plain":
                        data = nested.get("body", {}).get("data")
                        if data:
                            decoded = self._decode_base64_urlsafe(data)
                            if decoded:
                                return decoded
            return ""
        except Exception as exc:
            print(f"Error in GmailMailService._extract_plain_text_body: {exc}")
            return ""

    def _decode_base64_urlsafe(self, value: str) -> str:
        """Decode urlsafe base64 Gmail body content into utf-8 text."""
        try:
            padding = "=" * (-len(value) % 4)
            decoded = base64.urlsafe_b64decode(value + padding)
            return decoded.decode("utf-8", errors="replace")
        except Exception as exc:
            print(f"Error in GmailMailService._decode_base64_urlsafe: {exc}")
            return ""

    def _format_date_label(self, internal_date: str | None) -> str:
        """Create compact date labels for list and detail rendering."""
        try:
            if not internal_date:
                return ""
            timestamp_ms = int(internal_date)
            mail_dt = datetime.fromtimestamp(timestamp_ms / 1000, tz=UTC).astimezone()
            now = datetime.now().astimezone()

            if mail_dt.date() == now.date():
                return mail_dt.strftime("%I:%M %p").lstrip("0")
            if mail_dt.date() == (now - timedelta(days=1)).date():
                return "Yesterday"
            if mail_dt.year == now.year:
                return mail_dt.strftime("%b %d")
            return mail_dt.strftime("%b %d, %Y")
        except Exception as exc:
            print(f"Error in GmailMailService._format_date_label: {exc}")
            return ""
