"""
Test suite for Phase 15 features:
1. Gmail format validation and normalization.
2. Email verification token generation, expiration, single-use consumption.
3. Resend verification rate-limiting.
4. Completion timing analytics (early, on-time, late, no-deadline, reopening).
5. Calendar date-range filtering.
6. Task reminder idempotency & duplicate prevention.
"""
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority, CompletionTiming
from app.models.reminder import TaskReminderLog
from app.services.task_service import classify_completion
from app.services.reminder_scheduler import check_and_send_due_reminders
from app.services.auth_service import verify_user_email, resend_verification_email


# ---------------------------------------------------------------------------
# 1. Gmail Validation Tests
# ---------------------------------------------------------------------------

def test_gmail_registration_valid(client: TestClient):
    """Ensure standard Gmail and Googlemail accounts are registered and normalized."""
    uid = uuid.uuid4().hex[:8]
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Gmail User",
            "email": f"Test.User_{uid}@GMAIL.COM",
            "password": "Password123!",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["email"] == f"test.user_{uid}@gmail.com"
    assert data["is_email_verified"] is False


def test_gmail_registration_googlemail(client: TestClient):
    """Ensure @googlemail.com addresses are accepted."""
    uid = uuid.uuid4().hex[:8]
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Googlemail User",
            "email": f"uk.user_{uid}@googlemail.com",
            "password": "Password123!",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    assert res.json()["email"] == f"uk.user_{uid}@googlemail.com"


def test_gmail_registration_rejected_non_gmail(client: TestClient):
    """Ensure non-Gmail domains are rejected with a clear validation message."""
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Yahoo User",
            "email": "user@yahoo.com",
            "password": "Password123!",
        },
    )
    assert res.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    err_text = str(res.json())
    assert "Only valid Gmail addresses" in err_text


# ---------------------------------------------------------------------------
# 2. Email Verification Token Tests
# ---------------------------------------------------------------------------

def test_email_verification_flow(client: TestClient, db_session: Session):
    """Verify single-use token consumption and account verification."""
    uid = uuid.uuid4().hex[:8]
    email = f"verify_{uid}@gmail.com"
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Verify Tester",
            "email": email,
            "password": "Password123!",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED

    user = db_session.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.is_email_verified is False
    assert user.email_verification_token is not None

    token = user.email_verification_token

    # Verify email via API
    v_res = client.post("/api/auth/verify-email", json={"token": token})
    assert v_res.status_code == status.HTTP_200_OK
    assert v_res.json()["is_email_verified"] is True

    # Check database persistence
    db_session.rollback()
    updated_user = db_session.query(User).filter(User.id == user.id).first()
    assert updated_user.is_email_verified is True
    assert updated_user.email_verification_token is None  # Token invalidated

    # Attempting to reuse same token should fail
    reuse_res = client.post("/api/auth/verify-email", json={"token": token})
    assert reuse_res.status_code == status.HTTP_400_BAD_REQUEST


def test_email_verification_expired_token(client: TestClient, db_session: Session):
    """Ensure expired verification tokens are rejected."""
    uid = uuid.uuid4().hex[:8]
    email = f"expired_{uid}@gmail.com"
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Expired Tester",
            "email": email,
            "password": "Password123!",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED

    user = db_session.query(User).filter(User.email == email).first()
    # Force token expiration
    user.email_verification_expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    db_session.commit()

    v_res = client.post("/api/auth/verify-email", json={"token": user.email_verification_token})
    assert v_res.status_code == status.HTTP_400_BAD_REQUEST
    assert "expired" in v_res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 3. Resend Verification Rate Limiting Tests
# ---------------------------------------------------------------------------

def test_resend_verification_rate_limiting(client: TestClient, db_session: Session):
    """Ensure resend requests enforce a cooldown period."""
    uid = uuid.uuid4().hex[:8]
    email = f"resend_{uid}@gmail.com"
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Resend Tester",
            "email": email,
            "password": "Password123!",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED

    # Immediate resend should be rate-limited (cooldown active)
    r_res = client.post("/api/auth/resend-verification", json={"email": email})
    assert r_res.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "wait" in r_res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 4. Completion Timing Classification Unit Tests
# ---------------------------------------------------------------------------

