"""
Phase 4 — Task CRUD, Search, Filter, Sort, Dashboard Stats & Ownership Tests
Covers all 18 test scenarios required by Phase 4.
"""
import uuid
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_user_and_get_token(client: TestClient) -> tuple[dict, str]:
    """Register a new unique user and return (auth_headers, email)."""
    email = f"taskuser_{uuid.uuid4().hex[:10]}@example.com"
    client.post(
        "/api/auth/register",
        json={"name": "Task User", "email": email, "password": "SecurePassword123!"},
    )
    res = client.post(
        "/api/auth/login",
        json={"username": email, "password": "SecurePassword123!"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


# ---------------------------------------------------------------------------
# 1. Task creation
# ---------------------------------------------------------------------------
def test_task_creation(client):
    headers, _ = create_user_and_get_token(client)
    payload = {
        "title": "Complete Phase 4",
        "description": "Build Task CRUD and dashboard APIs",
        "priority": "high",
        "due_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
    }
    res = client.post("/api/tasks", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["priority"] == "high"
    assert data["status"] == "pending"  # default
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "user_id" in data


# ---------------------------------------------------------------------------
# 2. Task retrieval (all tasks for user)
# ---------------------------------------------------------------------------
def test_task_retrieval_all(client):
    headers, _ = create_user_and_get_token(client)
    client.post("/api/tasks", json={"title": "Task 1"}, headers=headers)
    client.post("/api/tasks", json={"title": "Task 2"}, headers=headers)

    res = client.get("/api/tasks", headers=headers)
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)
    assert len(tasks) == 2
    titles = [t["title"] for t in tasks]
    assert "Task 1" in titles
    assert "Task 2" in titles


# ---------------------------------------------------------------------------
# 3. Task retrieval by ID
# ---------------------------------------------------------------------------
def test_task_retrieval_by_id(client):
    headers, _ = create_user_and_get_token(client)
    created = client.post("/api/tasks", json={"title": "Specific Task", "description": "Details here"}, headers=headers).json()
    task_id = created["id"]

    res = client.get(f"/api/tasks/{task_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == task_id
    assert data["title"] == "Specific Task"
    assert data["description"] == "Details here"


# ---------------------------------------------------------------------------
# 4. Task update (PUT)
# ---------------------------------------------------------------------------
def test_task_update(client):
    headers, _ = create_user_and_get_token(client)
    created = client.post("/api/tasks", json={"title": "Original Title", "priority": "low"}, headers=headers).json()
    task_id = created["id"]

    update_payload = {
        "title": "Updated Title",
        "description": "Updated Description",
        "priority": "high",
        "status": "completed",
    }
    res = client.put(f"/api/tasks/{task_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Updated Title"
    assert data["description"] == "Updated Description"
    assert data["priority"] == "high"
    assert data["status"] == "completed"


# ---------------------------------------------------------------------------
# 5. Task deletion
# ---------------------------------------------------------------------------
def test_task_deletion(client):
    headers, _ = create_user_and_get_token(client)
    created = client.post("/api/tasks", json={"title": "To Delete"}, headers=headers).json()
    task_id = created["id"]

    res = client.delete(f"/api/tasks/{task_id}", headers=headers)
    assert res.status_code == 200
    assert res.json()["id"] == task_id

    # Verify task is no longer found
    check = client.get(f"/api/tasks/{task_id}", headers=headers)
    assert check.status_code == 404


# ---------------------------------------------------------------------------
# 6. Completion status (PATCH to completed)
# ---------------------------------------------------------------------------
def test_mark_task_completed(client):
    headers, _ = create_user_and_get_token(client)
    created = client.post("/api/tasks", json={"title": "Task to complete"}, headers=headers).json()
    task_id = created["id"]
    assert created["status"] == "pending"

    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "completed"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "completed"


# ---------------------------------------------------------------------------
# 7. Pending status (PATCH to pending)
# ---------------------------------------------------------------------------
def test_mark_task_pending(client):
    headers, _ = create_user_and_get_token(client)
    created = client.post("/api/tasks", json={"title": "Task completed initially", "status": "completed"}, headers=headers).json()
    task_id = created["id"]

    res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "pending"}, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "pending"


# ---------------------------------------------------------------------------
# 8. Status filtering
# ---------------------------------------------------------------------------
def test_status_filtering(client):
    headers, _ = create_user_and_get_token(client)
    client.post("/api/tasks", json={"title": "Pending 1", "status": "pending"}, headers=headers)
    client.post("/api/tasks", json={"title": "Pending 2", "status": "pending"}, headers=headers)
    client.post("/api/tasks", json={"title": "Completed 1", "status": "completed"}, headers=headers)

    res_pending = client.get("/api/tasks?status=pending", headers=headers)
    assert res_pending.status_code == 200
    pending_tasks = res_pending.json()
    assert len(pending_tasks) == 2
    assert all(t["status"] == "pending" for t in pending_tasks)

    res_completed = client.get("/api/tasks?status=completed", headers=headers)
    assert res_completed.status_code == 200
    completed_tasks = res_completed.json()
    assert len(completed_tasks) == 1
    assert completed_tasks[0]["status"] == "completed"


# ---------------------------------------------------------------------------
# 9. Priority filtering
# ---------------------------------------------------------------------------
def test_priority_filtering(client):
    headers, _ = create_user_and_get_token(client)
    client.post("/api/tasks", json={"title": "Low Task", "priority": "low"}, headers=headers)
    client.post("/api/tasks", json={"title": "Medium Task", "priority": "medium"}, headers=headers)
    client.post("/api/tasks", json={"title": "High Task", "priority": "high"}, headers=headers)

    res_high = client.get("/api/tasks?priority=high", headers=headers)
    assert res_high.status_code == 200
    high_tasks = res_high.json()
    assert len(high_tasks) == 1
    assert high_tasks[0]["priority"] == "high"


# ---------------------------------------------------------------------------
# 10. Search tasks by title
# ---------------------------------------------------------------------------
def test_task_search_by_title(client):
    headers, _ = create_user_and_get_token(client)
    client.post("/api/tasks", json={"title": "Deploy FastAPI to production"}, headers=headers)
    client.post("/api/tasks", json={"title": "Write unit tests for authentication"}, headers=headers)
    client.post("/api/tasks", json={"title": "Clean kitchen counter"}, headers=headers)

    res = client.get("/api/tasks?search=FastAPI", headers=headers)
    assert res.status_code == 200
    results = res.json()
    assert len(results) == 1
    assert results[0]["title"] == "Deploy FastAPI to production"

    # Search case-insensitivity
    res_lower = client.get("/api/tasks?search=fastapi", headers=headers)
    assert res_lower.status_code == 200
    assert len(res_lower.json()) == 1


# ---------------------------------------------------------------------------
# 11. Sorting
# ---------------------------------------------------------------------------
def test_task_sorting(client):
    headers, _ = create_user_and_get_token(client)
    client.post("/api/tasks", json={"title": "Alpha Task", "priority": "low"}, headers=headers)
    client.post("/api/tasks", json={"title": "Zeta Task", "priority": "high"}, headers=headers)
    client.post("/api/tasks", json={"title": "Beta Task", "priority": "medium"}, headers=headers)

    # Sort by title asc
    res_asc = client.get("/api/tasks?sort_by=title&sort_order=asc", headers=headers)
    titles_asc = [t["title"] for t in res_asc.json()]
    assert titles_asc == ["Alpha Task", "Beta Task", "Zeta Task"]

    # Sort by priority desc (high -> medium -> low)
    res_prio = client.get("/api/tasks?sort_by=priority&sort_order=desc", headers=headers)
    prios = [t["priority"] for t in res_prio.json()]
    assert prios == ["high", "medium", "low"]


# ---------------------------------------------------------------------------
# 12. Dashboard statistics
# ---------------------------------------------------------------------------
def test_dashboard_statistics(client):
    headers, _ = create_user_and_get_token(client)
    now = datetime.now(timezone.utc)

    # 1: completed, low priority
    client.post("/api/tasks", json={"title": "T1", "status": "completed", "priority": "low"}, headers=headers)
    # 2: pending, high priority, future due date (not overdue)
    client.post(
        "/api/tasks",
        json={"title": "T2", "status": "pending", "priority": "high", "due_date": (now + timedelta(days=3)).isoformat()},
        headers=headers,
    )
    # 3: pending, medium priority, past due date (overdue)
    client.post(
        "/api/tasks",
        json={"title": "T3", "status": "pending", "priority": "medium", "due_date": (now - timedelta(days=2)).isoformat()},
        headers=headers,
    )
    # 4: pending, high priority, past due date (overdue + high)
    client.post(
        "/api/tasks",
        json={"title": "T4", "status": "pending", "priority": "high", "due_date": (now - timedelta(hours=5)).isoformat()},
        headers=headers,
    )

    res = client.get("/api/dashboard/stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_tasks"] == 4
    assert stats["completed_tasks"] == 1
    assert stats["pending_tasks"] == 3
    assert stats["high_priority_tasks"] == 2
    assert stats["overdue_tasks"] == 2


# ---------------------------------------------------------------------------
# 13. Empty task list
# ---------------------------------------------------------------------------
def test_empty_task_list(client):
    headers, _ = create_user_and_get_token(client)

    res = client.get("/api/tasks", headers=headers)
    assert res.status_code == 200
    assert res.json() == []

    stats_res = client.get("/api/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_tasks"] == 0
    assert stats["completed_tasks"] == 0
    assert stats["pending_tasks"] == 0
    assert stats["high_priority_tasks"] == 0
    assert stats["overdue_tasks"] == 0


# ---------------------------------------------------------------------------
# 14. Invalid task ID
# ---------------------------------------------------------------------------
def test_invalid_task_id(client):
    headers, _ = create_user_and_get_token(client)
    invalid_id = 999999

    res_get = client.get(f"/api/tasks/{invalid_id}", headers=headers)
    assert res_get.status_code == 404

    res_put = client.put(f"/api/tasks/{invalid_id}", json={"title": "Update non-existent"}, headers=headers)
    assert res_put.status_code == 404

    res_patch = client.patch(f"/api/tasks/{invalid_id}/status", json={"status": "completed"}, headers=headers)
    assert res_patch.status_code == 404

    res_del = client.delete(f"/api/tasks/{invalid_id}", headers=headers)
    assert res_del.status_code == 404


# ---------------------------------------------------------------------------
# 15. Unauthorized access (no token)
# ---------------------------------------------------------------------------
def test_unauthorized_access(client):
    assert client.get("/api/tasks").status_code == 401
    assert client.post("/api/tasks", json={"title": "No Auth"}).status_code == 401
    assert client.get("/api/tasks/1").status_code == 401
    assert client.put("/api/tasks/1", json={"title": "No Auth"}).status_code == 401
    assert client.patch("/api/tasks/1/status", json={"status": "completed"}).status_code == 401
    assert client.delete("/api/tasks/1").status_code == 401
    assert client.get("/api/dashboard/stats").status_code == 401


# ---------------------------------------------------------------------------
# 16. Cross-user task access (ownership isolation)
# ---------------------------------------------------------------------------
def test_cross_user_task_access(client):
    headers_user1, _ = create_user_and_get_token(client)
    headers_user2, _ = create_user_and_get_token(client)

    # User 1 creates a private task
    task1 = client.post("/api/tasks", json={"title": "User 1 Secret Task"}, headers=headers_user1).json()
    task1_id = task1["id"]

    # User 2 attempts to GET User 1's task -> 403 Forbidden
    res_get = client.get(f"/api/tasks/{task1_id}", headers=headers_user2)
    assert res_get.status_code == 403

    # User 2 attempts to PUT User 1's task -> 403 Forbidden
    res_put = client.put(f"/api/tasks/{task1_id}", json={"title": "Hacked Title"}, headers=headers_user2)
    assert res_put.status_code == 403

    # User 2 attempts to PATCH User 1's task status -> 403 Forbidden
    res_patch = client.patch(f"/api/tasks/{task1_id}/status", json={"status": "completed"}, headers=headers_user2)
    assert res_patch.status_code == 403

    # User 2 attempts to DELETE User 1's task -> 403 Forbidden
    res_del = client.delete(f"/api/tasks/{task1_id}", headers=headers_user2)
    assert res_del.status_code == 403

    # User 2's task list must NOT contain User 1's task
    user2_list = client.get("/api/tasks", headers=headers_user2).json()
    assert not any(t["id"] == task1_id for t in user2_list)


# ---------------------------------------------------------------------------
# 17. Invalid request data (validation errors)
# ---------------------------------------------------------------------------
def test_invalid_request_data(client):
    headers, _ = create_user_and_get_token(client)

    # Empty title
    res_empty_title = client.post("/api/tasks", json={"title": ""}, headers=headers)
    assert res_empty_title.status_code == 422

    # Whitespace-only title
    res_ws_title = client.post("/api/tasks", json={"title": "   "}, headers=headers)
    assert res_ws_title.status_code == 422

    # Invalid status
    res_inv_status = client.post("/api/tasks", json={"title": "Task", "status": "invalid_status"}, headers=headers)
    assert res_inv_status.status_code == 422

    # Invalid priority
    res_inv_prio = client.post("/api/tasks", json={"title": "Task", "priority": "super_urgent"}, headers=headers)
    assert res_inv_prio.status_code == 422


# ---------------------------------------------------------------------------
# 18. Database failure / rollback safety
# ---------------------------------------------------------------------------
def test_database_transactions_and_isolation(client):
    headers, _ = create_user_and_get_token(client)

    # Creating valid task persists correctly
    res = client.post("/api/tasks", json={"title": "Transactional Task"}, headers=headers)
    assert res.status_code == 201
    task_id = res.json()["id"]

    # Updating with invalid data should fail validation and leave the existing task unchanged
    client.put(f"/api/tasks/{task_id}", json={"title": "   "}, headers=headers)
    check = client.get(f"/api/tasks/{task_id}", headers=headers).json()
    assert check["title"] == "Transactional Task"
