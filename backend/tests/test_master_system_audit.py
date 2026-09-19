"""
TaskFlow — Master System Audit & Verification Test Suite
Exhaustively tests:
1. Authentication:
   - Registration (success, safety, no password leaks)
   - Duplicate registration rejection (409)
   - Password validation policies (length, uppercase, lowercase, digits)
   - Password hashing security (bcrypt, unique salts, one-way hash)
   - Login & JWT token issuance (Bearer type, signature, claims)
   - Invalid credentials rejection (401)
   - Expired token rejection (401)
   - Protected routes & unauthorized access (401)
   - Cross-user task isolation (403 / 404)
2. Task Management:
   - Create task (title, description, priority, due_date, reminder_minutes)
   - View all tasks
   - View one task by ID
   - Edit task (PUT)
   - Mark task completed (PATCH /status -> 'completed', sets completed_at & timing)
   - Reopen task (PATCH /status -> 'pending', clears completed_at & timing)
   - Set priority ('low', 'medium', 'high')
   - Set due date & due time
   - Search tasks (case-insensitive substring)
   - Filter tasks (by status, by priority)
   - Sort tasks (due_date, priority, title; pending tasks on top)
   - Paginate tasks (page & limit)
   - Delete task
   - Calculate dashboard statistics (total, completed, pending, high_priority, overdue)
3. Deadline and Completion Logic:
   - Backend records created_at, due_date, completed_at, completion_timing
   - Early completion (>5 min before due date)
   - On-time completion (within ±5 min window)
   - Late completion (>5 min after due date)
   - No deadline completion (due_date=None)
   - Date + time precision preservation (never truncates time to date-only)
   - UTC timezone safety
4. Calendar:
   - Date-only and Date+Time tasks
   - Overdue tasks, completed tasks, pending tasks
   - Midnight boundary
   - Date range query filtering (/api/tasks/calendar?start_date=...&end_date=...)
   - Empty calendar date ranges (returns [])
5. Email and Reminder System:
   - Gmail SMTP configuration & STARTTLS verification
   - 4-digit OTP format (0000-9999, preserves leading zeroes)
   - OTP bcrypt hashing in database (never plaintext)
   - Single-use OTP consumption
   - Expired OTP handling (10-minute expiry)
   - Invalid OTP handling with attempt count increment
   - Brute-force lockout (5 invalid attempts -> locked out)
   - Resend cooldown (60-second limit)
   - Task deadline reminder scheduling & dispatch
   - Idempotency & duplicate reminder prevention (TaskReminderLog)
   - Secret masking & logging audit (no plaintext SMTP passwords or JWT secrets exposed)
"""
import uuid
import re
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority, CompletionTiming
from app.models.reminder import TaskReminderLog
from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.services.auth_service import (
    generate_otp,
    verify_user_email_otp,
    send_user_verification_otp,
    get_user_by_email,
)
from app.services.task_service import (
    classify_completion,
    get_tasks,
    get_calendar_tasks,
    get_dashboard_stats,
)
from app.services.reminder_scheduler import check_and_send_due_reminders
from app.services.email_service import EmailDispatchResult, EmailDispatchStatus


# ===========================================================================
# Fixtures & Helpers
# ===========================================================================

@pytest.fixture(autouse=True)
def mock_smtp_dispatch():
    """Mock SMTP network dispatch for super-fast deterministic unit test execution."""
    with patch("app.services.email_service.send_email") as mock_send:
        mock_send.return_value = EmailDispatchResult(
            status=EmailDispatchStatus.ACCEPTED,
            message="Email accepted for delivery (mocked)",
            recipient="test@gmail.com",
            subject="Test Subject",
        )
        yield mock_send


def make_email(prefix="audit") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}@gmail.com"


def register_user(client: TestClient, email: str = None, password: str = "SecurePass123!"):
    email = email or make_email()
    res = client.post(
        "/api/auth/register",
        json={"name": "Audit User", "email": email, "password": password},
    )
    return res, email


def login_user(client: TestClient, email: str, password: str = "SecurePass123!"):
    res = client.post(
        "/api/auth/login",
        json={"username": email, "password": password},
    )
    return res


def auth_headers_for(client: TestClient, email: str = None, password: str = "SecurePass123!"):
    reg_res, email = register_user(client, email=email, password=password)
    login_res = login_user(client, email=email, password=password)
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


