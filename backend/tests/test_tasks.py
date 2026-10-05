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
from app.models.task import Task
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
    u_m1 = Employee(id=5, employee_code="M1", name="M1", email="m1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="M", date_of_joining=d, status="Active")
    u_e1 = Employee(id=3, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Active")
    u_e2 = Employee(id=4, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Active")
    u_e_inactive = Employee(id=6, employee_code="E_INACTIVE", name="EI", email="ei@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Inactive")

    db.add_all([u_sa, u_ca1, u_m1, u_e1, u_e2, u_e_inactive])
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


def test_create_task(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    
    data = {
        "title": "New Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 3,
        "priority": "High",
        "due_date": future_date
    }
    
    resp = client.post("/api/tasks/", json=data, headers=headers)
    assert resp.status_code == 201, resp.text
    assert resp.json()["title"] == "New Task"
    assert resp.json()["status"] == "Open"

def test_create_task_past_date_fails(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    past_date = (datetime.utcnow() - timedelta(days=2)).isoformat() + "Z"
    data = {
        "title": "New Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 3,
        "priority": "Medium",
        "due_date": past_date
    }
    resp = client.post("/api/tasks/", json=data, headers=headers)
    assert resp.status_code == 400
    assert "future" in resp.json()["detail"].lower()

def test_assign_inactive_employee_fails(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "title": "New Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 6,  # Inactive
        "priority": "Medium",
        "due_date": future_date
    }
    resp = client.post("/api/tasks/", json=data, headers=headers)
    assert resp.status_code == 400
    assert "inactive" in resp.json()["detail"].lower()

def test_employee_assign_other_fails(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "title": "New Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 4,  # E2
        "priority": "Medium",
        "due_date": future_date
    }
    resp = client.post("/api/tasks/", json=data, headers=headers)
    assert resp.status_code == 403

def test_task_completion_and_lockdown(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "title": "Lockdown Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 3,
        "priority": "Medium",
        "due_date": future_date
    }
    resp = client.post("/api/tasks/", json=data, headers=headers)
    assert resp.status_code == 201
    task_id = resp.json()["id"]
    
    resp = client.patch(f"/api/tasks/{task_id}/complete", json={"completion_remarks": "Done"}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "Completed"
    
    # Try to edit
    resp = client.put(f"/api/tasks/{task_id}", json={"title": "Should fail"}, headers=headers)
    assert resp.status_code == 400
    assert "locked" in resp.json()["detail"].lower()

def test_task_cancel_and_reopen_fails(setup_db):
    # Setup by manager to bypass employee cancel block
    manager_token = get_token("m1@test.com")
    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    
    data = {
        "title": "Cancel Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 3,
        "priority": "Low",
        "due_date": future_date
    }
    resp = client.post("/api/tasks/", json=data, headers=manager_headers)
    assert resp.status_code == 201
    task_id = resp.json()["id"]
    
    # Manager cancels task
    resp = client.patch(f"/api/tasks/{task_id}/cancel", headers=manager_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "Cancelled"
    
    # Try to reopen/edit
    resp = client.put(f"/api/tasks/{task_id}", json={"title": "Should fail"}, headers=manager_headers)
    assert resp.status_code == 400

def test_idor_protection(setup_db):
    token1 = get_token("e1@test.com")
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "title": "E1 Task",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 3,
        "priority": "Medium",
        "due_date": future_date
    }
    resp = client.post("/api/tasks/", json=data, headers=headers1)
    task_id = resp.json()["id"]
    
    token2 = get_token("e2@test.com")
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    get_resp = client.get(f"/api/tasks/{task_id}", headers=headers2)
    assert get_resp.status_code == 403
    
    put_resp = client.put(f"/api/tasks/{task_id}", json={"title": "Hack"}, headers=headers2)
    assert put_resp.status_code == 403

def test_delete_permissions(setup_db):
    admin_token = get_token("ca1@test.com")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    future_date = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
    data = {
        "title": "To Delete",
        "related_module": "Account",
        "related_record_id": 1,
        "assigned_to_id": 3,
        "priority": "Low",
        "due_date": future_date
    }
    resp = client.post("/api/tasks/", json=data, headers=admin_headers)
    task_id = resp.json()["id"]
    
    # CA tries to delete (should fail)
    del_resp = client.delete(f"/api/tasks/{task_id}", headers=admin_headers)
    assert del_resp.status_code == 403
    
    # Super admin tries to delete (should succeed)
    sa_token = get_token("sa@test.com")
    sa_headers = {"Authorization": f"Bearer {sa_token}"}
    del_resp = client.delete(f"/api/tasks/{task_id}", headers=sa_headers)
    assert del_resp.status_code == 204


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
