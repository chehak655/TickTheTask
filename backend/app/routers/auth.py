from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
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
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
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
# POST /api/auth/verify-email-otp (4-Digit OTP)
# ---------------------------------------------------------------------------
@router.post(
    "/verify-email-otp",
    response_model=VerifyEmailOtpResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify user email address using 4-digit numeric OTP",
)
def verify_email_otp(payload: VerifyEmailOtpRequest, db: Session = Depends(get_db)):
    """
    Validate the 4-digit numeric OTP code.
    Enforces single-use, 10-minute expiry, and a maximum of 5 attempts.
    """
    success, message, user = verify_user_email_otp(db, email=payload.email, otp=payload.otp)
    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return VerifyEmailOtpResponse(
        message=message,
        email=user.email,
        is_email_verified=user.is_email_verified,
    )


# ---------------------------------------------------------------------------
# POST /api/auth/send-verification-otp / resend-verification-otp
# ---------------------------------------------------------------------------
@router.post(
    "/send-verification-otp",
    response_model=ResendVerificationOtpResponse,
    status_code=status.HTTP_200_OK,
    summary="Send a 4-digit verification code to the given email",
)
@router.post(
    "/resend-verification-otp",
    response_model=ResendVerificationOtpResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend a 4-digit verification code with 60-second cooldown rate-limiting",
)
def resend_verification_otp(
    payload: Optional[ResendVerificationOtpRequest] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Dispatch a fresh 4-digit OTP to the authenticated user or specified registered email.
    Enforces a 60-second rate-limiting cooldown.
    """
    target_user = current_user
    if not target_user and payload and payload.email:
        target_user = get_user_by_email(db, payload.email)

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    success, message, cooldown = send_user_verification_otp(db, target_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS if cooldown > 0 else status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return ResendVerificationOtpResponse(
        message=message,
        cooldown_seconds=cooldown,
    )


# ---------------------------------------------------------------------------
# POST /api/auth/verify-email (Legacy token compatibility)
# ---------------------------------------------------------------------------
@router.post(
    "/verify-email",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify user email address using legacy single-use token",
)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Validate legacy single-use expiring token.
    On success, marks is_email_verified = True and invalidates the token.
    """
    success, message, user = verify_user_email(db, payload.token)
    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return VerifyEmailResponse(
        message=message,
        email=user.email,
        is_email_verified=user.is_email_verified,
    )


# ---------------------------------------------------------------------------
# POST /api/auth/resend-verification (Legacy compatibility)
# ---------------------------------------------------------------------------
@router.post(
    "/resend-verification",
    response_model=ResendVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend verification email with rate-limiting (Legacy compatibility)",
)
def resend_verification(
    payload: Optional[ResendVerificationRequest] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Resend verification to authenticated user or specified registered email.
    Enforces a 60-second cooldown rate limit.
    """
    target_user = current_user
    if not target_user and payload and payload.email:
        target_user = get_user_by_email(db, payload.email)

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
        )

    success, message, cooldown = resend_verification_email(db, target_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS if cooldown > 0 else status.HTTP_400_BAD_REQUEST,
            detail=message,
        )
    return ResendVerificationResponse(
        message=message,
        cooldown_seconds=cooldown,
    )
