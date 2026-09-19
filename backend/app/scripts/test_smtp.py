"""
TickTheTask CLI SMTP Connectivity & Diagnostic Tool
Usage:
    python -m app.scripts.test_smtp [--recipient user@gmail.com]
"""
import sys
import argparse
import socket
import smtplib
from datetime import datetime, timezone

from app.core.config import settings
from app.services.email_service import send_diagnostic_test_email, EmailDispatchStatus


def run_smtp_diagnostics(recipient: str = None):
    target = recipient or settings.SMTP_USERNAME or "chehak655@gmail.com"

    print("=" * 65)
    print(" TASKFLOW SMTP DIAGNOSTIC SUITE")
    print("=" * 65)
    print(f"Environment:       {settings.ENVIRONMENT}")
    print(f"EMAIL_ENABLED:     {settings.EMAIL_ENABLED}")
    print(f"Active Mode:       {settings.get_email_mode().upper()}")
    print(f"SMTP Host:         {settings.SMTP_HOST}:{settings.SMTP_PORT}")
    print(f"STARTTLS Required: {settings.SMTP_TLS}")
    print(f"Timeout:           {settings.SMTP_TIMEOUT_SECONDS}s")
    
    masked_user = settings.SMTP_USERNAME
    if "@" in masked_user:
        u_name, u_dom = masked_user.split("@")
        masked_user = f"{u_name[:3]}...@{u_dom}"
    print(f"Configured User:   {masked_user if masked_user else '[NOT SET]'}")
    
    has_pwd = bool(settings.SMTP_PASSWORD.strip())
    print(f"App Password Set:  {'YES (Length: ' + str(len(settings.SMTP_PASSWORD.strip())) + ' chars)' if has_pwd else 'NO [MISSING]'}")
    print(f"Target Recipient:  {target}")
    print("-" * 65)

    if not settings.EMAIL_ENABLED:
        print("[!] EMAIL_ENABLED is currently False in backend/.env.")
        print("    Safe Dev Mode is active. No external connection attempted.")
        return 0

    if not has_pwd or not settings.SMTP_USERNAME:
        print("[!] SMTP_USERNAME or SMTP_PASSWORD is not set in backend/.env.")
        print("    To send real emails:")
        print("    1. Generate a Google App Password (myaccount.google.com -> Security -> App Passwords)")
        print("    2. Set SMTP_PASSWORD in backend/.env")
        print("    3. Set EMAIL_ENABLED=True")
        return 1

    # Step 1: TCP Socket Reachability
    print("\n[1/4] Testing TCP connection to host...")
    try:
        sock = socket.create_connection(
            (settings.SMTP_HOST, settings.SMTP_PORT),
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        )
        sock.close()
        print(f"  [+] SUCCESS: TCP port {settings.SMTP_PORT} is reachable on {settings.SMTP_HOST}")
    except Exception as e:
        print(f"  [!] FAILED: TCP connection to {settings.SMTP_HOST}:{settings.SMTP_PORT} failed: {e}")
        return 1

    # Step 2: SMTP Handshake & STARTTLS
    print("\n[2/4] Testing SMTP Handshake & STARTTLS...")
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT_SECONDS)
        code, msg = server.ehlo()
        print(f"  [+] EHLO response: {code}")
        
        if settings.SMTP_TLS:
            t_code, t_msg = server.starttls()
            print(f"  [+] STARTTLS upgraded: {t_code}")
            server.ehlo()
    except Exception as e:
        print(f"  [!] FAILED: TLS handshake failed: {e}")
        return 1

    # Step 3: SMTP Authentication
    print("\n[3/4] Authenticating with Google App Password...")
    try:
        server.login(settings.SMTP_USERNAME.strip(), settings.SMTP_PASSWORD.strip())
        print(f"  [+] SUCCESS: Authenticated successfully as {settings.SMTP_USERNAME}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"  [!] FAILED: Authentication rejected by Gmail.")
        print(f"      Reason: {e.smtp_error.decode('utf-8', errors='ignore') if isinstance(e.smtp_error, bytes) else e.smtp_error}")
        print("      Tip: If 2-Step Verification is ON, use a 16-character Google App Password.")
        server.quit()
        return 1
    except Exception as e:
        print(f"  [!] FAILED: Login failed: {e}")
        server.quit()
        return 1

    # Step 4: Dispatch Test Message
    print(f"\n[4/4] Sending diagnostic test email to {target}...")
    server.quit()
    
    result = send_diagnostic_test_email(target)
    if result.status == EmailDispatchStatus.ACCEPTED:
        print(f"  [+] SUCCESS: Test email was accepted by {settings.SMTP_HOST}!")
        print(f"  [+] Check your Gmail inbox ({target}) for the message.")
        print("=" * 65)
        print(" ALL DIAGNOSTIC CHECKS PASSED")
        print("=" * 65)
        return 0
    else:
        print(f"  [!] FAILED: {result.message}")
        if result.detail:
            print(f"      Detail: {result.detail}")
        return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TickTheTask SMTP Diagnostic Tool")
    parser.add_argument("--recipient", "-r", type=str, default=None, help="Email address to receive test message")
    args = parser.parse_args()
    
    exit_code = run_smtp_diagnostics(recipient=args.recipient)
    sys.exit(exit_code)
