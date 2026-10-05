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
    
    # Create companies
    c1 = Company(id=1, company_code="C1", name="Company 1")
    c2 = Company(id=2, company_code="C2", name="Company 2")
    db.add_all([c1, c2])
    db.commit()
    
    # Create users
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    u_ca1 = Employee(id=2, employee_code="CA1", name="CA1", email="ca1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=1, designation="CA", date_of_joining=d, status="Active")
    u_e1 = Employee(id=3, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=None, date_of_joining=d, status="Active")

    db.add_all([u_sa, u_ca1, u_e1])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_get_companies_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/companies/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_create_company_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "company_code": "NEW_COMP",
        "name": "New Company LLC",
        "email": "test@newcomp.com",
        "status": "Active"
    }
    response = client.post("/api/companies/", headers=headers, json=data)
    assert response.status_code == 200
    assert response.json()["company_code"] == "NEW_COMP"

def test_create_company_company_admin_forbidden(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "company_code": "NEW_COMP_2",
        "name": "New Company 2 LLC",
        "email": "test@newcomp2.com",
        "status": "Active"
    }
    response = client.post("/api/companies/", headers=headers, json=data)
    assert response.status_code == 403

def test_get_own_company_company_admin(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/companies/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["id"] == 1

def test_get_other_company_company_admin_forbidden(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/companies/2", headers=headers)
    assert response.status_code == 403

def test_update_company_status_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"status": "Inactive"}
    response = client.put("/api/companies/2", headers=headers, json=data)
    assert response.status_code == 200
    assert response.json()["status"] == "Inactive"

def test_update_company_status_company_admin_forbidden(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"status": "Inactive"}
    response = client.put("/api/companies/1", headers=headers, json=data)
    assert response.status_code == 403

def test_employee_access_other_company_forbidden(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/companies/2", headers=headers)
    assert response.status_code == 403


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
