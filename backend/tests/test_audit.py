import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
from app.models.audit_log import AuditLog
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
    db.add(c1)
    db.commit()
    
    # Create users
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    u_ca1 = Employee(id=2, employee_code="CA1", name="CA1", email="ca1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=1, designation="CA", date_of_joining=d, status="Active")

    db.add_all([u_sa, u_ca1])
    db.commit()
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db

def test_audit_create(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    company_data = {
        "company_code": "AUD-001",
        "name": "Audit Company",
        "email": "audit@example.com",
        "contact_number": "1234567890",
        "industry": "IT"
    }
    r = client.post("/api/companies/", headers=headers, json=company_data)
    assert r.status_code == 200
    company_id = r.json()["id"]

    db = TestingSessionLocal()
    audit_logs = db.query(AuditLog).filter(
        AuditLog.module == "Company",
        AuditLog.record_id == company_id,
        AuditLog.action == "CREATE"
    ).all()
    
    assert len(audit_logs) == 1
    log = audit_logs[0]
    assert log.action == "CREATE"
    assert log.new_value is not None
    assert "Audit Company" in log.new_value
    assert log.previous_value is None
    db.close()

def test_audit_update(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    company_data = {
        "company_code": "AUD-002",
        "name": "Audit Company 2",
        "email": "audit2@example.com",
        "contact_number": "1234567890"
    }
    r = client.post("/api/companies/", headers=headers, json=company_data)
    company_id = r.json()["id"]

    update_data = {"name": "Audit Company Updated", "contact_number": "123"}
    r = client.put(f"/api/companies/{company_id}", headers=headers, json=update_data)
    assert r.status_code == 200

    db = TestingSessionLocal()
    audit_logs = db.query(AuditLog).filter(
        AuditLog.module == "Company",
        AuditLog.record_id == company_id,
        AuditLog.action == "UPDATE"
    ).all()
    
    assert len(audit_logs) == 1
    log = audit_logs[0]
    assert log.action == "UPDATE"
    assert log.previous_value is not None
    assert "Audit Company 2" in log.previous_value
    assert "Audit Company Updated" in log.new_value
    db.close()

def test_audit_delete_via_deactivate(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    company_data = {
        "company_code": "AUD-003",
        "name": "Audit Company 3",
        "email": "audit3@example.com",
        "contact_number": "1234567890"
    }
    r = client.post("/api/companies/", headers=headers, json=company_data)
    company_id = r.json()["id"]

    update_data = {"status": "Inactive"}
    r = client.put(f"/api/companies/{company_id}", headers=headers, json=update_data)
    assert r.status_code == 200

    db = TestingSessionLocal()
    audit_logs = db.query(AuditLog).filter(
        AuditLog.module == "Company",
        AuditLog.record_id == company_id,
        AuditLog.action == "UPDATE"
    ).all()
    
    # We should have an update for the status change
    found = any("Inactive" in log.new_value for log in audit_logs if log.new_value)
    assert found
    db.close()

def test_audit_api_endpoint(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    r = client.get("/api/audit/", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_audit_transaction_rollback(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    company_data = {
        "company_code": "C1", # Already exists
        "name": "Audit Company Rollback",
        "email": "rollback@example.com",
    }
    r = client.post("/api/companies/", headers=headers, json=company_data)
    assert r.status_code == 400
    
    db = TestingSessionLocal()
    audit_logs = db.query(AuditLog).filter(
        AuditLog.module == "Company",
        AuditLog.action == "CREATE"
    ).all()
    
    found = any("Audit Company Rollback" in log.new_value for log in audit_logs if log.new_value)
    assert not found
    db.close()
