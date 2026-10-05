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
from app.models.customer import Customer
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
    c3 = Company(id=3, company_code="C3", name="Inactive Company", email="c3@test.com", status="Inactive")
    db.add_all([c1, c2, c3])
    db.commit()
    
    # Create employees
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    u_ca1 = Employee(id=2, employee_code="CA1", name="CA1", email="ca1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=1, designation="CA", date_of_joining=d, status="Active")
    u_ca2 = Employee(id=3, employee_code="CA2", name="CA2", email="ca2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=2, designation="CA", date_of_joining=d, status="Active")
    u_ca3 = Employee(id=4, employee_code="CA3", name="CA3", email="ca3@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Company Admin", company_id=3, designation="CA", date_of_joining=d, status="Active")
    
    u_mgr = Employee(id=5, employee_code="MGR1", name="Mgr", email="mgr@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="Mgr", date_of_joining=d, status="Active")
    u_e1 = Employee(id=6, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Active")
    u_e2 = Employee(id=7, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Inactive")
    
    db.add_all([u_sa, u_ca1, u_ca2, u_ca3, u_mgr, u_e1, u_e2])
    db.commit()
    
    # Create customers
    cust1 = Customer(id=1, customer_code="CUST1", name="Customer 1", company_id=1, owner_id=2, status="Active")
    cust2 = Customer(id=2, customer_code="CUST2", name="Customer 2", company_id=1, owner_id=6, status="Active")
    cust3 = Customer(id=3, customer_code="CUST3", name="Customer 3", company_id=2, owner_id=3, status="Active")
    db.add_all([cust1, cust2, cust3])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_get_customers_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/customers/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 3

def test_company_admin_access(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/customers/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2
    
    response = client.get("/api/customers/3", headers=headers)
    assert response.status_code == 403

def test_manager_access(setup_db):
    token = get_token("mgr@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/customers/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == 2 # owns by E1 (in mgr team)
    
    response = client.get("/api/customers/1", headers=headers)
    assert response.status_code == 403 # owned by CA1

def test_employee_access(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/customers/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    response = client.get("/api/customers/1", headers=headers)
    assert response.status_code == 403

def test_create_customer_inactive_company(setup_db):
    token = get_token("ca3@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "customer_code": "CUST_FAIL",
        "name": "Fail Customer",
        "owner_id": 4,
        "company_id": 3
    }
    response = client.post("/api/customers/", headers=headers, json=data)
    assert response.status_code == 400
    assert "inactive company" in response.json()["detail"].lower()

def test_create_customer_inactive_owner(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "customer_code": "CUST_FAIL2",
        "name": "Fail Customer",
        "owner_id": 7, # E2 is inactive
        "company_id": 1
    }
    response = client.post("/api/customers/", headers=headers, json=data)
    assert response.status_code == 400
    assert "active employee" in response.json()["detail"].lower()

def test_create_customer_cross_company(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "customer_code": "CUST_FAIL3",
        "name": "Fail Customer",
        "owner_id": 3, # CA2 in company 2
        "company_id": 1
    }
    response = client.post("/api/customers/", headers=headers, json=data)
    assert response.status_code == 400
    assert "same company" in response.json()["detail"].lower()
    
def test_create_customer_success(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "customer_code": "NEW_CUST",
        "name": "New Customer",
        "owner_id": 6,
        "company_id": 1
    }
    response = client.post("/api/customers/", headers=headers, json=data)
    assert response.status_code == 201
    assert response.json()["customer_code"] == "NEW_CUST"

def test_update_customer(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"name": "Updated Name"}
    response = client.put("/api/customers/1", headers=headers, json=data)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"

def test_delete_customer(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.delete("/api/customers/1", headers=headers)
    assert response.status_code == 204
    
    # verify it's inactive
    response = client.get("/api/customers/1", headers=headers)
    assert response.json()["status"] == "Inactive"


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
