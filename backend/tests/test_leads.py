import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date

from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
from app.models.lead import Lead
from app.core.security import get_password_hash

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
    c1 = Company(id=1, company_code="C1", name="Company 1", email="c1@test.com", status="Active")
    c2 = Company(id=2, company_code="C2", name="Company 2", email="c2@test.com", status="Active")
    db.add_all([c1, c2])
    db.commit()
    
    # Create employees
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    u_ca1 = Employee(id=2, employee_code="CA1", name="CA1", email="ca1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=1, designation="CA", date_of_joining=d, status="Active")
    u_ca2 = Employee(id=3, employee_code="CA2", name="CA2", email="ca2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=2, designation="CA", date_of_joining=d, status="Active")
    
    u_mgr = Employee(id=4, employee_code="MGR1", name="Mgr", email="mgr@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="Mgr", date_of_joining=d, status="Active")
    u_e1 = Employee(id=5, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=4, date_of_joining=d, status="Active")
    u_e2 = Employee(id=6, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=4, date_of_joining=d, status="Inactive")
    
    db.add_all([u_sa, u_ca1, u_ca2, u_mgr, u_e1, u_e2])
    db.commit()
    
    # Create leads
    lead1 = Lead(id=1, lead_name="Lead 1", contact_person="Contact 1", mobile_number="1234567890", lead_source="Website", status="New", company_id=1, assigned_employee_id=2)
    lead2 = Lead(id=2, lead_name="Lead 2", contact_person="Contact 2", mobile_number="1234567891", lead_source="Website", status="New", company_id=1, assigned_employee_id=5)
    lead3 = Lead(id=3, lead_name="Lead 3", contact_person="Contact 3", mobile_number="1234567892", lead_source="Website", status="New", company_id=2, assigned_employee_id=3)
    db.add_all([lead1, lead2, lead3])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_get_leads_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/leads/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 3

def test_create_lead_unauthorized(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "lead_name": "Test Lead 2",
        "contact_person": "Mr Test",
        "mobile_number": "1234567890",
        "lead_source": "Website",
        "status": "New",
        "assigned_employee_id": 2,
        "company_id": 2
    }
    response = client.post("/api/leads/", json=payload, headers=headers)
    assert response.status_code == 403

def test_employee_cannot_assign_to_other(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "lead_name": "Test Lead 3",
        "contact_person": "Mr Test",
        "mobile_number": "0987654321",
        "lead_source": "Website",
        "status": "New",
        "assigned_employee_id": 4, # Manager ID
        "company_id": 1
    }
    response = client.post("/api/leads/", json=payload, headers=headers)
    assert response.status_code == 403
    assert "assign leads to themselves" in response.json()["detail"].lower()

def test_get_leads_isolation(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/leads/", headers=headers)
    assert response.status_code == 200
    for lead in response.json():
        assert lead["company_id"] == 1
    assert len(response.json()) == 2

def test_invalid_mobile_number(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "lead_name": "Invalid Phone Lead",
        "contact_person": "Mr Test",
        "mobile_number": "invalid123",
        "lead_source": "Website",
        "status": "New",
        "assigned_employee_id": 2,
        "company_id": 1
    }
    response = client.post("/api/leads/", json=payload, headers=headers)
    assert response.status_code == 422 # Pydantic validation error
    
def test_inactive_employee_assignment(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "lead_name": "Test Lead",
        "contact_person": "Mr Test",
        "mobile_number": "1234567891",
        "lead_source": "Website",
        "status": "New",
        "assigned_employee_id": 6, # Inactive employee E2
        "company_id": 1
    }
    response = client.post("/api/leads/", json=payload, headers=headers)
    assert response.status_code == 400
    assert "active" in response.json()["detail"].lower()

def test_delete_lead_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    # Create
    payload = {
        "lead_name": "To be deleted",
        "contact_person": "Mr Test",
        "mobile_number": "1111111111",
        "lead_source": "Website",
        "status": "New",
        "assigned_employee_id": 2,
        "company_id": 1
    }
    create_res = client.post("/api/leads/", json=payload, headers=headers)
    assert create_res.status_code == 201
    lead_id = create_res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/leads/{lead_id}", headers=headers)
    assert del_res.status_code == 204

def test_delete_lead_company_admin(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    del_res = client.delete("/api/leads/1", headers=headers)
    assert del_res.status_code == 403 # Only Super Admin can delete


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
