from datetime import datetime

from pydantic import BaseModel


class GoogleStartResponse(BaseModel):
    authorization_url: str
    state: str
    code_verifier: str


class GoogleCallbackRequest(BaseModel):
    code: str
    state: str
    expected_state: str
    code_verifier: str
    user_agent: str | None = None
    ip_address: str | None = None


class AuthUserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    country_code: str | None
    avatar: str | None
    created_at: datetime
    updated_at: datetime


class GoogleCallbackResponse(BaseModel):
    session_token: str
    expires_at: datetime
    user: AuthUserResponse
