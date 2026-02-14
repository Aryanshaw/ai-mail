from langchain_core.tools import tool

from app.ai.config import AISettings
from app.mail.service import GmailMailService


class SearchToolFactory:
    """Build SearchAgent tools with user-scoped Gmail access and shared execution state."""

    def __init__(
        self,
        user_id: str,
        mail_service: GmailMailService,
        settings: AISettings,
        tool_state: dict,
        default_mailbox: str,
        selected_mail_id: str | None,
    ):
        self.user_id = user_id
        self.mail_service = mail_service
        self.settings = settings
        self.tool_state = tool_state
        self.default_mailbox = default_mailbox
        self.selected_mail_id = selected_mail_id

    def create_tools(self) -> list:
        """Create LangChain tools used by SearchAgent for candidate retrieval."""

        @tool(self.settings.tool_config.search_tool_name)
        async def search_mail_candidates(
            query: str,
            mailbox: str = "inbox",
            top_k: int = 30,
        ) -> dict:
            """Search Gmail for candidates using Gmail query syntax and return concise items."""
            try:
                self.tool_state.setdefault("tools_called", []).append(
                    self.settings.tool_config.search_tool_name
                )
                bounded_top_k = max(1, min(top_k, self.settings.tool_config.top_k_max))
                normalized_mailbox = "sent" if mailbox == "sent" else "inbox"

                search_result = await self.mail_service.search_messages(
                    user_id=self.user_id,
                    mailbox=normalized_mailbox,
                    query=query,
                    page_size=bounded_top_k,
                )

                candidate_map = self.tool_state.setdefault("candidate_map", {})
                ordered_candidate_ids = self.tool_state.setdefault("ordered_candidate_ids", [])

                items_payload: list[dict] = []
                for item in search_result.items:
                    candidate_map[item.id] = item
                    if item.id not in ordered_candidate_ids:
                        ordered_candidate_ids.append(item.id)
                    items_payload.append(
                        {
                            "id": item.id,
                            "sender": item.sender,
                            "subject": item.subject,
                            "snippet": item.snippet,
                            "dateLabel": item.date_label,
                            "unread": item.unread,
                        }
                    )

                self.tool_state.setdefault("queries_used", []).append(query)
                return {
                    "mailbox": normalized_mailbox,
                    "query": query,
                    "count": len(items_payload),
                    "items": items_payload,
                }
            except Exception as exc:
                print(f"Error in search_mail_candidates: {exc}")
                raise

        @tool("get_selected_email_detail")
        async def get_selected_email_detail(
            selected_mail_id: str = "",
            mailbox: str = "inbox",
        ) -> dict:
            """Fetch currently open email detail and return AI-readable summarization content."""
            try:
                self.tool_state.setdefault("tools_called", []).append("get_selected_email_detail")
                resolved_mail_id = selected_mail_id.strip() or (self.selected_mail_id or "")
                if not resolved_mail_id:
                    return {
                        "ok": False,
                        "reason": "No selected email id found in context",
                    }

                resolved_mailbox = mailbox.strip() or self.default_mailbox
                normalized_mailbox = "sent" if resolved_mailbox == "sent" else "inbox"
                detail = await self.mail_service.get_message_detail(self.user_id, resolved_mail_id)
                content_text = self.mail_service.extract_ai_readable_content(detail)

                payload = {
                    "ok": True,
                    "mailbox": normalized_mailbox,
                    "id": detail.id,
                    "sender": detail.sender,
                    "to": detail.to,
                    "subject": detail.subject,
                    "snippet": detail.snippet,
                    "dateLabel": detail.date_label,
                    "content_text": content_text,
                }
                self.tool_state["selected_mail_detail"] = payload
                return payload
            except Exception as exc:
                print(f"Error in get_selected_email_detail: {exc}")
                raise

        return [search_mail_candidates, get_selected_email_detail]
