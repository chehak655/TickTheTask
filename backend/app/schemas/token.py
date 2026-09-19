from pydantic import BaseModel


class TokenResponse(BaseModel):
    """Response body for a successful login."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT payload claims."""
    sub: str | None = None
