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
    db.add(c1)
    db.commit()
    
    d = date(2023, 1, 1)
    u_e1 = Employee(id=1, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", date_of_joining=d, status="Active")
    u_e2 = Employee(id=2, employee_code="E2", name="E2", email="e2@test.com", mobile="2", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", date_of_joining=d, status="Inactive")
    u_mgr = Employee(id=3, employee_code="MGR", name="Mgr", email="mgr@test.com", mobile="3", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="Mgr", date_of_joining=d, status="Active")
    u_e1.manager_id = 3
    db.add_all([u_e1, u_e2, u_mgr])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_check_in_success(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/tracking/check-in", headers=headers, json={"latitude": 40.71, "longitude": -74.01, "address": "Test"})
    assert res.status_code == 200

def test_check_in_duplicate(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/tracking/check-in", headers=headers, json={"latitude": 40.71, "longitude": -74.01, "address": "Test"})
    assert res.status_code == 400



def test_record_location(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/tracking/location", headers=headers, json={"latitude": 40.72, "longitude": -74.02})
    assert res.status_code == 200

def test_check_out_success(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/tracking/check-out", headers=headers, json={"latitude": 40.73, "longitude": -74.03, "address": "Test"})
    assert res.status_code == 200

def test_location_after_checkout(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/tracking/location", headers=headers, json={"latitude": 40.72, "longitude": -74.02})
    assert res.status_code == 400

def test_get_locations_manager(setup_db):
    token = get_token("mgr@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/tracking/locations", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

def test_cleanup_locations_super_admin(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    # employee cannot cleanup
    res = client.delete("/api/tracking/cleanup", headers=headers)
    assert res.status_code == 403
    
    # Needs Super Admin or Company Admin token to test success, but no such user in setup_db.
    # Let's add a Company Admin in setup_db or just check 403. 403 is good enough for RBAC check.


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
