"""
Phase 3 — Authentication Tests
Covers all 11 scenarios specified in the Phase 3 requirements.
"""
import uuid
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def unique_email() -> str:
    """Return a fresh, collision-free email for each test."""
    return f"test_{uuid.uuid4().hex[:10]}@example.com"


def register(client: TestClient, name="Test User", email=None, password="ValidPass1"):
    email = email or unique_email()
    return client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    ), email


def login(client: TestClient, email: str, password="ValidPass1"):
    return client.post(
        "/api/auth/login",
        json={"username": email, "password": password},
    )


# ---------------------------------------------------------------------------
# 1. Successful registration
# ---------------------------------------------------------------------------
def test_successful_registration(client):
    email = unique_email()
    res = client.post(
        "/api/auth/register",
        json={"name": "Chehak", "email": email, "password": "SecurePassword123!"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == email
    assert data["name"] == "Chehak"
    assert "id" in data
    assert "created_at" in data
    # Must never return the password or its hash
    assert "password" not in data
    assert "password_hash" not in data


# ---------------------------------------------------------------------------
# 2. Duplicate registration
# ---------------------------------------------------------------------------
def test_duplicate_registration(client):
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "First", "email": email, "password": "ValidPass1"},
    )
    res = client.post(
        "/api/auth/register",
        json={"name": "Second", "email": email, "password": "ValidPass1"},
    )
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 3. Invalid email
# ---------------------------------------------------------------------------
def test_invalid_email_format(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "User", "email": "not-an-email", "password": "ValidPass1"},
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# 4. Weak password — missing uppercase
# ---------------------------------------------------------------------------
def test_weak_password_no_uppercase(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "User", "email": unique_email(), "password": "weakpass1"},
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# 4b. Weak password — too short
# ---------------------------------------------------------------------------
def test_weak_password_too_short(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "User", "email": unique_email(), "password": "Ab1"},
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# 4c. Weak password — no digit
# ---------------------------------------------------------------------------
def test_weak_password_no_digit(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "User", "email": unique_email(), "password": "NoDigitsHere"},
    )
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# 5. Successful login
# ---------------------------------------------------------------------------
def test_successful_login(client):
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Chehak", "email": email, "password": "SecurePassword123!"},
    )
    res = login(client, email, "SecurePassword123!")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 20


# ---------------------------------------------------------------------------
# 6. Incorrect password
# ---------------------------------------------------------------------------
def test_incorrect_password(client):
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "User", "email": email, "password": "ValidPass1"},
    )
    res = login(client, email, "WrongPass99!")
    assert res.status_code == 401
    # Generic message — must not hint that the email exists
    assert "incorrect" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 7. Nonexistent account
# ---------------------------------------------------------------------------
def test_nonexistent_account_login(client):
    res = login(client, "nobody_" + unique_email(), "ValidPass1")
    assert res.status_code == 401
    # Message must be identical to wrong-password response (no enumeration)
    assert "incorrect" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 8. Invalid token on protected route
# ---------------------------------------------------------------------------
def test_invalid_token(client):
    res = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer this.is.not.a.valid.jwt"},
    )
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# 9. Expired token
# ---------------------------------------------------------------------------
def test_expired_token(client):
    # Create a token that already expired 1 second ago
    expired_token = create_access_token(subject=9999, expires_delta=timedelta(seconds=-1))
    res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# 10. Access to a protected endpoint with a valid token
# ---------------------------------------------------------------------------
def test_protected_endpoint_with_valid_token(client):
    email = unique_email()
    client.post(
        "/api/auth/register",
        json={"name": "Chehak", "email": email, "password": "SecurePassword123!"},
    )
    token_res = login(client, email, "SecurePassword123!")
    token = token_res.json()["access_token"]

    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["email"] == email
    assert "password" not in data
    assert "password_hash" not in data


# ---------------------------------------------------------------------------
# 11. Missing authentication header
# ---------------------------------------------------------------------------
def test_missing_authentication(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