def test_completion_timing_classifications():
    """Unit test classification helper for all four deadline conditions."""
    now_utc = datetime.now(timezone.utc)
    due_date = now_utc + timedelta(hours=2)

    # 1. Early (> 60 seconds before deadline)
    early_time = due_date - timedelta(minutes=10)
    assert classify_completion(due_date, early_time) == CompletionTiming.COMPLETED_EARLY.value

    # 2. On Time (+/- 60 seconds)
    exact_time = due_date
    assert classify_completion(due_date, exact_time) == CompletionTiming.COMPLETED_ON_TIME.value

    almost_exact = due_date + timedelta(seconds=45)
    assert classify_completion(due_date, almost_exact) == CompletionTiming.COMPLETED_ON_TIME.value

    # 3. Late (> 60 seconds after deadline)
    late_time = due_date + timedelta(minutes=5)
    assert classify_completion(due_date, late_time) == CompletionTiming.COMPLETED_LATE.value

    # 4. Without Deadline
    assert classify_completion(None, now_utc) == CompletionTiming.NO_DEADLINE.value


def test_task_completion_status_lifecycle(client: TestClient, auth_headers: dict):
    """Test full API lifecycle of task completion and reopening."""
    now_utc = datetime.now(timezone.utc)
    future_due = (now_utc + timedelta(days=1)).isoformat()

    # Create task with future deadline
    create_res = client.post(
        "/api/tasks",
        headers=auth_headers,
        json={
            "title": "Complete Early Task",
            "due_date": future_due,
            "priority": "high",
        },
    )
    assert create_res.status_code == status.HTTP_201_CREATED
    task_id = create_res.json()["id"]

    # Mark completed
    patch_res = client.patch(
        f"/api/tasks/{task_id}/status",
        headers=auth_headers,
        json={"status": "completed"},
    )
    assert patch_res.status_code == status.HTTP_200_OK
    data = patch_res.json()
    assert data["status"] == "completed"
    assert data["completed_at"] is not None
    assert data["completion_timing"] == CompletionTiming.COMPLETED_EARLY.value

    # Reopen task (transition back to pending)
    reopen_res = client.patch(
        f"/api/tasks/{task_id}/status",
        headers=auth_headers,
        json={"status": "pending"},
    )
    assert reopen_res.status_code == status.HTTP_200_OK
    reopened_data = reopen_res.json()
    assert reopened_data["status"] == "pending"
    assert reopened_data["completed_at"] is None
    assert reopened_data["completion_timing"] is None


# ---------------------------------------------------------------------------
# 5. Calendar Range Filtering Tests
# ---------------------------------------------------------------------------

def test_calendar_endpoint_date_range(client: TestClient, auth_headers: dict):
    """Verify GET /api/tasks/calendar filters tasks within date bounds."""
    now_utc = datetime.now(timezone.utc)
    t1_due = (now_utc + timedelta(days=5)).isoformat()
    t2_due = (now_utc + timedelta(days=25)).isoformat()

    client.post("/api/tasks", headers=auth_headers, json={"title": "Near Task", "due_date": t1_due})
    client.post("/api/tasks", headers=auth_headers, json={"title": "Far Task", "due_date": t2_due})

    # Range covering only Near Task (first 10 days)
    start_iso = now_utc.isoformat()
    end_iso = (now_utc + timedelta(days=10)).isoformat()

    res = client.get(
        f"/api/tasks/calendar?start_date={start_iso}&end_date={end_iso}",
        headers=auth_headers,
    )
    assert res.status_code == status.HTTP_200_OK
    tasks = res.json()
    titles = [t["title"] for t in tasks]
    assert "Near Task" in titles
    assert "Far Task" not in titles


# ---------------------------------------------------------------------------
# 6. Task Reminder Duplicate Prevention Tests
# ---------------------------------------------------------------------------

def test_task_reminder_idempotency(db_session: Session):
    """Ensure reminder log prevents sending duplicate reminder for same interval."""
    # Clean up prior tasks to ensure test isolation
    db_session.query(TaskReminderLog).delete()
    db_session.query(Task).delete()
    db_session.commit()

    uid = uuid.uuid4().hex[:8]
    user = User(name="Reminder User", email=f"remind_{uid}@gmail.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    now_utc = datetime.now(timezone.utc)
    task = Task(
        title="Due Task",
        due_date=now_utc + timedelta(minutes=10),
        reminder_minutes=15,  # Trigger is now_utc - 5 min -> due window active
        status=TaskStatus.PENDING.value,
        user_id=user.id,
    )
    db_session.add(task)
    db_session.commit()

    # First check dispatches 1 reminder
    sent_count_1 = check_and_send_due_reminders(db_session)
    assert sent_count_1 == 1

    # Second check dispatches 0 reminders (idempotency constraint prevents duplicate)
    sent_count_2 = check_and_send_due_reminders(db_session)
    assert sent_count_2 == 0

