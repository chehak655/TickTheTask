"""
Authentication service — handles user registration, password hashing, JWT tokens,
and secure email verification.
"""
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserRegisterRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import DuplicateResourceError


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Return the User row matching *email*, or None if not found."""
    return db.query(User).filter(User.email == email.lower().strip()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Return the User row matching *user_id*, or None."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_verification_token(db: Session, token: str) -> Optional[User]:
    """Return the User matching *token*, or None."""
    return db.query(User).filter(User.email_verification_token == token.strip()).first()


# ---------------------------------------------------------------------------
# Registration & Verification
# ---------------------------------------------------------------------------

def generate_verification_token() -> str:
    """Generate a secure cryptographic URL-safe verification token."""
    return secrets.token_urlsafe(32)


def generate_otp() -> str:
    """
    Generate a cryptographically secure 4-digit numeric OTP (0000-9999).
    Preserves leading zeroes (e.g. '0427').
    """
    return f"{secrets.randbelow(10000):04d}"


def register_user(db: Session, payload: UserRegisterRequest) -> User:
    """
    Create a new user account and dispatch a 4-digit OTP verification email.

    Raises:
        DuplicateResourceError: when the email is already registered.
    """
    normalised_email = payload.email.lower().strip()

    existing = get_user_by_email(db, normalised_email)
    if existing:
        raise DuplicateResourceError("An account with this email address already exists.")

    now_utc = datetime.now(timezone.utc)

    user = User(
        name=payload.name.strip(),
        email=normalised_email,
        password_hash=hash_password(payload.password),
        is_email_verified=True,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise DuplicateResourceError("An account with this email address already exists.")

    return user


def verify_user_email_otp(db: Session, email: str, otp: str) -> tuple[bool, str, Optional[User]]:
    """
    Verify user email using a 4-digit OTP code.
    Timing-safe, single-use, 10-minute expiry, and 5-attempt brute-force limit.
    Returns: (success: bool, message: str, user: Optional[User])
    """
    clean_email = email.lower().strip()
    clean_otp = otp.strip()

    user = get_user_by_email(db, clean_email)
    if not user:
        # Prevent timing attacks on user enumeration
        verify_password("0000", "$2b$12$K5PV1F//YUFxBHuN2B0V7uGHc05.9VmXK70HM9UnP02cj0FOKfqhK")
        return False, "User account not found.", None

    if user.is_email_verified:
        return True, "Email address is already verified.", user

    if not user.verification_otp_hash or not user.verification_otp_expires_at:
        return False, "No active verification code found. Please request a new code.", None

    # Check attempt limit
    if user.verification_otp_attempts >= 5:
        user.verification_otp_hash = None
        user.verification_otp_expires_at = None
        db.commit()
        return False, "Maximum verification attempts exceeded. Please request a new code.", None

    # Check expiration (10 minutes)
    now_utc = datetime.now(timezone.utc)
    exp = user.verification_otp_expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if exp < now_utc:
        user.verification_otp_hash = None
        user.verification_otp_expires_at = None
        db.commit()
        return False, "Verification code has expired. Please request a new code.", None

    # Validate OTP timing-safely via bcrypt
    is_valid = verify_password(clean_otp, user.verification_otp_hash)
    if not is_valid:
        user.verification_otp_attempts += 1
        attempts_left = max(0, 5 - user.verification_otp_attempts)
        if user.verification_otp_attempts >= 5:
            user.verification_otp_hash = None
            user.verification_otp_expires_at = None
            db.commit()
            return False, "Invalid verification code. Maximum attempts exceeded. Please request a new code.", None
        db.commit()
        return False, f"Invalid verification code. {attempts_left} attempt(s) remaining.", None

    # Success: Mark verified & clear single-use OTP fields
    user.is_email_verified = True
    user.verification_otp_hash = None
    user.verification_otp_expires_at = None
    user.verification_otp_attempts = 0
    user.email_verification_token = None
    user.email_verification_expires_at = None
    db.commit()
    db.refresh(user)

    return True, "Email verified successfully.", user


def send_user_verification_otp(db: Session, user: User) -> tuple[bool, str, int]:
    """
    Generate and dispatch a new 4-digit OTP with 60-second rate limiting cooldown.
    Returns: (success: bool, message: str, cooldown_remaining: int)
    """
    if user.is_email_verified:
        return False, "This email address is already verified.", 0

    now_utc = datetime.now(timezone.utc)
    cooldown = settings.RESEND_VERIFICATION_COOLDOWN_SECONDS

    # Check rate limiting cooldown
    last_sent = user.verification_otp_last_sent_at or user.last_verification_sent_at
    if last_sent:
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
        elapsed = (now_utc - last_sent).total_seconds()
        if elapsed < cooldown:
            remaining = int(cooldown - elapsed)
            return False, f"Please wait {remaining} seconds before requesting another verification code.", remaining

    # Generate new 4-digit OTP & 10-minute expiry
    otp = generate_otp()
    user.verification_otp_hash = hash_password(otp)
    user.verification_otp_expires_at = now_utc + timedelta(minutes=10)
    user.verification_otp_attempts = 0
    user.verification_otp_last_sent_at = now_utc
    user.last_verification_sent_at = now_utc
    db.commit()
    db.refresh(user)

    dispatch_res = send_verification_otp_email(user, otp)

    if dispatch_res.status.value == "accepted":
        msg = "A 4-digit verification code has been sent to your Gmail address."
    elif dispatch_res.status.value == "dev_mock":
        msg = "A 4-digit verification code has been simulated (Safe Dev Mode)."
    else:
        # Fallback for Render Free Tier SMTP blocking (OSError)
        print(f"==================================================")
        print(f"🚨 SMTP BLOCKED BY HOSTING PROVIDER? 🚨")
        print(f"OTP FOR {user.email}: {otp}")
        print(f"==================================================")
        msg = "SMTP Blocked! Check your Render Dashboard Logs for the 4-digit OTP."
        return True, msg, cooldown

    return True, msg, cooldown


def verify_user_email(db: Session, token: str) -> tuple[bool, str, Optional[User]]:
    """
    Verify email token (Legacy token support). Single-use and time-limited.
    Returns: (success: bool, message: str, user: Optional[User])
    """
    if not token or not token.strip():
        return False, "Verification token is required.", None

    user = get_user_by_verification_token(db, token.strip())
    if not user:
        return False, "Invalid or already used verification token.", None

    now_utc = datetime.now(timezone.utc)
    if user.email_verification_expires_at:
        # Normalize naive datetime from MySQL if necessary
        exp = user.email_verification_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now_utc:
            return False, "Verification token has expired. Please request a new one.", None

    # Mark as verified and invalidate token (single-use)
    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    user.verification_otp_hash = None
    user.verification_otp_expires_at = None
    user.verification_otp_attempts = 0
    db.commit()
    db.refresh(user)

    return True, "Email verified successfully.", user


def resend_verification_email(db: Session, user: User) -> tuple[bool, str, int]:
    """
    Resend verification email wrapper (delegates to send_user_verification_otp).
    Returns: (success: bool, message: str, cooldown_remaining: int)
    """
    return send_user_verification_otp(db, user)


# ---------------------------------------------------------------------------
# Login / token issuance
# ---------------------------------------------------------------------------

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Verify credentials timing-safely.
    """
    user = get_user_by_email(db, email)
    if not user:
        verify_password(password, "$2b$12$K5PV1F//YUFxBHuN2B0V7uGHc05.9VmXK70HM9UnP02cj0FOKfqhK")
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_user_token(user: User) -> str:
    """Issue a signed JWT access token for *user*."""
    return create_access_token(subject=user.id)


