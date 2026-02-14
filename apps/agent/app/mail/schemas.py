from pydantic import BaseModel, Field


class MailListItem(BaseModel):
    id: str
    sender: str
    subject: str
    snippet: str
    date_label: str = Field(alias="dateLabel")
    unread: bool


class MailListResponse(BaseModel):
    items: list[MailListItem]
    next_page_token: str | None = Field(default=None, alias="nextPageToken")


class MailDetailResponse(BaseModel):
    id: str
    sender: str
    to: str | None = None
    subject: str
    snippet: str
    body: str
    html_body: str | None = Field(default=None, alias="htmlBody")
    date_label: str = Field(alias="dateLabel")
    unread: bool


class MarkMailReadResponse(BaseModel):
    ok: bool
    id: str
    unread: bool


class SendMailRequest(BaseModel):
    to: str
    cc: str | None = None
    subject: str
    body: str


class SendMailResponse(BaseModel):
    ok: bool
    id: str
