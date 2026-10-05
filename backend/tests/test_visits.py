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
    
    c1 = Company(id=1, company_code="C1", name="Company 1", email="c1@test.com", status="Active")
    c2 = Company(id=2, company_code="C2", name="Company 2", email="c2@test.com", status="Active")
    db.add_all([c1, c2])
    db.commit()
    
    d = date(2023, 1, 1)
    u_e1 = Employee(id=1, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", date_of_joining=d, status="Active")
    u_e2 = Employee(id=2, employee_code="E2", name="E2", email="e2@test.com", mobile="2", hashed_password=get_password_hash("test"), role="Employee", company_id=2, designation="E", date_of_joining=d, status="Active")
    db.add_all([u_e1, u_e2])
    db.commit()
    
    cust1 = Customer(id=1, customer_code="CUST1", name="Cust 1", email="cust1@test.com", phone="123", company_id=1, owner_id=1)
    db.add(cust1)
    db.commit()

    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_create_visit_success(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/visits/", headers=headers, json={"customer_id": 1, "visit_date": "2026-10-05"})
    assert res.status_code == 200
    assert res.json()["status"] == "Planned"

def test_create_visit_cross_company(setup_db):
    token = get_token("e2@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/visits/", headers=headers, json={"customer_id": 1, "visit_date": "2026-10-05"})
    assert res.status_code == 400

def test_start_visit_no_checkin(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.patch("/api/visits/1/start", headers=headers, json={"latitude": 40.0, "longitude": -74.0})
    assert res.status_code == 400

def test_start_visit_success(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    # check in first
    client.post("/api/tracking/check-in", headers=headers, json={"latitude": 40.0, "longitude": -74.0, "address": "test"})
    # start visit
    res = client.patch("/api/visits/1/start", headers=headers, json={"latitude": 40.0, "longitude": -74.0})
    assert res.status_code == 200
    assert res.json()["status"] == "Started"

def test_complete_visit(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.patch("/api/visits/1/complete", headers=headers, json={"latitude": 40.0, "longitude": -74.0, "outcome": "Meeting Conducted"})
    assert res.status_code == 200
    assert res.json()["status"] == "Completed"

def test_cancel_visit(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    # create new visit
    res = client.post("/api/visits/", headers=headers, json={"customer_id": 1, "visit_date": "2026-10-06"})
    v_id = res.json()["id"]
    
    # cancel visit
    res = client.patch(f"/api/visits/{v_id}/cancel", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Cancelled"
    assert res.json()["outcome"] == "Visit Cancelled"


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