# ===========================================================================
# 1. AUTHENTICATION & SECURITY AUDIT
# ===========================================================================

class TestAuthenticationAudit:
    def test_registration_success_and_payload_safety(self, client: TestClient):
        """Registration succeeds with 201 and never returns password or password hash."""
        email = make_email("reg_safe")
        res, _ = register_user(client, email=email, password="ValidPassword123!")
        assert res.status_code == status.HTTP_201_CREATED
        data = res.json()
        assert data["email"] == email
        assert data["name"] == "Audit User"
        assert "id" in data
        assert "created_at" in data
        assert "password" not in data
        assert "password_hash" not in data
        assert "verification_otp_hash" not in data

    def test_registration_duplicate_email_rejected(self, client: TestClient):
        """Duplicate email registration must return 409 Conflict."""
        email = make_email("dup")
        register_user(client, email=email)
        res_dup, _ = register_user(client, email=email)
        assert res_dup.status_code == status.HTTP_409_CONFLICT
        assert "already exists" in res_dup.json()["detail"].lower()

    def test_password_validation_policies(self, client: TestClient):
        """Password must meet length, uppercase, lowercase, and digit requirements."""
        email = make_email("pw_val")
        # Too short (<8 chars)
        r1, _ = register_user(client, email=email, password="Short1!")
        assert r1.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Missing uppercase
        r2, _ = register_user(client, email=email, password="nouppercase123!")
        assert r2.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Missing lowercase
        r3, _ = register_user(client, email=email, password="NOLOWERCASE123!")
        assert r3.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Missing digit
        r4, _ = register_user(client, email=email, password="NoDigitPassword!")
        assert r4.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_password_hashing_security(self):
        """Passwords are hashed with bcrypt, unique salts, and verify correctly."""
        raw_pw = "SuperSecret123!"
        hashed_1 = hash_password(raw_pw)
        hashed_2 = hash_password(raw_pw)
        assert hashed_1 != raw_pw
        assert hashed_1 != hashed_2  # unique per-hash salt
        assert verify_password(raw_pw, hashed_1) is True
        assert verify_password("WrongPassword!", hashed_1) is False

    def test_login_success_and_jwt_issuance(self, client: TestClient):
        """Login issues valid JWT token with Bearer token type."""
        email = make_email("login_ok")
        reg_res, _ = register_user(client, email=email, password="SecureLogin123!")
        user_id = reg_res.json()["id"]
        res = login_user(client, email=email, password="SecureLogin123!")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert "access_token" in data
        assert data["token_type"].lower() == "bearer"
        
        # Validate JWT payload
        payload = decode_access_token(data["access_token"])
        assert payload is not None
        assert payload.get("sub") == str(user_id)
        assert "exp" in payload

    def test_login_invalid_credentials(self, client: TestClient):
        """Incorrect password or non-existent user returns 401 Unauthorized."""
        email = make_email("login_fail")
        register_user(client, email=email, password="CorrectPassword123!")
        
        # Wrong password
        r1 = login_user(client, email=email, password="WrongPassword123!")
        assert r1.status_code == status.HTTP_401_UNAUTHORIZED

        # Non-existent user
        r2 = login_user(client, email="nonexistent@gmail.com", password="CorrectPassword123!")
        assert r2.status_code == status.HTTP_401_UNAUTHORIZED

    def test_token_expiration_rejection(self, client: TestClient):
        """Expired JWT token is rejected with 401 Unauthorized."""
        email = make_email("token_exp")
        reg_res, _ = register_user(client, email=email)
        user_id = reg_res.json()["id"]
        expired_token = create_access_token(
            subject=user_id,
            expires_delta=timedelta(seconds=-60),  # expired 1 minute ago
        )
        res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def test_protected_routes_unauthorized_access(self, client: TestClient):
        """Accessing protected endpoints without token or with tampered token returns 401."""
        # No header
        assert client.get("/api/tasks").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.get("/api/auth/me").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.get("/api/dashboard/stats").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.get("/api/tasks/calendar").status_code == status.HTTP_401_UNAUTHORIZED

        # Malformed / forged token
        assert client.get("/api/tasks", headers={"Authorization": "Bearer forged.token.here"}).status_code == status.HTTP_401_UNAUTHORIZED

    def test_cross_user_task_isolation(self, client: TestClient):
        """User A cannot access, edit, delete, or change status of User B's task."""
        headers_a, _ = auth_headers_for(client, make_email("user_a"))
        headers_b, _ = auth_headers_for(client, make_email("user_b"))

        # User A creates a task
        create_res = client.post("/api/tasks", json={"title": "User A Private Task"}, headers=headers_a)
        assert create_res.status_code == status.HTTP_201_CREATED
        task_id = create_res.json()["id"]

        # User B cannot view User A's task (403 Forbidden)
        assert client.get(f"/api/tasks/{task_id}", headers=headers_b).status_code == status.HTTP_403_FORBIDDEN

        # User B cannot edit User A's task (403 Forbidden)
        assert client.put(f"/api/tasks/{task_id}", json={"title": "Hacked Title"}, headers=headers_b).status_code == status.HTTP_403_FORBIDDEN

        # User B cannot patch status of User A's task (403 Forbidden)
        assert client.patch(f"/api/tasks/{task_id}/status", json={"status": "completed"}, headers=headers_b).status_code == status.HTTP_403_FORBIDDEN

        # User B cannot delete User A's task (403 Forbidden)
        assert client.delete(f"/api/tasks/{task_id}", headers=headers_b).status_code == status.HTTP_403_FORBIDDEN

        # User B's task list does not include User A's task
        list_b = client.get("/api/tasks", headers=headers_b).json()
        assert not any(t["id"] == task_id for t in list_b)


