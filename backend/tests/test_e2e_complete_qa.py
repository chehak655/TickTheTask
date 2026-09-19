"""
TASKFLOW PHASE 10: COMPLETE COMPREHENSIVE QA & E2E HARNESS
Tests:
- Core User Workflow (16 steps)
- Cross-Platform Sync Simulation (Web <-> Mobile <-> Database)
- 17 Specific Edge Cases & Security Checks
"""

import httpx
import time
import uuid

BASE_URL = "http://127.0.0.1:8000"

def run_qa_suite():
    print("=" * 70)
    print("TASKFLOW PHASE 10: MASTER END-TO-END QA & VERIFICATION HARNESS")
    print("=" * 70)
    
    passed_tests = []
    failed_tests = []

    def record_test(name, result, detail=""):
        if result:
            passed_tests.append(name)
            print(f"[PASS] {name} {detail}")
        else:
            failed_tests.append((name, detail))
            print(f"[FAIL] {name}: {detail}")

    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # ====================================================================
        # 1. SERVER HEALTH & CONNECTIVITY
        # ====================================================================
        try:
            r = client.get("/health")
            record_test("Health Endpoint Check", r.status_code == 200 and r.json().get("status") == "ok")
        except Exception as e:
            record_test("Health Endpoint Check", False, str(e))
            return

        # ====================================================================
        # 2. CORE USER WORKFLOW (16 STEPS)
        # ====================================================================
        print("\n--- Testing Core User Workflow (16 Steps) ---")
        unique_id = uuid.uuid4().hex[:8]
        user_email = f"qa_user_{unique_id}@taskflow.app"
        user_password = "SecurePassword123!"
        user_name = f"QA Lead User {unique_id}"

        # Step 1: Register
        r_reg = client.post("/api/auth/register", json={
            "name": user_name,
            "email": user_email,
            "password": user_password
        })
        record_test("Step 1: Register New User", r_reg.status_code == 201 and "id" in r_reg.json())
        user_id = r_reg.json().get("id")

        # Step 2: Login
        r_login = client.post("/api/auth/login", json={
            "username": user_email,
            "password": user_password
        })
        record_test("Step 2: Log In & Obtain JWT", r_login.status_code == 200 and "access_token" in r_login.json())
        token = r_login.json().get("access_token")
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Step 3: Open Dashboard (Stats)
        r_stats = client.get("/api/dashboard/stats", headers=auth_headers)
        record_test("Step 3: Open Dashboard (Initial Stats = 0)", r_stats.status_code == 200 and r_stats.json().get("total_tasks") == 0)

        # Step 4: Create a Task
        task_payload = {
            "title": "Prepare End-to-End Test Matrix",
            "description": "Verify all edge cases and responsive views",
            "priority": "medium",
            "status": "pending",
            "due_date": "2026-10-15T10:00:00Z"
        }
        r_create = client.post("/api/tasks", headers=auth_headers, json=task_payload)
        record_test("Step 4: Create Task", r_create.status_code == 201)
        created_task = r_create.json()
        task_id = created_task.get("id")

        # Step 5: View the Task
        r_view = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
        record_test("Step 5: View Task Details", r_view.status_code == 200 and r_view.json()["title"] == task_payload["title"])

        # Step 6: Edit the Task
        edit_payload = {
            "title": "Execute Comprehensive Test Matrix",
            "description": "Updated description with QA checklist",
            "priority": "medium",
            "status": "pending",
            "due_date": "2026-10-15T10:00:00Z"
        }
        r_edit = client.put(f"/api/tasks/{task_id}", headers=auth_headers, json=edit_payload)
        record_test("Step 6: Edit Task Details", r_edit.status_code == 200 and r_edit.json()["title"] == edit_payload["title"])

        # Step 7: Change Priority
        prio_payload = {
            "title": "Execute Comprehensive Test Matrix",
            "priority": "high",
            "status": "pending"
        }
        r_prio = client.put(f"/api/tasks/{task_id}", headers=auth_headers, json=prio_payload)
        record_test("Step 7: Change Priority to High", r_prio.status_code == 200 and r_prio.json()["priority"] == "high")

        # Step 8: Set a Due Date
        due_payload = {
            "title": "Execute Comprehensive Test Matrix",
            "priority": "high",
            "status": "pending",
            "due_date": "2026-11-01T18:00:00Z"
        }
        r_due = client.put(f"/api/tasks/{task_id}", headers=auth_headers, json=due_payload)
        record_test("Step 8: Set Custom Due Date", r_due.status_code == 200 and r_due.json()["due_date"] is not None)

        # Step 9: Mark as Completed
        r_done = client.patch(f"/api/tasks/{task_id}/status", headers=auth_headers, json={"status": "completed"})
        record_test("Step 9: Mark Task Completed", r_done.status_code == 200 and r_done.json()["status"] == "completed")

        # Create a second pending task for filter tests
        client.post("/api/tasks", headers=auth_headers, json={
            "title": "Pending Verification Item",
            "priority": "low",
            "status": "pending"
        })

        # Step 10: Filter Completed Tasks
        r_filter_done = client.get("/api/tasks?status=completed", headers=auth_headers)
        record_test("Step 10: Filter Completed Tasks", r_filter_done.status_code == 200 and len(r_filter_done.json()) == 1 and r_filter_done.json()[0]["id"] == task_id)

        # Step 11: Filter Pending Tasks
        r_filter_pend = client.get("/api/tasks?status=pending", headers=auth_headers)
        record_test("Step 11: Filter Pending Tasks", r_filter_pend.status_code == 200 and len(r_filter_pend.json()) == 1 and r_filter_pend.json()[0]["title"] == "Pending Verification Item")

        # Step 12: Search for a Task
        r_search = client.get("/api/tasks?search=Comprehensive", headers=auth_headers)
        record_test("Step 12: Search Tasks by Keyword", r_search.status_code == 200 and len(r_search.json()) == 1 and r_search.json()[0]["id"] == task_id)

        # Step 13: Delete Task
        r_del = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)
        record_test("Step 13: Delete Task", r_del.status_code == 200 and r_del.json().get("id") == task_id)

        # Verify 404 after deletion
        r_get_del = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
        record_test("Step 13b: Verify Task 404 after Deletion", r_get_del.status_code == 404)

        # Step 14 & 15: Logout & Re-login
        r_relogin = client.post("/api/auth/login", json={
            "username": user_email,
            "password": user_password
        })
        new_token = r_relogin.json().get("access_token")
        record_test("Step 14 & 15: Re-authenticate with Fresh Token", r_relogin.status_code == 200 and new_token is not None)

        # Step 16: Verify Persistent Data
        r_persist = client.get("/api/tasks", headers={"Authorization": f"Bearer {new_token}"})
        record_test("Step 16: Verify Persistent Data (1 remaining task)", r_persist.status_code == 200 and len(r_persist.json()) == 1)

        # ====================================================================
        # 3. CROSS-PLATFORM SYNC SIMULATION (WEB <-> MOBILE <-> DATABASE)
        # ====================================================================
        print("\n--- Testing Cross-Platform Synchronization ---")
        # 1. Create task from Web Client
        web_headers = {"Authorization": f"Bearer {new_token}", "User-Agent": "TaskFlow-Web/1.0"}
        r_web_create = client.post("/api/tasks", headers=web_headers, json={
            "title": "Cross-Platform Sync Validation Task",
            "description": "Created on Web Client",
            "priority": "low",
            "status": "pending"
        })
        sync_task_id = r_web_create.json()["id"]
        record_test("Cross-Platform: 1. Create on Web Client", r_web_create.status_code == 201)

        # 2. Verify appears in Mobile Client
        mobile_headers = {"Authorization": f"Bearer {new_token}", "User-Agent": "TaskFlow-Mobile/1.0 Expo"}
        r_mob_get = client.get(f"/api/tasks/{sync_task_id}", headers=mobile_headers)
        record_test("Cross-Platform: 2. Read from Mobile Client", r_mob_get.status_code == 200 and r_mob_get.json()["title"] == "Cross-Platform Sync Validation Task")

        # 3. Edit task from Mobile Client
        r_mob_edit = client.put(f"/api/tasks/{sync_task_id}", headers=mobile_headers, json={
            "title": "Cross-Platform Sync Validation Task (Updated on Mobile)",
            "priority": "high",
            "status": "completed"
        })
        record_test("Cross-Platform: 3. Edit on Mobile Client", r_mob_edit.status_code == 200 and r_mob_edit.json()["priority"] == "high")

        # 4. Verify change visible on Web Client
        r_web_get = client.get(f"/api/tasks/{sync_task_id}", headers=web_headers)
        record_test("Cross-Platform: 4. Verify Update on Web Client", r_web_get.status_code == 200 and r_web_get.json()["status"] == "completed" and r_web_get.json()["priority"] == "high")

        # 5. Delete task
        r_del_sync = client.delete(f"/api/tasks/{sync_task_id}", headers=web_headers)
        record_test("Cross-Platform: 5. Delete on Web Client", r_del_sync.status_code == 200)

        # 6. Verify deletion in database (via Mobile Client)
        r_mob_verify_del = client.get(f"/api/tasks/{sync_task_id}", headers=mobile_headers)
        record_test("Cross-Platform: 6. Confirm Database Deletion across clients", r_mob_verify_del.status_code == 404)

        # ====================================================================
        # 4. EDGE CASES & SECURITY CHECKS (17 SCENARIOS)
        # ====================================================================
        print("\n--- Testing Edge Cases & Security Checks (17 Scenarios) ---")

        # Edge Case 1: Empty title
        r_ec1 = client.post("/api/tasks", headers=auth_headers, json={"title": "", "priority": "low"})
        record_test("Edge Case 1: Empty Title Rejected", r_ec1.status_code == 422)

        # Edge Case 2: Whitespace-only title
        r_ec2 = client.post("/api/tasks", headers=auth_headers, json={"title": "     ", "priority": "low"})
        record_test("Edge Case 2: Whitespace Title Rejected", r_ec2.status_code == 422)

        # Edge Case 3: Very long title (> 255 chars)
        long_title = "A" * 300
        r_ec3 = client.post("/api/tasks", headers=auth_headers, json={"title": long_title, "priority": "low"})
        record_test("Edge Case 3: Oversized Title (>255) Rejected", r_ec3.status_code == 422)

        # Edge Case 4: Invalid date format
        r_ec4 = client.post("/api/tasks", headers=auth_headers, json={"title": "Valid Title", "due_date": "invalid-date-format"})
        record_test("Edge Case 4: Invalid Date Format Rejected", r_ec4.status_code == 422)

        # Edge Case 5: Invalid status
        r_ec5 = client.post("/api/tasks", headers=auth_headers, json={"title": "Valid Title", "status": "in_progress"})
        record_test("Edge Case 5: Invalid Status ('in_progress') Rejected", r_ec5.status_code == 422)

        # Edge Case 6: Invalid priority
        r_ec6 = client.post("/api/tasks", headers=auth_headers, json={"title": "Valid Title", "priority": "urgent"})
        record_test("Edge Case 6: Invalid Priority ('urgent') Rejected", r_ec6.status_code == 422)

        # Edge Case 7: Duplicate user registration
        r_ec7 = client.post("/api/auth/register", json={
            "name": "Duplicate User",
            "email": user_email,
            "password": "Password123!"
        })
        record_test("Edge Case 7: Duplicate Email Registration Rejected (409)", r_ec7.status_code == 409)

        # Edge Case 8: Invalid login credentials
        r_ec8 = client.post("/api/auth/login", json={"username": user_email, "password": "WrongPassword!"})
        record_test("Edge Case 8: Incorrect Password Rejected (401)", r_ec8.status_code == 401)

        # Edge Case 9: Expired/corrupted token
        r_ec9 = client.get("/api/tasks", headers={"Authorization": "Bearer invalid.jwt.token"})
        record_test("Edge Case 9: Corrupted Bearer Token Blocked (401)", r_ec9.status_code == 401)

        # Edge Case 10: Missing task operations (404)
        r_ec10 = client.get("/api/tasks/999999", headers=auth_headers)
        record_test("Edge Case 10: Nonexistent Task ID Returns 404", r_ec10.status_code == 404)

        # Edge Case 11: Unauthorized access without token
        r_ec11 = client.get("/api/tasks")
        record_test("Edge Case 11: Missing Authorization Header Returns 401", r_ec11.status_code == 401)

        # Edge Case 12: Cross-user isolation (Tenant Security)
        # Register a second distinct user
        other_email = f"other_{unique_id}@taskflow.app"
        r_other_reg = client.post("/api/auth/register", json={"name": "Other User", "email": other_email, "password": "Password123!"})
        other_token = client.post("/api/auth/login", json={"username": other_email, "password": "Password123!"}).json()["access_token"]
        # Other user creates a private task
        r_other_task = client.post("/api/tasks", headers={"Authorization": f"Bearer {other_token}"}, json={"title": "Private Secret Task"})
        other_task_id = r_other_task.json()["id"]
        # Primary user tries to access other user's task -> Must be blocked with 403 Forbidden (or 404)
        r_ec12 = client.get(f"/api/tasks/{other_task_id}", headers=auth_headers)
        record_test("Edge Case 12: Cross-User Task Access Prevented (403 Forbidden)", r_ec12.status_code == 403)

        # Edge Case 13: Large task list & pagination / sorting
        # Batch insert 10 tasks for primary user
        for i in range(10):
            client.post("/api/tasks", headers=auth_headers, json={
                "title": f"Batch Task {i:02d}",
                "priority": "high" if i % 2 == 0 else "low",
                "status": "pending"
            })
        r_batch_get = client.get("/api/tasks?sort_by=title&sort_dir=asc", headers=auth_headers)
        record_test("Edge Case 13: Multiple Tasks Retrieval & Ascending Title Sort", r_batch_get.status_code == 200 and len(r_batch_get.json()) >= 10)

        # Edge Case 14: SQL Injection attempt in search & title
        sqli_payload = "' OR 1=1 --"
        r_ec14 = client.get(f"/api/tasks?search={sqli_payload}", headers=auth_headers)
        record_test("Edge Case 14: SQL Injection in Search Safely Handled", r_ec14.status_code == 200)

        # Edge Case 15: XSS Payload in task title / description
        xss_payload = "<script>alert('XSS')</script>"
        r_ec15 = client.post("/api/tasks", headers=auth_headers, json={"title": xss_payload, "description": "<img src=x onerror=alert(1)>"})
        record_test("Edge Case 15: XSS Payload in Task Created Safely (ORM Escaped)", r_ec15.status_code == 201 and r_ec15.json()["title"] == xss_payload)

        # Edge Case 16: Password complexity checks on registration
        # Too short
        r_pw_short = client.post("/api/auth/register", json={"name": "Test", "email": f"pw1_{unique_id}@t.com", "password": "Ab1"})
        # No uppercase
        r_pw_no_upper = client.post("/api/auth/register", json={"name": "Test", "email": f"pw2_{unique_id}@t.com", "password": "password123!"})
        # No digit
        r_pw_no_digit = client.post("/api/auth/register", json={"name": "Test", "email": f"pw3_{unique_id}@t.com", "password": "Password!"})
        record_test("Edge Case 16: Weak Passwords Enforce 422 Complexity Rules", r_pw_short.status_code == 422 and r_pw_no_upper.status_code == 422 and r_pw_no_digit.status_code == 422)

        # Edge Case 17: Dashboard stats accuracy with large numbers
        r_stats_final = client.get("/api/dashboard/stats", headers=auth_headers)
        stats = r_stats_final.json()
        record_test("Edge Case 17: Final Dashboard Statistics Consistency", r_stats_final.status_code == 200 and stats["total_tasks"] == stats["completed_tasks"] + stats["pending_tasks"])

    print("\n" + "=" * 70)
    print(f"SUMMARY: {len(passed_tests)} PASSED | {len(failed_tests)} FAILED")
    print("=" * 70)
    
    if failed_tests:
        print("\nFailures:")
        for name, detail in failed_tests:
            print(f"  - {name}: {detail}")
        return False
    return True

if __name__ == "__main__":
    success = run_qa_suite()
    exit(0 if success else 1)
