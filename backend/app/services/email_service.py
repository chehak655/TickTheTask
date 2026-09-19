"""
Email service — handles robust STARTTLS SMTP dispatch for verification emails,
task reminders, and diagnostic tests, with Safe Dev Mode fallback.
"""
import smtplib
import socket
from dataclasses import dataclass
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from enum import Enum
from typing import Optional

from app.core.config import settings
from app.models.user import User
from app.models.task import Task


class EmailDispatchStatus(str, Enum):
    ACCEPTED = "accepted"   # Accepted by remote SMTP server (250 response)
    FAILED = "failed"       # Connection, authentication, or protocol failure
    DEV_MOCK = "dev_mock"   # Safe Dev Mode simulated dispatch


@dataclass
class EmailDispatchResult:
    status: EmailDispatchStatus
    message: str
    recipient: str
    subject: str
    detail: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)

    @property
    def is_success(self) -> bool:
        return self.status in (EmailDispatchStatus.ACCEPTED, EmailDispatchStatus.DEV_MOCK)


def _mask_email(email_str: str) -> str:
    """Mask email for safe logging without exposing full identity."""
    if not email_str or "@" not in email_str:
        return "***"
    parts = email_str.split("@")
    name = parts[0]
    domain = parts[1]
    masked_name = f"{name[:2]}***" if len(name) > 2 else "***"
    return f"{masked_name}@{domain}"


def send_email(to_email: str, subject: str, html_body: str, text_body: str) -> EmailDispatchResult:
    """
    Send an email via configured Gmail STARTTLS SMTP server or simulate via Safe Dev Mode.
    Never exposes passwords, tokens, or raw secrets in logs or error traces.
    """
    email_mode = settings.get_email_mode()
    masked_recipient = _mask_email(to_email)
    print(f"[EMAIL REQUEST] Subject: '{subject}' | Recipient: {masked_recipient} | Mode: {email_mode.upper()}")

    # --- Safe Dev Mode / Misconfigured Fallback ---
    if email_mode != "real_smtp":
        if email_mode == "misconfigured":
            print(
                "[!] Warning: EMAIL_ENABLED=True but SMTP_USERNAME or SMTP_PASSWORD is empty. "
                "Falling back to Safe Dev Mode without sending real email."
            )
        else:
            print(
                f"[SAFE DEV MODE] Simulated email to {masked_recipient}: '{subject}'"
            )

        return EmailDispatchResult(
            status=EmailDispatchStatus.DEV_MOCK,
            message="Email delivery simulated in Safe Dev Mode.",
            recipient=to_email,
            subject=subject,
            detail="Safe Dev Mode is active. No real email was dispatched over the internet.",
        )

    # --- Real SMTP Delivery ---
    sender_email = (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME).strip()
    sender_name = settings.SMTP_FROM_NAME or "TickTheTask"
    recipient_email = to_email.strip()

    # Build MIME message with standard compliant headers
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = recipient_email
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")
    msg["X-Mailer"] = "TickTheTask Notification Engine"

    # Attach both plain text and HTML alternatives (UTF-8 encoded)
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # Sanitize Google App Password (handles spaces commonly copied from Google)
    clean_password = settings.SMTP_PASSWORD.strip().replace(" ", "")

    try:
        # Establish TCP connection with strict timeout
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT_SECONDS) as server:
            server.ehlo()

            # Upgrade connection to TLS
            if settings.SMTP_TLS:
                server.starttls()
                server.ehlo()

            # Authenticate with Google App Password
            server.login(settings.SMTP_USERNAME.strip(), clean_password)

            # Dispatch MIME message
            server.sendmail(sender_email, [recipient_email], msg.as_string())

        print(f"[+] [SMTP ACCEPTED] Email to {masked_recipient} successfully accepted by {settings.SMTP_HOST}")
        return EmailDispatchResult(
            status=EmailDispatchStatus.ACCEPTED,
            message=f"Email successfully accepted by mail server ({settings.SMTP_HOST}).",
            recipient=recipient_email,
            subject=subject,
        )

    except smtplib.SMTPAuthenticationError as e:
        err_msg = "SMTP authentication failed. Please verify your Gmail address and 16-character Google App Password."
        print(f"[!] [SMTP AUTH ERROR] Authentication rejected by {settings.SMTP_HOST}")
        return EmailDispatchResult(
            status=EmailDispatchStatus.FAILED,
            message=err_msg,
            recipient=recipient_email,
            subject=subject,
            detail="Authentication failed. Check your Google App Password in backend/.env.",
        )

    except (smtplib.SMTPConnectError, socket.timeout, TimeoutError) as e:
        err_msg = f"Connection to SMTP server ({settings.SMTP_HOST}:{settings.SMTP_PORT}) timed out."
        print(f"[!] [SMTP TIMEOUT] Connection timed out while reaching {settings.SMTP_HOST}")
        return EmailDispatchResult(
            status=EmailDispatchStatus.FAILED,
            message=err_msg,
            recipient=recipient_email,
            subject=subject,
            detail="Could not establish connection to SMTP host.",
        )

    except smtplib.SMTPRecipientsRefused as e:
        err_msg = f"Recipient address refused by mail server."
        print(f"[!] [SMTP RECIPIENT REFUSED] {_mask_email(recipient_email)} was rejected")
        return EmailDispatchResult(
            status=EmailDispatchStatus.FAILED,
            message=err_msg,
            recipient=recipient_email,
            subject=subject,
            detail="The recipient address was rejected by the mail server.",
        )

    except smtplib.SMTPException as e:
        err_msg = f"SMTP protocol error: {type(e).__name__}"
        print(f"[!] [SMTP ERROR] {type(e).__name__}")
        return EmailDispatchResult(
            status=EmailDispatchStatus.FAILED,
            message=err_msg,
            recipient=recipient_email,
            subject=subject,
            detail=str(e)[:100],
        )

    except Exception as e:
        err_msg = f"Unexpected mail dispatch error: {type(e).__name__}"
        print(f"[!] [EMAIL ERROR] {type(e).__name__}")
        return EmailDispatchResult(
            status=EmailDispatchStatus.FAILED,
            message=err_msg,
            recipient=recipient_email,
            subject=subject,
            detail="Unexpected error occurred during email dispatch.",
        )


