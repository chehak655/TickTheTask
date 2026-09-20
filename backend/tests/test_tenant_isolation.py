import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_tenant_isolation(client_user1, client_user2, task_user1):
    # User 1 should see the task
    response = await client_user1.get(f"/api/tasks/{task_user1.id}")
    assert response.status_code == 200
    
    # User 2 should NOT see the task
    response = await client_user2.get(f"/api/tasks/{task_user1.id}")
    assert response.status_code == 404
