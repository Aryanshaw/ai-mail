import json
import os
import re
from typing import Any

from fastapi import HTTPException, status
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from app.ai.config import AISettings, load_ai_settings
from app.ai.prompts import SEARCH_AGENT_SYSTEM_PROMPT_XML
from app.ai.schemas import AIChatResponse, AITrace, AIUiAction
from app.ai.tools import SearchToolFactory
from app.mail.service import GmailMailService


class SearchAgent:
    """LangChain-based search orchestrator for chat-driven mail filtering and UI actions."""

    def __init__(self):
        self.settings: AISettings = load_ai_settings()
        self.mail_service = GmailMailService()

    async def search(
        self,
        user_id: str,
        message: str,
        context: dict[str, Any],
        memory_messages: list[dict[str, str]] | None = None,
        model_selector: str = "auto",
    ) -> AIChatResponse:
        """Run SearchAgent with tools and return source-bound UI actions/results."""
        try:
            primary_provider = self._resolve_primary_provider(model_selector)
            response = await self._invoke_with_provider(
                provider=primary_provider,
                user_id=user_id,
                message=message,
                context=context,
                memory_messages=memory_messages,
            )
            return response
        except Exception as exc:
            print(f"Error in SearchAgent.search.primary: {exc}")
            if model_selector == "groq":
                raise

            fallback_provider = "groq"
            try:
                return await self._invoke_with_provider(
                    provider=fallback_provider,
                    user_id=user_id,
                    message=message,
                    context=context,
                    memory_messages=memory_messages,
                )
            except Exception as fallback_exc:
                print(f"Error in SearchAgent.search.fallback: {fallback_exc}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="AI search failed",
                ) from fallback_exc

    def _resolve_primary_provider(self, model_selector: str) -> str:
        """Resolve which provider should be used first for agent execution."""
        if model_selector == "groq":
            return "groq"
        if model_selector == "gemini":
            return "gemini"
        if self.settings.default_model_selector == "groq":
            return "groq"
        return "gemini"

    async def _invoke_with_provider(
        self,
        provider: str,
        user_id: str,
        message: str,
        context: dict[str, Any],
        memory_messages: list[dict[str, str]] | None = None,
    ) -> AIChatResponse:
        """Invoke a provider-specific tool-calling agent and normalize output payload."""
        try:
            tool_state: dict[str, Any] = {
                "candidate_map": {},
                "ordered_candidate_ids": [],
                "tools_called": [],
                "queries_used": [],
            }
            tools = SearchToolFactory(
                user_id=user_id,
                mail_service=self.mail_service,
                settings=self.settings,
                tool_state=tool_state,
            ).create_tools()

            llm = self._build_llm(provider)
            agent = create_agent(
                model=llm,
                tools=tools,
                system_prompt=SEARCH_AGENT_SYSTEM_PROMPT_XML,
            )
            agent_result = await agent.ainvoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": (
                                f"User query: {message}\n"
                                f"Conversation history JSON: {json.dumps(memory_messages or [])}\n"
                                f"Context JSON: {json.dumps(context)}\n"
                                "If user asks semantic topic (e.g. rejection mails), craft Gmail "
                                "queries with relevant keywords and retrieve candidates."
                            ),
                        }
                    ]
                }
            )
            raw_output_text = self._extract_agent_text_output(agent_result)
            parsed_output = self._parse_output_json(raw_output_text)
            return self._build_response(provider, parsed_output, tool_state)
        except HTTPException as exc:
            print(f"Error in SearchAgent._invoke_with_provider: {exc}")
            raise
        except Exception as exc:
            print(f"Error in SearchAgent._invoke_with_provider: {exc}")
            raise

    def _build_llm(self, provider: str):
        """Instantiate provider client with centralized model configuration."""
        try:
            if provider == "groq":
                api_key = os.getenv("GROQ_API_KEY")
                if not api_key:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Missing GROQ_API_KEY",
                    )
                return ChatGroq(
                    model=self.settings.groq_model,
                    api_key=api_key,
                    temperature=self.settings.temperature,
                    max_tokens=self.settings.max_tokens,
                )

            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Missing GEMINI_API_KEY",
                )
            return ChatGoogleGenerativeAI(
                model=self.settings.gemini_model,
                google_api_key=api_key,
                temperature=self.settings.temperature,
                max_output_tokens=self.settings.max_tokens,
            )
        except HTTPException as exc:
            print(f"Error in SearchAgent._build_llm: {exc}")
            raise
        except Exception as exc:
            print(f"Error in SearchAgent._build_llm: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to initialize LLM client",
            ) from exc

    def _extract_agent_text_output(self, agent_result: dict[str, Any]) -> str:
        """Extract final textual model response from LangChain v1 agent output state."""
        try:
            if isinstance(agent_result, dict):
                output_value = agent_result.get("output")
                normalized_output = self._normalize_content_to_text(output_value)
                if normalized_output:
                    return normalized_output

            messages = agent_result.get("messages", []) if isinstance(agent_result, dict) else []
            for message in reversed(messages):
                content = getattr(message, "content", None)
                normalized_content = self._normalize_content_to_text(content)
                if normalized_content:
                    return normalized_content

                if isinstance(message, dict):
                    raw_content = message.get("content")
                    normalized_raw_content = self._normalize_content_to_text(raw_content)
                    if normalized_raw_content:
                        return normalized_raw_content
            return ""
        except Exception as exc:
            print(f"Error in SearchAgent._extract_agent_text_output: {exc}")
            return ""

    def _normalize_content_to_text(self, content: Any) -> str:
        """Normalize provider output content blocks into plain text for JSON parsing."""
        try:
            if isinstance(content, str):
                return content.strip()

            if isinstance(content, list):
                collected_text: list[str] = []
                for block in content:
                    if isinstance(block, str):
                        stripped_block = block.strip()
                        if stripped_block:
                            collected_text.append(stripped_block)
                        continue
                    if isinstance(block, dict):
                        text_value = block.get("text")
                        if isinstance(text_value, str) and text_value.strip():
                            collected_text.append(text_value.strip())
                return "\n".join(collected_text).strip()

            if isinstance(content, dict):
                text_value = content.get("text")
                if isinstance(text_value, str):
                    return text_value.strip()
            return ""
        except Exception as exc:
            print(f"Error in SearchAgent._normalize_content_to_text: {exc}")
            return ""

    def _parse_output_json(self, output_text: str) -> dict[str, Any]:
        """Parse agent output into JSON payload and fallback safely on malformed output."""
        try:
            cleaned_output = output_text.strip()
            if not cleaned_output:
                return {
                    "assistant_message": (
                        "Hi! I can help search and filter your mailbox. Tell me what to look for."
                    ),
                    "ui_actions": [
                        {
                            "type": "CLEAR_AI_RESULTS",
                            "payload": {},
                        }
                    ],
                    "result_ids": [],
                }
            cleaned_output = cleaned_output.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_output)
            if not isinstance(parsed, dict):
                raise ValueError("Agent output is not a JSON object")
            return parsed
        except Exception as exc:
            print(f"Error in SearchAgent._parse_output_json: {exc}")
            try:
                # Fallback parse: extract the first JSON object-like block from mixed text.
                json_block_match = re.search(r"\{.*\}", output_text, re.DOTALL)
                if json_block_match:
                    parsed = json.loads(json_block_match.group(0))
                    if isinstance(parsed, dict):
                        return parsed
            except Exception as nested_exc:
                print(f"Error in SearchAgent._parse_output_json.regex_fallback: {nested_exc}")

            return {
                "assistant_message": (
                    "I can help search and filter your mailbox. Tell me what to look for."
                ),
                "ui_actions": [
                    {
                        "type": "CLEAR_AI_RESULTS",
                        "payload": {},
                    }
                ],
                "result_ids": [],
            }

    def _build_response(
        self,
        provider: str,
        parsed_output: dict[str, Any],
        tool_state: dict[str, Any],
    ) -> AIChatResponse:
        """Normalize parsed output into source-bound chat response with typed UI actions."""
        try:
            candidate_map = tool_state.get("candidate_map", {})
            ordered_candidate_ids = tool_state.get("ordered_candidate_ids", [])

            result_ids = parsed_output.get("result_ids") or []
            if not isinstance(result_ids, list):
                result_ids = []

            valid_result_ids = [result_id for result_id in result_ids if result_id in candidate_map]
            if not valid_result_ids:
                valid_result_ids = ordered_candidate_ids[: min(len(ordered_candidate_ids), 15)]

            results = [
                candidate_map[result_id]
                for result_id in valid_result_ids
                if result_id in candidate_map
            ]

            raw_actions = parsed_output.get("ui_actions") or []
            normalized_actions: list[AIUiAction] = []
            if isinstance(raw_actions, list):
                for raw_action in raw_actions:
                    if not isinstance(raw_action, dict):
                        continue
                    action_type = str(raw_action.get("type", "")).strip()
                    payload = raw_action.get("payload")
                    if not action_type:
                        continue
                    normalized_actions.append(
                        AIUiAction(
                            type=action_type,
                            payload=payload if isinstance(payload, dict) else {},
                        )
                    )

            has_show_search_results = any(
                action.type == "SHOW_SEARCH_RESULTS" for action in normalized_actions
            )
            if not has_show_search_results and valid_result_ids:
                normalized_actions.append(
                    AIUiAction(
                        type="SHOW_SEARCH_RESULTS",
                        payload={
                            "result_ids": valid_result_ids,
                        },
                    )
                )
            if not normalized_actions and not valid_result_ids:
                normalized_actions.append(AIUiAction(type="CLEAR_AI_RESULTS", payload={}))

            assistant_message_raw = parsed_output.get("assistant_message")
            if isinstance(assistant_message_raw, str) and assistant_message_raw.strip():
                assistant_message = assistant_message_raw.strip()
            elif results:
                assistant_message = "Here are the closest emails matching your request."
            else:
                assistant_message = (
                    "Hi! I can help search and filter your mailbox. Tell me what to look for."
                )

            return AIChatResponse(
                assistantMessage=assistant_message,
                uiActions=normalized_actions,
                results=results,
                trace=AITrace(
                    providerUsed=provider,
                    toolsCalled=tool_state.get("tools_called", []),
                    candidateCount=len(candidate_map),
                    finalCount=len(results),
                ),
            )
        except Exception as exc:
            print(f"Error in SearchAgent._build_response: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to build AI response",
            ) from exc
