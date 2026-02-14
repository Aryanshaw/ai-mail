from pydantic import BaseModel, Field

from app.mail.schemas import MailListItem


class AIContext(BaseModel):
    active_mailbox: str = Field(default="inbox", alias="activeMailbox")
    selected_mail_id: str | None = Field(default=None, alias="selectedMailId")
    current_filters: dict = Field(default_factory=dict, alias="currentFilters")
    timezone: str | None = None


class AIChatRequest(BaseModel):
    message: str
    model: str = "auto"
    context: AIContext


class AIUiAction(BaseModel):
    type: str
    payload: dict = Field(default_factory=dict)


class AITrace(BaseModel):
    provider_used: str = Field(alias="providerUsed")
    tools_called: list[str] = Field(default_factory=list, alias="toolsCalled")
    candidate_count: int = Field(default=0, alias="candidateCount")
    final_count: int = Field(default=0, alias="finalCount")


class AIChatResponse(BaseModel):
    assistant_message: str = Field(alias="assistantMessage")
    ui_actions: list[AIUiAction] = Field(default_factory=list, alias="uiActions")
    results: list[MailListItem] = Field(default_factory=list)
    trace: AITrace