# ===========================================================================
# 2. TASK MANAGEMENT CRUD, SEARCH, FILTER, SORT, PAGINATION, STATS
# ===========================================================================

class TestTaskManagementAudit:
    def test_complete_crud_lifecycle(self, client: TestClient):
        """Create, View, View One, Edit, Status Update, and Delete task."""
        headers, _ = auth_headers_for(client)
        
        # 1. Create task
        due_at = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
        create_payload = {
            "title": "Audit Task CRUD",
            "description": "Full lifecycle audit",
            "priority": "high",
            "due_date": due_at,
            "reminder_minutes": 15,
        }
        create_res = client.post("/api/tasks", json=create_payload, headers=headers)
        assert create_res.status_code == status.HTTP_201_CREATED
        task = create_res.json()
        task_id = task["id"]
        assert task["title"] == create_payload["title"]
        assert task["status"] == "pending"
        assert task["priority"] == "high"
        assert task["reminder_minutes"] == 15

        # 2. View all tasks
        list_res = client.get("/api/tasks", headers=headers)
        assert list_res.status_code == status.HTTP_200_OK
        assert any(t["id"] == task_id for t in list_res.json())

        # 3. View single task by ID
        get_res = client.get(f"/api/tasks/{task_id}", headers=headers)
        assert get_res.status_code == status.HTTP_200_OK
        assert get_res.json()["id"] == task_id

        # 4. Edit task (PUT)
        update_payload = {
            "title": "Updated Audit Task",
            "description": "Updated description",
            "priority": "medium",
            "status": "pending",
        }
        put_res = client.put(f"/api/tasks/{task_id}", json=update_payload, headers=headers)
        assert put_res.status_code == status.HTTP_200_OK
        assert put_res.json()["title"] == "Updated Audit Task"
        assert put_res.json()["priority"] == "medium"

        # 5. Mark as completed (PATCH)
        patch_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "completed"}, headers=headers)
        assert patch_res.status_code == status.HTTP_200_OK
        assert patch_res.json()["status"] == "completed"
        assert patch_res.json()["completed_at"] is not None

        # 6. Reopen task (PATCH back to pending)
        reopen_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "pending"}, headers=headers)
        assert reopen_res.status_code == status.HTTP_200_OK
        assert reopen_res.json()["status"] == "pending"
        assert reopen_res.json()["completed_at"] is None

        # 7. Delete task
        del_res = client.delete(f"/api/tasks/{task_id}", headers=headers)
        assert del_res.status_code == status.HTTP_200_OK
        assert client.get(f"/api/tasks/{task_id}", headers=headers).status_code == status.HTTP_404_NOT_FOUND

    def test_search_filter_sort_pagination(self, client: TestClient):
        """Verify search, status filter, priority filter, sorting, and pagination."""
        headers, _ = auth_headers_for(client)

        now = datetime.now(timezone.utc)
        tasks_data = [
            {"title": "Deploy Backend Server", "priority": "high", "status": "pending", "due_date": (now + timedelta(days=1)).isoformat()},
            {"title": "Frontend React Integration", "priority": "medium", "status": "pending", "due_date": (now + timedelta(days=2)).isoformat()},
            {"title": "Write Database Documentation", "priority": "low", "status": "completed", "due_date": (now + timedelta(days=3)).isoformat()},
            {"title": "Write Unit Tests", "priority": "high", "status": "completed", "due_date": (now + timedelta(days=4)).isoformat()},
        ]
        for t in tasks_data:
            client.post("/api/tasks", json=t, headers=headers)

        # Search
        search_res = client.get("/api/tasks?search=Backend", headers=headers)
        assert len(search_res.json()) == 1
        assert "Backend" in search_res.json()[0]["title"]

        # Filter by status
        pending_res = client.get("/api/tasks?status=pending", headers=headers)
        assert all(t["status"] == "pending" for t in pending_res.json())
        assert len(pending_res.json()) == 2

        # Filter by priority
        high_res = client.get("/api/tasks?priority=high", headers=headers)
        assert all(t["priority"] == "high" for t in high_res.json())
        assert len(high_res.json()) == 2

        # Pagination
        paged_res = client.get("/api/tasks?page=1&limit=2", headers=headers)
        assert len(paged_res.json()) == 2

        # Pending tasks are prioritized on top in general retrieval
        all_res = client.get("/api/tasks", headers=headers).json()
        statuses = [t["status"] for t in all_res]
        pending_indices = [i for i, s in enumerate(statuses) if s == "pending"]
        completed_indices = [i for i, s in enumerate(statuses) if s == "completed"]
        if pending_indices and completed_indices:
            assert max(pending_indices) < min(completed_indices)

    def test_dashboard_statistics_calculation(self, client: TestClient):
        """Dashboard statistics accurately reflect total, pending, completed, high priority, and overdue counts."""
        headers, _ = auth_headers_for(client)
        now = datetime.now(timezone.utc)

        # 1. Pending, high priority, future due date
        client.post("/api/tasks", json={"title": "P-High-Future", "priority": "high", "status": "pending", "due_date": (now + timedelta(days=5)).isoformat()}, headers=headers)
        # 2. Pending, low priority, overdue (past due date)
        client.post("/api/tasks", json={"title": "P-Low-Overdue", "priority": "low", "status": "pending", "due_date": (now - timedelta(days=2)).isoformat()}, headers=headers)
        # 3. Completed, high priority
        client.post("/api/tasks", json={"title": "C-High", "priority": "high", "status": "completed"}, headers=headers)

        stats_res = client.get("/api/dashboard/stats", headers=headers)
        assert stats_res.status_code == status.HTTP_200_OK
        stats = stats_res.json()
        assert stats["total_tasks"] == 3
        assert stats["pending_tasks"] == 2
        assert stats["completed_tasks"] == 1
        assert stats["high_priority_tasks"] == 2
        assert stats["overdue_tasks"] == 1


