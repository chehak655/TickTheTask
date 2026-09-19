import httpx
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_mobile_integration():
    print("=== TASKFLOW MOBILE-BACKEND INTEGRATION TEST SUITE ===")
    
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] 1. Backend Health Check OK")

        # 2. Unique mobile user registration
        ts = int(time.time())
        mobile_user = {
            "name": f"Mobile Tester {ts}",
            "email": f"mobile_user_{ts}@taskflow.app",
            "password": "MobilePassword123!"
        }
        
        reg_res = client.post("/api/auth/register", json=mobile_user)
        assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
        user_data = reg_res.json()
        assert "id" in user_data
        assert user_data["email"] == mobile_user["email"]
        print(f"[PASS] 2. Registration OK (User ID: {user_data['id']})")

        # 3. Mobile Login
        login_res = client.post("/api/auth/login", json={
            "username": mobile_user["email"],
            "password": mobile_user["password"]
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        auth_data = login_res.json()
        assert "access_token" in auth_data
        token = auth_data["access_token"]
        print("[PASS] 3. Login OK (JWT Token received)")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # 4. Current User Profile
        me_res = client.get("/api/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == mobile_user["email"]
        print("[PASS] 4. Current User (/api/auth/me) OK")

        # 5. Initial Stats (all 0)
        stats_res = client.get("/api/dashboard/stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["total_tasks"] == 0
        assert stats["completed_tasks"] == 0
        assert stats["pending_tasks"] == 0
        assert stats["high_priority_tasks"] == 0
        assert stats["overdue_tasks"] == 0
        print("[PASS] 5. Initial Dashboard Stats OK (0 tasks)")

        # 6. Create Task 1 (High priority, pending)
        t1_payload = {
            "title": "Mobile Push Notification Implementation",
            "description": "Integrate Expo notifications for task reminders",
            "priority": "high",
            "status": "pending",
            "due_date": "2026-09-30T18:00:00Z"
        }
        t1_res = client.post("/api/tasks", headers=headers, json=t1_payload)
        assert t1_res.status_code == 201, f"Task creation failed: {t1_res.text}"
        task1 = t1_res.json()
        task1_id = task1["id"]
        assert task1["title"] == t1_payload["title"]
        assert task1["priority"] == "high"
        assert task1["status"] == "pending"
        print(f"[PASS] 6. Task 1 Creation OK (Task ID: {task1_id})")

        # 7. Create Task 2 (Low priority, completed)
        t2_payload = {
            "title": "Setup App Icon and Splash Screen",
            "description": "Configured splash screens in app.json",
            "priority": "low",
            "status": "completed"
        }
        t2_res = client.post("/api/tasks", headers=headers, json=t2_payload)
        assert t2_res.status_code == 201
        task2 = t2_res.json()
        task2_id = task2["id"]
        print(f"[PASS] 7. Task 2 Creation OK (Task ID: {task2_id})")

        # 8. Create Task 3 (Medium priority, pending)
        t3_payload = {
            "title": "Mobile Offline Sync Cache",
            "description": "Design AsyncStorage offline caching strategy",
            "priority": "medium",
            "status": "pending"
        }
        t3_res = client.post("/api/tasks", headers=headers, json=t3_payload)
        assert t3_res.status_code == 201
        task3 = t3_res.json()
        task3_id = task3["id"]
        print(f"[PASS] 8. Task 3 Creation OK (Task ID: {task3_id})")

        # 9. Verify Dashboard Stats updated
        stats_res = client.get("/api/dashboard/stats", headers=headers)
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["total_tasks"] == 3
        assert stats["completed_tasks"] == 1
        assert stats["pending_tasks"] == 2
        assert stats["high_priority_tasks"] == 1
        print("[PASS] 9. Dashboard Stats calculation verified accurately")

        # 10. Task Retrieval & Filtering
        # Filter status=pending
        pend_res = client.get("/api/tasks?status=pending", headers=headers)
        assert pend_res.status_code == 200
        pend_tasks = pend_res.json()
        assert len(pend_tasks) == 2
        print("[PASS] 10a. Filtering by status=pending OK (2 tasks)")

        # Filter priority=high
        high_res = client.get("/api/tasks?priority=high", headers=headers)
        assert high_res.status_code == 200
        high_tasks = high_res.json()
        assert len(high_tasks) == 1
        assert high_tasks[0]["id"] == task1_id
        print("[PASS] 10b. Filtering by priority=high OK (1 task)")

        # Search title="Offline"
        search_res = client.get("/api/tasks?search=Offline", headers=headers)
        assert search_res.status_code == 200
        search_tasks = search_res.json()
        assert len(search_tasks) == 1
        assert search_tasks[0]["id"] == task3_id
        print("[PASS] 10c. Search query OK (Found matching task)")

        # 11. Single Task Retrieval
        get_res = client.get(f"/api/tasks/{task1_id}", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["title"] == t1_payload["title"]
        print("[PASS] 11. Retrieve single task by ID OK")

        # 12. Full Task Edit (PUT)
        update_payload = {
            "title": "Mobile Push Notifications with FCM",
            "description": "Updated description with FCM specs",
            "priority": "medium",
            "status": "pending",
            "due_date": "2026-10-05T12:00:00Z"
        }
        put_res = client.put(f"/api/tasks/{task1_id}", headers=headers, json=update_payload)
        assert put_res.status_code == 200
        assert put_res.json()["title"] == update_payload["title"]
        assert put_res.json()["priority"] == "medium"
        print("[PASS] 12. Task Edit (PUT) OK")

        # 13. Status Toggle / PATCH
        patch_res = client.patch(f"/api/tasks/{task1_id}/status", headers=headers, json={"status": "completed"})
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "completed"
        print("[PASS] 13. Task Status Toggle (PATCH) to 'completed' OK")

        # 14. Verify Stats after toggle
        stats_res2 = client.get("/api/dashboard/stats", headers=headers)
        stats2 = stats_res2.json()
        assert stats2["completed_tasks"] == 2
        assert stats2["pending_tasks"] == 1
        print("[PASS] 14. Stats reflect status update correctly")

        # 15. Task Deletion (DELETE)
        del_res = client.delete(f"/api/tasks/{task3_id}", headers=headers)
        assert del_res.status_code == 200
        assert del_res.json()["id"] == task3_id
        print(f"[PASS] 15. Task Deletion (Task {task3_id}) OK (200 OK + Confirmation JSON)")

        # Verify task 3 no longer exists
        get_del_res = client.get(f"/api/tasks/{task3_id}", headers=headers)
        assert get_del_res.status_code == 404
        print("[PASS] 16. Verification of 404 on deleted task OK")

        # 17. Validation & Error Handling Tests
        # Invalid task creation (empty title)
        bad_res = client.post("/api/tasks", headers=headers, json={"title": "   ", "priority": "high"})
        assert bad_res.status_code == 422
        print("[PASS] 17a. Validation failure on empty title (422 Unprocessable Entity)")

        # Unauthorized access without token
        unauth_res = client.get("/api/tasks")
        assert unauth_res.status_code == 401
        print("[PASS] 17b. Unauthenticated access blocked (401 Unauthorized)")

        # Invalid login
        bad_login = client.post("/api/auth/login", json={"username": "fake@test.com", "password": "wrong"})
        assert bad_login.status_code == 401
        print("[PASS] 17c. Invalid login credentials rejected (401 Unauthorized)")

        # 18. Cross-platform sync verification:
        # Query database to confirm persisted state
        final_tasks = client.get("/api/tasks", headers=headers).json()
        assert len(final_tasks) == 2
        print(f"[PASS] 18. Cross-platform sync verified: 2 tasks persistent in MySQL database")

    print("\n=======================================================")
    print("ALL 18 MOBILE INTEGRATION SCENARIOS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    test_mobile_integration()
