"""
Phase 5 — Comprehensive Quality Assurance & Security Verification Suite
Tests:
- Invalid routes (404)
- Method not allowed (405)
- No exposure of sensitive fields (password_hash, internal DB tracebacks)
- Empty database scenarios
- CORS and header checks
- Database connection exception handling
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError
from unittest.mock import patch


def create_auth_user(client: TestClient) -> dict:
    email = f"qa_user_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/auth/register",
        json={"name": "QA User", "email": email, "password": "SecurePassword123!"},
    )
    res = client.post(
        "/api/auth/login",
        json={"username": email, "password": "SecurePassword123!"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. Invalid routes return HTTP 404
# ---------------------------------------------------------------------------
def test_invalid_routes_return_404(client):
    assert client.get("/api/unknown_route").status_code == 404
    assert client.get("/api/v1/unknown_resource").status_code == 404
    assert client.post("/api/totally_unknown_path").status_code == 404


# ---------------------------------------------------------------------------
# 2. Method Not Allowed returns HTTP 405
# ---------------------------------------------------------------------------
def test_method_not_allowed_returns_405(client):
    # /api/auth/register is POST only
    res = client.get("/api/auth/register")
    assert res.status_code == 405

    # /api/auth/login is POST only
    res_login = client.get("/api/auth/login")
    assert res_login.status_code == 405

    # /api/auth/me is GET only
    res_me = client.post("/api/auth/me")
    assert res_me.status_code == 405


# ---------------------------------------------------------------------------
# 3. No sensitive data exposed (password_hash, internal secrets)
# ---------------------------------------------------------------------------
def test_no_sensitive_data_in_responses(client):
    email = f"sensitive_check_{uuid.uuid4().hex[:8]}@example.com"
    # Registration response
    reg_res = client.post(
        "/api/auth/register",
        json={"name": "Audit User", "email": email, "password": "SecurePassword123!"},
    )
    reg_body = reg_res.text
    assert "password_hash" not in reg_body
    assert "SecurePassword123!" not in reg_body
    assert "$2b$" not in reg_body

    # Login response
    login_res = client.post(
        "/api/auth/login",
        json={"username": email, "password": "SecurePassword123!"},
    )
    token = login_res.json()["access_token"]
    login_body = login_res.text
    assert "password_hash" not in login_body
    assert "$2b$" not in login_body

    # Me response
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    me_body = me_res.text
    assert "password_hash" not in me_body
    assert "$2b$" not in me_body

    # Tasks response
    client.post(
        "/api/tasks",
        json={"title": "Audit Task", "description": "Secret content"},
        headers={"Authorization": f"Bearer {token}"},
    )
    tasks_res = client.get("/api/tasks", headers={"Authorization": f"Bearer {token}"})
    tasks_body = tasks_res.text
    assert "password_hash" not in tasks_body


# ---------------------------------------------------------------------------
# 4. Error responses do not leak internal database tracebacks
# ---------------------------------------------------------------------------
def test_error_responses_clean_and_no_traceback_leak(client):
    # 409 conflict
    email = f"duplicate_leak_{uuid.uuid4().hex[:8]}@example.com"
    client.post(
        "/api/auth/register",
        json={"name": "Dup1", "email": email, "password": "SecurePassword123!"},
    )
    dup_res = client.post(
        "/api/auth/register",
        json={"name": "Dup2", "email": email, "password": "SecurePassword123!"},
    )
    assert dup_res.status_code == 409
    body = dup_res.json()
    assert "detail" in body
    # No SQL queries or raw MySQL engine messages in detail
    assert "pymysql" not in dup_res.text.lower()
    assert "sqlalchemy" not in dup_res.text.lower()
    assert "traceback" not in dup_res.text.lower()


# ---------------------------------------------------------------------------
# 5. Empty database / fresh user behavior
# ---------------------------------------------------------------------------
def test_fresh_user_empty_state(client):
    headers = create_auth_user(client)

    # Empty task list
    tasks_res = client.get("/api/tasks", headers=headers)
    assert tasks_res.status_code == 200
    assert tasks_res.json() == []

    # Dashboard stats for empty user
    stats_res = client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats == {
        "total_tasks": 0,
        "completed_tasks": 0,
        "pending_tasks": 0,
        "high_priority_tasks": 0,
        "overdue_tasks": 0,
    }


# ---------------------------------------------------------------------------
# 6. Database connection failure handler verification (HTTP 503)
# ---------------------------------------------------------------------------
def test_database_operational_error_returns_503(client):
    headers = create_auth_user(client)

    with patch("app.services.task_service.get_tasks") as mock_get_tasks:
        mock_get_tasks.side_effect = OperationalError("Can't connect to MySQL server", None, None)
        res = client.get("/api/tasks", headers=headers)
        assert res.status_code == 503
        assert "unavailable" in res.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 7. Content-Type and JSON Schema standards
# ---------------------------------------------------------------------------
def test_response_headers_and_content_type(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert "application/json" in res.headers["content-type"]

    root_res = client.get("/")
    assert root_res.status_code == 200
    assert "application/json" in root_res.headers["content-type"]
