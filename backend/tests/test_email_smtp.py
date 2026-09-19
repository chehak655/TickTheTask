"""
Unit and integration tests for Gmail SMTP delivery, Safe Dev Mode, error handling,
security protections, and diagnostic endpoints.
"""
import pytest
import socket
import smtplib
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import settings
from app.services.email_service import (
    send_email,
    send_verification_email,
    send_task_reminder_email,
    send_diagnostic_test_email,
    EmailDispatchStatus,
    EmailDispatchResult,
)
from app.models.user import User
from app.models.task import Task


@pytest.fixture
def client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# 1. Successful SMTP Dispatch with STARTTLS
# ---------------------------------------------------------------------------

def test_smtp_successful_dispatch():
    with patch.object(settings, "EMAIL_ENABLED", True), \
         patch.object(settings, "SMTP_USERNAME", "chehak655@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", "mockapppassword123"), \
         patch("smtplib.SMTP") as mock_smtp_class:
        
        mock_server = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_server

        result = send_email(
            to_email="chehak655@gmail.com",
            subject="Test Subject",
            html_body="<p>Test HTML</p>",
            text_body="Test Plaintext",
        )

        assert result.status == EmailDispatchStatus.ACCEPTED
        assert result.is_success is True
        assert "accepted" in result.message.lower()

        # Verify SMTP handshake sequence
        mock_smtp_class.assert_called_once_with(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT_SECONDS)
        assert mock_server.ehlo.call_count >= 1
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("chehak655@gmail.com", "mockapppassword123")
        mock_server.sendmail.assert_called_once()
        
        # Verify sender and recipient
        args, kwargs = mock_server.sendmail.call_args
        assert args[0] == "chehak655@gmail.com"
        assert args[1] == ["chehak655@gmail.com"]


# ---------------------------------------------------------------------------
# 2. SMTP Authentication Failure Handling (No Credential Leakage)
# ---------------------------------------------------------------------------

def test_smtp_authentication_failure():
    with patch.object(settings, "EMAIL_ENABLED", True), \
         patch.object(settings, "SMTP_USERNAME", "chehak655@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", "wrongapppassword"), \
         patch("smtplib.SMTP") as mock_smtp_class:
        
        mock_server = MagicMock()
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"5.7.8 Username and Password not accepted")
        mock_smtp_class.return_value.__enter__.return_value = mock_server

        result = send_email(
            to_email="chehak655@gmail.com",
            subject="Test Subject",
            html_body="<p>Test</p>",
            text_body="Test",
        )

        assert result.status == EmailDispatchStatus.FAILED
        assert result.is_success is False
        assert "authentication failed" in result.message.lower()
        # Ensure password is never in message or detail
        assert "wrongapppassword" not in result.message
        assert "wrongapppassword" not in (result.detail or "")


# ---------------------------------------------------------------------------
# 3. SMTP Socket Timeout Handling
# ---------------------------------------------------------------------------

def test_smtp_socket_timeout_handling():
    with patch.object(settings, "EMAIL_ENABLED", True), \
         patch.object(settings, "SMTP_USERNAME", "chehak655@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", "mockapppassword123"), \
         patch("smtplib.SMTP", side_effect=socket.timeout("Connection timed out")):

        result = send_email(
            to_email="chehak655@gmail.com",
            subject="Test Subject",
            html_body="<p>Test</p>",
            text_body="Test",
        )

        assert result.status == EmailDispatchStatus.FAILED
        assert result.is_success is False
        assert "timed out" in result.message.lower()


# ---------------------------------------------------------------------------
# 4. Safe Dev Mode Fallback (EMAIL_ENABLED=False or Missing Password)
# ---------------------------------------------------------------------------

def test_safe_dev_mode_when_email_disabled():
    with patch.object(settings, "EMAIL_ENABLED", False), \
         patch("smtplib.SMTP") as mock_smtp:

        result = send_email(
            to_email="chehak655@gmail.com",
            subject="Test Subject",
            html_body="<p>Test</p>",
            text_body="Test",
        )

        assert result.status == EmailDispatchStatus.DEV_MOCK
        assert result.is_success is True
        mock_smtp.assert_not_called()


def test_safe_dev_mode_fallback_when_credentials_missing():
    with patch.object(settings, "EMAIL_ENABLED", True), \
         patch.object(settings, "SMTP_USERNAME", "chehak655@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", ""), \
         patch("smtplib.SMTP") as mock_smtp:

        result = send_email(
            to_email="chehak655@gmail.com",
            subject="Test Subject",
            html_body="<p>Test</p>",
            text_body="Test",
        )

        assert result.status == EmailDispatchStatus.DEV_MOCK
        assert result.is_success is True
        mock_smtp.assert_not_called()


# ---------------------------------------------------------------------------
# 5. Diagnostic Test Endpoint: POST /api/email/test
# ---------------------------------------------------------------------------

def test_diagnostic_email_endpoint_success(client):
    with patch.object(settings, "EMAIL_ENABLED", True), \
         patch.object(settings, "SMTP_USERNAME", "chehak655@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", "mockapppassword123"), \
         patch("app.services.email_service.send_diagnostic_test_email") as mock_diag:
        
        mock_diag.return_value = EmailDispatchResult(
            status=EmailDispatchStatus.ACCEPTED,
            message="Email successfully accepted by smtp.gmail.com",
            recipient="chehak655@gmail.com",
            subject="[TaskFlow] SMTP Diagnostic Test Email",
        )

        response = client.post("/api/email/test", json={"to_email": "chehak655@gmail.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "accepted"
        assert data["recipient"] == "chehak655@gmail.com"
        assert "diagnostics" in data
        # Ensure credentials are not leaked in response
        assert "mockapppassword123" not in str(data)
        assert data["diagnostics"]["smtp_password_configured"] is True


def test_diagnostic_email_endpoint_failure(client):
    with patch.object(settings, "EMAIL_ENABLED", True), \
         patch.object(settings, "SMTP_USERNAME", "chehak655@gmail.com"), \
         patch.object(settings, "SMTP_PASSWORD", "wrongapppassword"), \
         patch("app.services.email_service.send_diagnostic_test_email") as mock_diag:
        
        mock_diag.return_value = EmailDispatchResult(
            status=EmailDispatchStatus.FAILED,
            message="SMTP authentication failed.",
            recipient="chehak655@gmail.com",
            subject="[TaskFlow] SMTP Diagnostic Test Email",
            detail="Check Google App Password.",
        )

        response = client.post("/api/email/test", json={"to_email": "chehak655@gmail.com"})
        assert response.status_code == 502
        data = response.json()
        assert "detail" in data
        assert "wrongapppassword" not in str(data)


# ---------------------------------------------------------------------------
# 6. Verification Token Privacy in Responses
# ---------------------------------------------------------------------------

def test_no_token_leakage_in_registration_response(client):
    unique_email = "test_no_token_leak@gmail.com"
    payload = {
        "name": "Token Privacy User",
        "email": unique_email,
        "password": "SecurePassword123!",
    }
    response = client.post("/api/auth/register", json=payload)
    if response.status_code == 201:
        data = response.json()
        assert "email_verification_token" not in data
        assert "password_hash" not in data
        assert "password" not in data