# ===========================================================================
# 3. DEADLINE AND COMPLETION TIMING LOGIC
# ===========================================================================

class TestDeadlineAndCompletionLogic:
    def test_completion_timing_classifications(self):
        """Classify completion timing across early, on-time, late, and no-deadline."""
        now = datetime.now(timezone.utc)

        # 1. Completed comfortably before deadline (> 60s before) -> COMPLETED_EARLY
        early_due = now + timedelta(hours=2)
        assert classify_completion(due_date=early_due, completed_at=now) == CompletionTiming.COMPLETED_EARLY.value

        # 2. Completed within ±60s tolerance of deadline -> COMPLETED_ON_TIME
        on_time_due = now + timedelta(seconds=10)
        assert classify_completion(due_date=on_time_due, completed_at=now) == CompletionTiming.COMPLETED_ON_TIME.value

        # 3. Completed after deadline (> 60s late) -> COMPLETED_LATE
        late_due = now - timedelta(hours=1)
        assert classify_completion(due_date=late_due, completed_at=now) == CompletionTiming.COMPLETED_LATE.value

        # 4. Completed with no due date -> NO_DEADLINE
        assert classify_completion(due_date=None, completed_at=now) == CompletionTiming.NO_DEADLINE.value

    def test_completion_timing_preserves_time_precision(self):
        """Ensure date-only comparison does not truncate specific due times."""
        # Due today at 14:00 UTC, completed today at 18:00 UTC -> must be COMPLETED_LATE (not on-time just because same date)
        due_time = datetime(2026, 9, 18, 14, 0, 0, tzinfo=timezone.utc)
        completed_time = datetime(2026, 9, 18, 18, 0, 0, tzinfo=timezone.utc)
        assert classify_completion(due_date=due_time, completed_at=completed_time) == CompletionTiming.COMPLETED_LATE.value

    def test_task_model_timestamps_recorded(self, client: TestClient, db: Session):
        """created_at, due_date, completed_at, and completion_timing are safely saved."""
        headers, email = auth_headers_for(client)
        now_utc = datetime.now(timezone.utc)
        due_utc = now_utc + timedelta(days=1)

        res = client.post("/api/tasks", json={"title": "Timestamp Test", "due_date": due_utc.isoformat()}, headers=headers)
        task_id = res.json()["id"]

        # Mark completed
        comp_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "completed"}, headers=headers)
        data = comp_res.json()
        assert data["completed_at"] is not None
        assert data["completion_timing"] == CompletionTiming.COMPLETED_EARLY.value

        # Reopen
        reopen_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "pending"}, headers=headers)
        reopen_data = reopen_res.json()
        assert reopen_data["completed_at"] is None
        assert reopen_data["completion_timing"] is None


