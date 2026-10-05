import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
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
    
    c1 = Company(id=1, company_code="C1", name="Company 1", email="c1@test.com", status="Active")
    c2 = Company(id=2, company_code="C2", name="Company 2", email="c2@test.com", status="Active")
    db.add_all([c1, c2])
    db.commit()
    
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    u_ca1 = Employee(id=2, employee_code="CA1", name="CA1", email="ca1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=1, designation="CA", date_of_joining=d, status="Active")
    u_mgr = Employee(id=3, employee_code="MGR1", name="Mgr", email="mgr@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="Mgr", date_of_joining=d, status="Active")
    u_e1 = Employee(id=4, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=3, date_of_joining=d, status="Active")
    u_e2 = Employee(id=5, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=2, designation="E", date_of_joining=d, status="Active")

    db.add_all([u_sa, u_ca1, u_mgr, u_e1, u_e2])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_get_employees_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/employees/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 5

def test_create_employee_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "employee_code": "E999",
        "name": "New Emp",
        "email": "e999@test.com",
        "mobile": "12345",
        "role": "Employee",
        "company_id": 1,
        "designation": "Dev",
        "date_of_joining": "2023-01-01",
        "password": "test"
    }
    response = client.post("/api/employees/", headers=headers, json=data)
    assert response.status_code == 201
    assert response.json()["email"] == "e999@test.com"

def test_company_admin_access(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/employees/", headers=headers)
    assert response.status_code == 200
    emails = [e["email"] for e in response.json()]
    assert "ca1@test.com" in emails
    assert "e2@test.com" not in emails  # e2 is in company 2
    
    response = client.get(f"/api/employees/5", headers=headers)
    assert response.status_code == 403

def test_manager_access(setup_db):
    token = get_token("mgr@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/employees/", headers=headers)
    assert response.status_code == 200
    emails = [e["email"] for e in response.json()]
    assert "mgr@test.com" in emails
    assert "e1@test.com" in emails
    assert "ca1@test.com" not in emails  # Not in team
    
    response = client.get(f"/api/employees/2", headers=headers)
    assert response.status_code == 403


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
