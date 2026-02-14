import os
from dataclasses import dataclass


@dataclass(frozen=True)
class SearchToolConfig:
    """Centralized tool naming and limits for SearchAgent orchestration."""

    search_tool_name: str = "search_mail_candidates"
    top_k_default: int = 30
    top_k_max: int = 50


@dataclass(frozen=True)
class AISettings:
    """Single source of truth for LLM provider, model, and search agent behavior."""

    gemini_model: str
    groq_model: str
    temperature: float
    max_tokens: int
    strict_source_bound: bool
    query_variant_limit: int
    tool_config: SearchToolConfig



def load_ai_settings() -> AISettings:
    """Load AI settings from environment variables with safe defaults."""
    return AISettings(
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        groq_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        temperature=float(os.getenv("AI_TEMPERATURE", "0.1")),
        max_tokens=int(os.getenv("AI_MAX_TOKENS", "1200")),
        strict_source_bound=os.getenv("AI_STRICT_SOURCE_BOUND", "true").lower() == "true",
        query_variant_limit=int(os.getenv("AI_QUERY_VARIANT_LIMIT", "3")),
        tool_config=SearchToolConfig(),
    )