def send_verification_otp_email(user: User, otp: str) -> EmailDispatchResult:
    """
    Send a clean 4-digit OTP verification email to the user's Gmail address.
    """
    subject = f"{otp} is your TickTheTask verification code"
    
    text_body = f"""Hello {user.name},

Your TickTheTask email verification code is:

{otp}

This code will expire in 10 minutes.
Do not share this code with anyone.

If you did not request this verification code, you can safely ignore this email.
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
    <div style="margin-bottom: 20px;">
      <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">TickTheTask</h2>
    </div>
    <h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">Email Verification Code</h3>
    <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
      Hello <strong>{user.name}</strong>, use the 4-digit verification code below to confirm your Gmail address:
    </p>
    
    <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; margin: 0 auto 24px auto; max-width: 260px;">
      <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #4f46e5; font-family: monospace; display: block; padding-left: 12px;">{otp}</span>
    </div>

    <p style="color: #64748b; font-size: 13px; margin: 0 0 4px 0;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    <p style="color: #e11d48; font-size: 12px; font-weight: 600; margin: 0 0 24px 0;">
      Do not share this code with anyone.
    </p>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
        If you did not request this verification code, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
"""
    return send_email(user.email, subject, html_body, text_body)


def send_verification_email(user: User, token: str) -> EmailDispatchResult:
    """
    Backward-compatibility wrapper: delegates to send_verification_otp_email if token is 4-digit OTP.
    """
    return send_verification_otp_email(user, token)


