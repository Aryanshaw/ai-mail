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
    ):
        self.user_id = user_id
        self.mail_service = mail_service
        self.settings = settings
        self.tool_state = tool_state

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

        return [search_mail_candidates]
