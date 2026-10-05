import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime, timedelta

from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
from app.models.account import Account
from app.models.activity import Activity
from app.core.security import get_password_hash

from sqlalchemy.pool import StaticPool

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create companies
    c1 = Company(id=1, company_code="C1", name="Company 1")
    c2 = Company(id=2, company_code="C2", name="Company 2")
    db.add_all([c1, c2])
    db.commit()
    
    # Create users
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    u_ca1 = Employee(id=2, employee_code="CA1", name="CA1", email="ca1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=1, designation="CA", date_of_joining=d, status="Active")
    u_e1 = Employee(id=3, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=2, date_of_joining=d, status="Active")
    u_e2 = Employee(id=4, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=3, date_of_joining=d, status="Active")

    db.add_all([u_sa, u_ca1, u_e1, u_e2])
    db.commit()

    # Create Account
    a1 = Account(id=1, code="A1", name="Account 1", company_id=1, owner_id=3, status="Active")
    db.add(a1)
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]


def test_create_activity(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    
    data = {
        "activity_type": "Call",
        "subject": "Follow up call",
        "account_id": 1,
        "assigned_employee_id": 3,
        "due_date": future_date,
        "status": "Scheduled"
    }
    
    resp = client.post("/api/activities/", json=data, headers=headers)
    assert resp.status_code == 200, resp.text
    assert resp.json()["subject"] == "Follow up call"
    
def test_create_activity_past_date_fails(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    past_date = (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z"
    data = {
        "activity_type": "Call",
        "account_id": 1,
        "assigned_employee_id": 3,
        "due_date": past_date,
        "status": "Scheduled"
    }
    resp = client.post("/api/activities/", json=data, headers=headers)
    assert resp.status_code == 400
    assert "future" in resp.json()["detail"].lower()

def test_update_completed_activity_fails(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "activity_type": "Call",
        "account_id": 1,
        "assigned_employee_id": 3,
        "due_date": future_date,
        "status": "Scheduled"
    }
    resp = client.post("/api/activities/", json=data, headers=headers)
    assert resp.status_code == 200
    act_id = resp.json()["id"]
    
    # Mark as completed
    resp = client.put(f"/api/activities/{act_id}", json={"status": "Completed"}, headers=headers)
    assert resp.status_code == 200
    
    # Try to edit it again
    resp = client.put(f"/api/activities/{act_id}", json={"subject": "Should fail"}, headers=headers)
    assert resp.status_code == 400
    assert "completed activity" in resp.json()["detail"].lower()

def test_cancelled_reopen_fails(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "activity_type": "Email",
        "account_id": 1,
        "assigned_employee_id": 3,
        "due_date": future_date,
        "status": "Scheduled"
    }
    resp = client.post("/api/activities/", json=data, headers=headers)
    assert resp.status_code == 200
    act_id = resp.json()["id"]
    
    # Mark as cancelled
    resp = client.put(f"/api/activities/{act_id}", json={"status": "Cancelled"}, headers=headers)
    assert resp.status_code == 200
    
    # Try to reopen
    resp = client.put(f"/api/activities/{act_id}", json={"status": "Scheduled"}, headers=headers)
    assert resp.status_code == 400
    assert "reopen" in resp.json()["detail"].lower()

def test_idor_protection(setup_db):
    # Admin creates an activity assigned to Employee 1
    admin_token = get_token("ca1@test.com")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    resp = client.post("/api/activities/", json={
        "activity_type": "Call",
        "account_id": 1,
        "assigned_employee_id": 3,
        "due_date": future_date,
        "status": "Scheduled"
    }, headers=admin_headers)
    act_id = resp.json()["id"]
    
    # Employee 2 (different employee) tries to update Employee 1's activity
    emp_token = get_token("e2@test.com")
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    
    put_resp = client.put(f"/api/activities/{act_id}", json={"subject": "Malicious edit"}, headers=emp_headers)
    assert put_resp.status_code == 403
    
    get_resp = client.get(f"/api/activities/{act_id}", headers=emp_headers)
    assert get_resp.status_code == 403


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
