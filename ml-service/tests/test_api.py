"""Integration tests for FastAPI endpoints (/health and /predict)."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "disclaimer" in data


def test_predict_insufficient_data():
    # Only 3 data points, below minimum 5
    payload = {
        "entries": [
            {"mood": 3.0, "sleep_hours": 7.0, "day_of_week": 1},
            {"mood": 4.0, "sleep_hours": 8.0, "day_of_week": 2},
            {"mood": 3.5, "sleep_hours": 6.5, "day_of_week": 3}
        ]
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "insufficient_data"
    assert data["insights"] is None
    assert "Insufficient historical data" in data["message"]


def test_predict_sufficient_data_entries():
    payload = {
        "entries": [
            {"mood": 2.0, "sleep_hours": 5.0, "day_of_week": 1},
            {"mood": 2.5, "sleep_hours": 6.0, "day_of_week": 2},
            {"mood": 3.0, "sleep_hours": 7.0, "day_of_week": 3},
            {"mood": 4.0, "sleep_hours": 8.0, "day_of_week": 4},
            {"mood": 4.5, "sleep_hours": 8.5, "day_of_week": 5},
            {"mood": 5.0, "sleep_hours": 9.0, "day_of_week": 6}
        ]
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["insights"] is not None
    assert data["insights"]["trend"]["direction"] == "upward"
    assert data["insights"]["sleep_mood_relationship"]["relationship_type"] == "positive"
    assert "disclaimer" in data


def test_predict_sufficient_data_arrays():
    payload = {
        "recent_mood_values": [4.0, 4.0, 3.8, 3.9, 4.1, 4.0],
        "recent_sleep_values": [7.0, 7.5, 7.0, 7.2, 7.5, 7.0]
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["insights"]["trend"]["direction"] == "stable"
