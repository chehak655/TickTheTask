from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

from app.core.config import settings
from app.core.dependencies import get_optional_current_user
from app.models.user import User
from app.services import email_service
from app.services.email_service import EmailDispatchStatus

router = APIRouter(prefix="/api/email", tags=["Email Diagnostics"])


class EmailTestRequest(BaseModel):
    to_email: EmailStr


class EmailTestResponse(BaseModel):
    status: str
    message: str
    recipient: str
    detail: Optional[str] = None
    diagnostics: dict
    timestamp: datetime


@router.post(
    "/test",
    response_model=EmailTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a diagnostic test email via SMTP (Development / Diagnostic Only)",
)
def test_email_dispatch(
    payload: EmailTestRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Diagnostic endpoint to test SMTP connectivity and send a real test email to the specified address.
    Never reveals SMTP passwords or raw tokens.
    """
    is_prod = settings.ENVIRONMENT.lower() in ("production", "prod")
    if is_prod and not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to run email diagnostic tests in production.",
        )

    result = email_service.send_diagnostic_test_email(payload.to_email)
    diagnostics = settings.get_safe_smtp_diagnostics()

    if result.status == EmailDispatchStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "status": result.status.value,
                "message": result.message,
                "detail": result.detail,
                "diagnostics": diagnostics,
            },
        )

    return EmailTestResponse(
        status=result.status.value,
        message=result.message,
        recipient=result.recipient,
        detail=result.detail,
        diagnostics=diagnostics,
        timestamp=result.timestamp,
    )
