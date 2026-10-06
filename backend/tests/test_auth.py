import pytest

def test_login_success(client, test_data):
    response = client.post(
        "/api/auth/login",
        json={"email": test_data["emp_a1"].email, "password": "testpass"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_password(client, test_data):
    response = client.post(
        "/api/auth/login",
        json={"email": test_data["emp_a1"].email, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_unknown_user(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "unknown@test.com", "password": "testpass"},
    )
    assert response.status_code == 401

def test_login_missing_credentials(client):
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 422 # FastAPI validation error

def test_access_without_token(client):
    response = client.get("/api/leads/")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"

def test_login_inactive_user(client, test_data, db_session):
    emp = test_data["emp_a1"]
    emp.status = "Inactive"
    db_session.commit()
    
    response = client.post(
        "/api/auth/login",
        json={"email": emp.email, "password": "testpass"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"
