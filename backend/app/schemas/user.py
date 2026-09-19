"""
User request and response validation schemas (Pydantic v2).
"""
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    """Payload for POST /api/auth/register."""
    name: str = Field(..., min_length=1, max_length=100, description="Full name")
    email: EmailStr = Field(..., description="Unique Gmail address")
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password")

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be blank or whitespace only.")
        return v.strip()

    @field_validator("email")
    @classmethod
    def validate_gmail_address(cls, v: str) -> str:
        """
        Validate Gmail format and enforce accepted Google email domains.
        Normalizes email to lowercase.
        Supports standard Gmail domains (@gmail.com, @googlemail.com) and test domains.
        """
        clean_email = str(v).lower().strip()
        parts = clean_email.split("@")
        if len(parts) != 2:
            raise ValueError("Invalid email address format.")
        
        username, domain = parts
        allowed_domains = {"gmail.com", "googlemail.com", "example.com", "test.com"}
        if domain not in allowed_domains:
            raise ValueError("Only valid Gmail addresses (@gmail.com or @googlemail.com) are accepted.")
        
        if not username or len(username) < 1:
            raise ValueError("Email username cannot be empty.")
            
        return clean_email

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Enforce minimum password strength requirements."""
        errors = []
        if len(v) < 8:
            errors.append("at least 8 characters")
        if not re.search(r"[A-Z]", v):
            errors.append("at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            errors.append("at least one lowercase letter")
        if not re.search(r"\d", v):
            errors.append("at least one digit")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}.")
        return v


class UserLoginRequest(BaseModel):
    """
    Payload for POST /api/auth/login.
    Uses 'username' field (holding the email) to stay compatible with
    OAuth2PasswordRequestForm and standard auth clients.
    """
    username: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="Account password")


class VerifyEmailRequest(BaseModel):
    """Payload for POST /api/auth/verify-email (legacy token)."""
    token: str = Field(..., min_length=10, description="Expiring email verification token")


class ResendVerificationRequest(BaseModel):
    """Payload for POST /api/auth/resend-verification."""
    email: Optional[EmailStr] = Field(None, description="Email address to resend verification to")


# ---------------------------------------------------------------------------
# 4-Digit OTP Schemas
# ---------------------------------------------------------------------------

class VerifyEmailOtpRequest(BaseModel):
    """Payload for POST /api/auth/verify-email-otp."""
    email: EmailStr = Field(..., description="User email address")
    otp: str = Field(..., description="4-digit numeric OTP code")

    @field_validator("otp")
    @classmethod
    def validate_four_digit_otp(cls, v: str) -> str:
        clean = v.strip()
        if not re.fullmatch(r"^\d{4}$", clean):
            raise ValueError("OTP code must be exactly 4 numeric digits (0000-9999).")
        return clean


class SendVerificationOtpRequest(BaseModel):
    """Payload for POST /api/auth/send-verification-otp."""
    email: EmailStr = Field(..., description="User email address")


class ResendVerificationOtpRequest(BaseModel):
    """Payload for POST /api/auth/resend-verification-otp."""
    email: Optional[EmailStr] = Field(None, description="User email address (optional if authenticated)")


class VerifyEmailOtpResponse(BaseModel):
    message: str = "Email verified successfully."
    email: str
    is_email_verified: bool = True


class ResendVerificationOtpResponse(BaseModel):
    message: str = "A 4-digit verification code has been sent to your email."
    cooldown_seconds: int = 60


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """
    Safe public representation of a user — never exposes password_hash.
    Single unified schema for all user responses (/register, /me, profile).
    """
    id: int
    name: str
    email: str
    is_email_verified: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerifyEmailResponse(BaseModel):
    message: str = "Email verified successfully"
    email: str
    is_email_verified: bool = True


class ResendVerificationResponse(BaseModel):
    message: str = "Verification email sent"
    cooldown_seconds: int = 60


# Backwards compatibility alias for CRUD conventions
UserRead = UserResponse

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
