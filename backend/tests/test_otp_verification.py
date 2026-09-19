"""
TaskFlow — 4-Digit OTP Email Verification Tests
Tests OTP generation, hashing, 10-minute expiry, single-use, 5-attempt brute force lockout,
resend cooldown, email delivery format, and API endpoints.
"""
import uuid
import re
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import generate_otp, get_user_by_email
from app.core.security import hash_password, verify_password


def unique_email() -> str:
    return "otp_test_" + uuid.uuid4().hex[:8] + "@gmail.com"


def test_otp_generation_format():
    """OTP must be exactly 4 numeric digits with leading zeros preserved."""
    for _ in range(100):
        otp = generate_otp()
        assert len(otp) == 4
        assert otp.isdigit()
        assert 0 <= int(otp) <= 9999



def test_registration_creates_hashed_otp(client: TestClient, db: Session):
    """Registration stores only hashed OTP in DB and never plaintext."""
    email = unique_email()
    res = client.post(
        "/api/auth/register",
        json={"name": "OTP User", "email": email, "password": "SecurePass123!"},
    )
    assert res.status_code == 201
    user = get_user_by_email(db, email)
    assert user is not None
    assert user.is_email_verified is False
    assert user.verification_otp_hash is not None
    assert len(user.verification_otp_hash) > 20  # bcrypt hash
    assert user.verification_otp_expires_at is not None
    assert user.verification_otp_attempts == 0


def test_successful_otp_verification(client: TestClient, db: Session):
    """Valid OTP verifies the email and clears the OTP fields."""
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "OTP User 2", "email": email, "password": "SecurePass123!"},
    )
    user = get_user_by_email(db, email)
    known_otp = "0427"
    user.verification_otp_hash = hash_password(known_otp)
    user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    res = client.post(
        "/api/auth/verify-email-otp",
        json={"email": email, "otp": known_otp},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_email_verified"] is True

    db.refresh(user)
    assert user.is_email_verified is True
    assert user.verification_otp_hash is None
    assert user.verification_otp_expires_at is None
    assert user.verification_otp_attempts == 0



def test_otp_single_use(client: TestClient, db: Session):
    """OTP cannot be used more than once."""
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Single Use User", "email": email, "password": "SecurePass123!"},
    )
    user = get_user_by_email(db, email)
    known_otp = "8831"
    user.verification_otp_hash = hash_password(known_otp)
    user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    res1 = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": known_otp})
    assert res1.status_code == 200

    res2 = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": known_otp})
    assert res2.status_code == 200
    assert "already verified" in res2.json()["message"].lower()


def test_wrong_otp_increments_attempts(client: TestClient, db: Session):
    """Incorrect OTP increments attempt count and reports attempts remaining."""
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Attempt User", "email": email, "password": "SecurePass123!"},
    )
    user = get_user_by_email(db, email)
    user.verification_otp_hash = hash_password("1234")
    user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    user.verification_otp_attempts = 0
    db.commit()

    res = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": "9999"})
    assert res.status_code == 400
    assert "4 attempt(s) remaining" in res.json()["detail"]

    db.refresh(user)
    assert user.verification_otp_attempts == 1



def test_five_failed_attempts_lockout(client: TestClient, db: Session):
    """5 consecutive invalid OTP attempts invalidate the OTP code."""
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Lockout User", "email": email, "password": "SecurePass123!"},
    )
    user = get_user_by_email(db, email)
    user.verification_otp_hash = hash_password("1234")
    user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    user.verification_otp_attempts = 4
    db.commit()

    res = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": "0000"})
    assert res.status_code == 400
    assert "Maximum attempts exceeded" in res.json()["detail"]

    db.refresh(user)
    assert user.verification_otp_hash is None
    assert user.is_email_verified is False



def test_expired_otp_rejection(client: TestClient, db: Session):
    """Expired OTp (>10 min) is rejected."""
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Expired User", "email": email, "password": "SecurePass123!"},
    )
    user = get_user_by_email(db, email)
    user.verification_otp_hash = hash_password("5555")
    user.verification_otp_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()

    res = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": "5555"})
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()


def test_resend_otp_cooldown(client: TestClient, db: Session):
    """Resending OTP enforces 60s cooldown."""
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Resend User", "email": email, "password": "SecurePass123!"},
    )

    res1 = client.post("/api/auth/resend-verification-otp", json={"email": email})
    assert res1.status_code == 429
    assert "wait" in res1.json()["detail"].lower()

    user = get_user_by_email(db, email)
    user.verification_otp_last_sent_at = datetime.now(timezone.utc) - timedelta(seconds=65)
    db.commit()

    res2 = client.post("/api/auth/resend-verification-otp", json={"email": email})
    assert res2.status_code == 200
    assert res2.json()["cooldown_seconds"] == 60


def test_otp_payload_validation(client: TestClient):
    """Non 4-digit strings are rejected with 422."""
    res_short = client.post("/api/auth/verify-email-otp", json={"email": "test@gmail.com", "otp": "12"})
    assert res_short.status_code == 422

    res_long = client.post("/api/auth/verify-email-otp", json={"email": "test@gmail.com", "otp": "12345"})
    assert res_long.status_code == 422

    res_alpha = client.post("/api/auth/verify-email-otp", json={"email": "test@gmail.com", "otp": "abcd"})
    assert res_alpha.status_code == 422
