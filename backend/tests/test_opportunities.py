import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import date, datetime

from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
from app.models.account import Account
from app.models.contact import Contact
from app.models.opportunity import Opportunity
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
    u_e1 = Employee(id=4, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=None, date_of_joining=d, status="Active")
    db.add_all([u_sa, u_ca1, u_ca2, u_e1])
    db.commit()
    
    # Create accounts
    acc1 = Account(id=1, name="Account 1", code="A1", company_id=1, owner_id=2)
    acc2 = Account(id=2, name="Account 2", code="A2", company_id=2, owner_id=3)
    db.add_all([acc1, acc2])
    db.commit()

    # Create contacts
    con1 = Contact(id=1, first_name="Contact", last_name="1", mobile_number="123", company_id=1, account_id=1, owner_id=2)
    con2 = Contact(id=2, first_name="Contact", last_name="2", mobile_number="123", company_id=2, account_id=2, owner_id=3)
    db.add_all([con1, con2])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_create_opportunity_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Big Deal",
        "account_id": 1,
        "owner_id": 1,
        "stage": "Prospecting",
        "expected_revenue": 50000.0,
        "expected_close_date": "2026-12-31T00:00:00"
    }
    res = client.post("/api/opportunities/", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    assert res.json()["probability"] == 10
    assert res.json()["status"] == "Active"
    
def test_opportunity_company_isolation(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to create opportunity with account from company 2
    payload = {
        "name": "Steal Deal",
        "account_id": 2,
        "owner_id": 2,
        "stage": "Prospecting",
        "expected_revenue": 10000.0,
        "expected_close_date": "2026-12-31T00:00:00"
    }
    res = client.post("/api/opportunities/", json=payload, headers=headers)
    assert res.status_code == 400
    assert "Account must belong to the same company" in res.json()["detail"]

def test_stage_progression_and_lock(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "name": "Lock Deal",
        "account_id": 1,
        "owner_id": 2,
        "stage": "Negotiation",
        "expected_revenue": 20000.0,
        "expected_close_date": "2026-12-31T00:00:00"
    }
    opp_resp = client.post("/api/opportunities/", json=payload, headers=headers)
    assert opp_resp.status_code == 200
    opp_id = opp_resp.json()["id"]
    
    # Update to Won
    won_resp = client.put(f"/api/opportunities/{opp_id}", json={"stage": "Won"}, headers=headers)
    assert won_resp.status_code == 200
    assert won_resp.json()["probability"] == 100
    assert won_resp.json()["status"] == "Won"
    
    # Try to update again
    update_fail = client.put(f"/api/opportunities/{opp_id}", json={"expected_revenue": 30000.0}, headers=headers)
    assert update_fail.status_code == 400
    assert "Won opportunities are locked" in update_fail.json()["detail"]

def test_lost_reason_required(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try creating lost without reason
    payload = {
        "name": "Lost Deal",
        "account_id": 1,
        "owner_id": 2,
        "stage": "Lost",
        "expected_revenue": 20000.0,
        "expected_close_date": "2026-12-31T00:00:00"
    }
    opp_fail = client.post("/api/opportunities/", json=payload, headers=headers)
    assert opp_fail.status_code == 400
    
    # Try with reason
    payload["lost_reason"] = "Too expensive"
    opp_success = client.post("/api/opportunities/", json=payload, headers=headers)
    assert opp_success.status_code == 200
    assert opp_success.json()["status"] == "Lost"


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