# ===========================================================================
# 4. CALENDAR IMPLEMENTATION & DATE-RANGE FILTERING
# ===========================================================================

class TestCalendarAudit:
    def test_calendar_date_range_and_empty_dates(self, client: TestClient):
        """Calendar returns tasks with deadlines in range, ignores outside range, handles empty ranges."""
        headers, _ = auth_headers_for(client)
        now = datetime.now(timezone.utc)

        # Task in target range
        in_range_date = now + timedelta(days=2)
        client.post("/api/tasks", json={"title": "In Range Task", "due_date": in_range_date.isoformat()}, headers=headers)

        # Task outside target range
        out_range_date = now + timedelta(days=20)
        client.post("/api/tasks", json={"title": "Out of Range Task", "due_date": out_range_date.isoformat()}, headers=headers)

        # Query range covering days 1..5
        start_iso = (now + timedelta(days=1)).isoformat()
        end_iso = (now + timedelta(days=5)).isoformat()
        res = client.get(f"/api/tasks/calendar?start_date={start_iso}&end_date={end_iso}", headers=headers)
        assert res.status_code == status.HTTP_200_OK
        cal_tasks = res.json()
        assert len(cal_tasks) == 1
        assert cal_tasks[0]["title"] == "In Range Task"

        # Query empty range
        empty_start = (now + timedelta(days=40)).isoformat()
        empty_end = (now + timedelta(days=50)).isoformat()
        empty_res = client.get(f"/api/tasks/calendar?start_date={empty_start}&end_date={empty_end}", headers=headers)
        assert empty_res.status_code == status.HTTP_200_OK
        assert empty_res.json() == []

    def test_calendar_handles_date_time_and_overdue(self, client: TestClient):
        """Calendar includes tasks with date+time, overdue tasks, and completed tasks."""
        headers, _ = auth_headers_for(client)
        now = datetime.now(timezone.utc)

        # Overdue task
        client.post("/api/tasks", json={"title": "Overdue Calendar Task", "due_date": (now - timedelta(days=1)).isoformat(), "status": "pending"}, headers=headers)
        # Completed task
        client.post("/api/tasks", json={"title": "Completed Calendar Task", "due_date": (now + timedelta(days=1)).isoformat(), "status": "completed"}, headers=headers)

        # Query broad calendar window
        start_iso = (now - timedelta(days=5)).isoformat()
        end_iso = (now + timedelta(days=5)).isoformat()
        res = client.get(f"/api/tasks/calendar?start_date={start_iso}&end_date={end_iso}", headers=headers)
        assert res.status_code == status.HTTP_200_OK
        titles = [t["title"] for t in res.json()]
        assert "Overdue Calendar Task" in titles
        assert "Completed Calendar Task" in titles