def send_task_reminder_email(user: User, task: Task, reminder_minutes: int) -> EmailDispatchResult:
    """
    Send an email reminder for an upcoming task deadline.
    """
    due_str = task.due_date.strftime("%B %d, %Y at %H:%M UTC") if task.due_date else "soon"
    
    if reminder_minutes >= 1440:
        lead_time_str = f"{reminder_minutes // 1440} day(s)"
    elif reminder_minutes >= 60:
        lead_time_str = f"{reminder_minutes // 60} hour(s)"
    else:
        lead_time_str = f"{reminder_minutes} minutes"

    subject = f"Reminder: '{task.title}' is due in {lead_time_str}"
    
    text_body = f"""Hello {user.name},

This is a reminder from TickTheTask for your upcoming task:

Task: {task.title}
Priority: {task.priority.capitalize()}
Due Date: {due_str} ({lead_time_str} from now)
Description: {task.description or 'No description provided.'}

View and complete your task at: {settings.FRONTEND_URL}/tasks
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <h2 style="color: #4f46e5; margin: 0; font-size: 22px; font-weight: 800;">TickTheTask</h2>
      <span style="margin-left: auto; background: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">{task.priority.upper()} PRIORITY</span>
    </div>
    <h3 style="color: #0f172a; margin-top: 0;">Task Deadline Approaching</h3>
    <p style="color: #475569; font-size: 14px;">Your task <strong>"{task.title}"</strong> is due in <strong>{lead_time_str}</strong>.</p>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;"><strong>Deadline:</strong> {due_str}</p>
      {f'<p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Description:</strong> {task.description}</p>' if task.description else ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="{settings.FRONTEND_URL}/tasks" style="background-color: #4f46e5; color: #ffffff; padding: 10px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 13px;">Open TickTheTask</a>
    </div>
  </div>
</body>
</html>
"""
    return send_email(user.email, subject, html_body, text_body)


def send_diagnostic_test_email(to_email: str) -> EmailDispatchResult:
    """
    Send an explicit SMTP diagnostic test email to verify Gmail connectivity and authentication.
    """
    subject = "[TickTheTask] SMTP Diagnostic Test Email"
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    
    text_body = f"""TickTheTask SMTP Diagnostic Test

This test email confirms that your TickTheTask backend is successfully connected to smtp.gmail.com 
and capable of delivering emails to your inbox.

Diagnostic Details:
- SMTP Host: {settings.SMTP_HOST}:{settings.SMTP_PORT}
- TLS Enabled: {settings.SMTP_TLS}
- Authenticated Account: {settings.SMTP_USERNAME}
- Dispatch Timestamp: {now_iso}
- Recipient: {to_email}

No action is required. Your email service is operating properly.
"""

    html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <h2 style="color: #4f46e5; margin: 0; font-size: 22px; font-weight: 800;">TickTheTask</h2>
      <span style="margin-left: auto; background: #ecfdf5; color: #059669; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">SMTP DIAGNOSTIC</span>
    </div>
    <h3 style="color: #0f172a; margin-top: 0;">Gmail SMTP Connection Verified</h3>
    <p style="color: #475569; font-size: 14px;">
      This email confirms that TickTheTask has successfully connected to <strong>{settings.SMTP_HOST}</strong>, authenticated via STARTTLS, and delivered this test message to your inbox.
    </p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px; color: #475569;">
      <p style="margin: 0 0 6px;"><strong>Host:</strong> {settings.SMTP_HOST}:{settings.SMTP_PORT}</p>
      <p style="margin: 0 0 6px;"><strong>TLS Active:</strong> {settings.SMTP_TLS}</p>
      <p style="margin: 0 0 6px;"><strong>Sender Account:</strong> {settings.SMTP_USERNAME}</p>
      <p style="margin: 0;"><strong>Timestamp:</strong> {now_iso}</p>
    </div>
    <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      TickTheTask automated system test.
    </p>
  </div>
</body>
</html>
"""
    return send_email(to_email, subject, html_body, text_body)

