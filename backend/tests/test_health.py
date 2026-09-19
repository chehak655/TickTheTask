def test_health_endpoint_exact_response(client):
    """Verify that GET /api/health returns status 200 and exact JSON {'status': 'ok'}."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_detailed_health_endpoint_db_status(client):
    """Verify that GET /api/health/details confirms live database connectivity."""
    response = client.get("/api/health/details")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["service"] == "TaskFlow API"