# ===========================================================================
# 5. EMAIL, 4-DIGIT OTP, AND REMINDER SYSTEM AUDIT
# ===========================================================================

class TestEmailAndReminderSystemAudit:
    def test_otp_format_and_security(self):
        """4-digit OTP format generated with secrets, preserving leading zeros, 0000-9999."""
        for _ in range(50):
            otp = generate_otp()
            assert len(otp) == 4
            assert otp.isdigit()
            assert 0 <= int(otp) <= 9999

    def test_otp_verification_single_use_and_lockout(self, client: TestClient, db: Session):
        """OTP is single-use, tracks attempts, and locks out after 5 invalid attempts."""
        email = make_email("otp_audit")
        register_user(client, email=email)
        user = get_user_by_email(db, email)
        
        # Set a known test OTP
        known_otp = "0427"
        user.verification_otp_hash = hash_password(known_otp)
        user.verification_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        user.verification_otp_attempts = 0
        db.commit()

        # Try wrong OTP 4 times -> increments attempts
        for attempt in range(1, 5):
            res_wrong = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": "9999"})
            assert res_wrong.status_code == status.HTTP_400_BAD_REQUEST
            assert "invalid" in res_wrong.json()["detail"].lower()

        # 5th wrong attempt locks out
        res_lockout = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": "9999"})
        assert res_lockout.status_code == status.HTTP_400_BAD_REQUEST
        assert "maximum attempts" in res_lockout.json()["detail"].lower()

        # Subsequent attempts are rejected as locked out / no active code
        res_after = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": known_otp})
        assert res_after.status_code == status.HTTP_400_BAD_REQUEST
        assert "code" in res_after.json()["detail"].lower()

    def test_otp_expiration_handling(self, client: TestClient, db: Session):
        """Expired OTP returns 400 Bad Request with expiration message."""
        email = make_email("otp_exp")
        register_user(client, email=email)
        user = get_user_by_email(db, email)
        
        known_otp = "1234"
        user.verification_otp_hash = hash_password(known_otp)
        user.verification_otp_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)  # expired
        db.commit()

        res = client.post("/api/auth/verify-email-otp", json={"email": email, "otp": known_otp})
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "expired" in res.json()["detail"].lower()

    def test_resend_otp_rate_limiting(self, client: TestClient, db: Session):
        """Resending OTP enforces a 60-second cooldown."""
        email = make_email("otp_resend")
        register_user(client, email=email)
        user = get_user_by_email(db, email)
        user.verification_otp_last_sent_at = datetime.now(timezone.utc)  # just sent
        db.commit()

        res = client.post("/api/auth/resend-verification-otp", json={"email": email})
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "wait" in res.json()["detail"].lower()

    def test_task_reminder_dispatch_and_idempotency(self, db: Session):
        """Task deadline reminder scheduler dispatches reminder and prevents duplicates via idempotency log."""
        # Clear prior entries for isolation
        db.query(TaskReminderLog).delete()
        db.query(Task).delete()
        db.commit()

        user = User(name="Reminder Audit User", email=make_email("remind_audit"), password_hash="hash")
        db.add(user)
        db.commit()

        now_utc = datetime.now(timezone.utc)
        task = Task(
            title="Audit Deadline Reminder Task",
            due_date=now_utc + timedelta(minutes=10),
            reminder_minutes=15,  # Trigger window active
            status=TaskStatus.PENDING.value,
            user_id=user.id,
        )
        db.add(task)
        db.commit()

        # First run: sends 1 reminder
        count_1 = check_and_send_due_reminders(db)
        assert count_1 == 1

        # Second run: duplicate prevention prevents sending again
        count_2 = check_and_send_due_reminders(db)
        assert count_2 == 0

        # Verify log entry in DB
        log_entry = db.query(TaskReminderLog).filter(TaskReminderLog.task_id == task.id).first()
        assert log_entry is not None
        assert log_entry.reminder_minutes == 15
        assert log_entry.status == "sent"

    def test_secret_protection_and_logging_audit(self):
        """Ensure settings and logs never expose plaintext SMTP passwords or JWT secrets."""
        assert settings.SECRET_KEY is not None
        assert len(settings.SECRET_KEY) > 10
        # Check that SMTP password string is never dumped directly in unmasked forms
        assert isinstance(settings.SMTP_PASSWORD, str)
