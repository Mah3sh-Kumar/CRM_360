import pytest
from fastapi import APIRouter, Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
from app.api.deps import (
    get_current_user,
    require_role,
    require_company_access,
    verify_record_access
)
from app.core.security import get_password_hash

# Set up test database (in-memory SQLite for testing)
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

# Create a test router with protected endpoints
test_router = APIRouter()

@test_router.get("/super-admin-only")
def super_admin_only(user: Employee = Depends(require_role(["Super Admin"]))):
    return {"message": "success"}

@test_router.get("/company-admin-above")
def company_admin_above(user: Employee = Depends(require_role(["Super Admin", "Company Admin"]))):
    return {"message": "success"}

@test_router.get("/manager-above")
def manager_above(user: Employee = Depends(require_role(["Super Admin", "Company Admin", "Manager"]))):
    return {"message": "success"}

@test_router.get("/company-data/{company_id}")
def company_data(company_id: int, user: Employee = Depends(get_current_user)):
    require_company_access(user, company_id)
    return {"message": "success"}

@test_router.get("/record/{company_id}/{owner_id}")
def record_data(
    company_id: int, 
    owner_id: int, 
    user: Employee = Depends(get_current_user), 
    db = Depends(get_db)
):
    verify_record_access(db, user, company_id, owner_id)
    return {"message": "success"}

app.include_router(test_router, prefix="/test")

client = TestClient(app)

from datetime import date

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
    u_ca2 = Employee(id=3, employee_code="CA2", name="CA2", email="ca2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=2, designation="CA", date_of_joining=d, status="Active")
    
    u_m1 = Employee(id=4, employee_code="M1", name="M1", email="m1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="M", date_of_joining=d, status="Active")
    u_e1 = Employee(id=5, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=4, date_of_joining=d, status="Active")
    u_e2 = Employee(id=6, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=4, date_of_joining=d, status="Active")
    u_e_other = Employee(id=7, employee_code="E3", name="E3", email="e3@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=None, date_of_joining=d, status="Active")

    db.add_all([u_sa, u_ca1, u_ca2, u_m1, u_e1, u_e2, u_e_other])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    assert client.get("/test/super-admin-only", headers=headers).status_code == 200
    assert client.get("/test/company-data/1", headers=headers).status_code == 200
    assert client.get("/test/company-data/2", headers=headers).status_code == 200
    assert client.get("/test/record/2/3", headers=headers).status_code == 200

def test_company_admin(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    assert client.get("/test/super-admin-only", headers=headers).status_code == 403
    assert client.get("/test/company-admin-above", headers=headers).status_code == 200
    assert client.get("/test/company-data/1", headers=headers).status_code == 200
    assert client.get("/test/company-data/2", headers=headers).status_code == 403
    
    # Record access
    assert client.get("/test/record/1/4", headers=headers).status_code == 200
    assert client.get("/test/record/2/3", headers=headers).status_code == 403

def test_manager(setup_db):
    token = get_token("m1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    assert client.get("/test/company-admin-above", headers=headers).status_code == 403
    assert client.get("/test/manager-above", headers=headers).status_code == 200
    assert client.get("/test/company-data/1", headers=headers).status_code == 200
    assert client.get("/test/company-data/2", headers=headers).status_code == 403
    
    # Manager can access own team (M1 id=4, E1 id=5, E2 id=6)
    assert client.get("/test/record/1/5", headers=headers).status_code == 200
    assert client.get("/test/record/1/6", headers=headers).status_code == 200
    assert client.get("/test/record/1/4", headers=headers).status_code == 200
    
    # Manager cannot access other employees in same company (E3 id=7)
    assert client.get("/test/record/1/7", headers=headers).status_code == 403

def test_employee(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    assert client.get("/test/manager-above", headers=headers).status_code == 403
    assert client.get("/test/company-data/1", headers=headers).status_code == 200
    assert client.get("/test/company-data/2", headers=headers).status_code == 403
    
    # Employee can access own records
    assert client.get("/test/record/1/5", headers=headers).status_code == 200
    
    # Employee cannot access other team members
    assert client.get("/test/record/1/6", headers=headers).status_code == 403
    
    # Employee cannot access manager records
    assert client.get("/test/record/1/4", headers=headers).status_code == 403

def test_auth_hardening(setup_db):
    # Invalid credentials
    res = client.post("/api/auth/login", json={"email": "sa@test.com", "password": "wrong"})
    assert res.status_code == 401
    
    # Inactive user
    # Create inactive user directly via DB
    db = TestingSessionLocal()
    u_inactive = Employee(id=8, employee_code="IA", name="IA", email="ia@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", date_of_joining=date(2023, 1, 1), status="Inactive")
    db.add(u_inactive)
    db.commit()
    db.close()
    
    res = client.post("/api/auth/login", json={"email": "ia@test.com", "password": "test"})
    assert res.status_code == 400
    
    # Missing JWT
    assert client.get("/test/company-data/1").status_code == 401
    
    # Invalid JWT
    headers = {"Authorization": "Bearer invalid.token.here"}
    assert client.get("/test/company-data/1", headers=headers).status_code == 401


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
