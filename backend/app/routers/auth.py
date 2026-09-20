from typing import Optional
from fastapi import APIRouter, Request,
from app.core.rate_limit import limiter
 Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    VerifyEmailOtpRequest,
    VerifyEmailOtpResponse,
    SendVerificationOtpRequest,
    ResendVerificationOtpRequest,
    ResendVerificationOtpResponse,
)
from app.schemas.token import TokenResponse
from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_user_token,
    verify_user_email,
    resend_verification_email,
    get_user_by_email,
    verify_user_email_otp,
    send_user_verification_otp,
)
from app.core.dependencies import get_current_user, get_optional_current_user
from app.core.exceptions import DuplicateResourceError
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# POST /api/auth/register
# ---------------------------------------------------------------------------
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
@limiter.limit('5/minute')
def register(request: Request, payload: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new user account with Gmail address validation.
    Generates a secure 4-digit OTP and dispatches a verification email.
    """
    try:
        user = register_user(db, payload)
    except DuplicateResourceError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=exc.message,
        )
    return user


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and receive a JWT access token",
)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user by email + password.
    Returns a signed JWT access token on success.
    """
    user = authenticate_user(db, email=payload.username, password=payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenResponse(access_token=create_user_token(user))


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve the currently authenticated user",
)
def me(current_user: User = Depends(get_current_user)):
    """
    Protected endpoint — returns the authenticated user's profile and verification status.
    """
    return current_user


# ---------------------------------------------------------------------------
