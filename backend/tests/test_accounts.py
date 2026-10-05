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
from app.models.account import Account
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
    
    # Create accounts
    acc1 = Account(id=1, name="Account 1", code="A1", company_id=1, owner_id=2)
    acc2 = Account(id=2, name="Account 2", code="A2", company_id=1, owner_id=5)
    acc3 = Account(id=3, name="Account 3", code="A3", company_id=2, owner_id=3)
    db.add_all([acc1, acc2, acc3])
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]

def test_get_accounts_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/accounts/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 3

def test_get_accounts_isolation(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/accounts/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 2
    for acc in res.json():
        assert acc["company_id"] == 1

def test_create_account_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "New SA Account",
        "code": "A4",
        "owner_id": 2
    }
    res = client.post("/api/accounts/", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["company_id"] == 1

def test_employee_cannot_create_account(setup_db):
    token = get_token("e1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "New E1 Account",
        "code": "A5",
        "owner_id": 5
    }
    res = client.post("/api/accounts/", json=payload, headers=headers)
    assert res.status_code == 403

def test_idor_get_foreign_account(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/accounts/3", headers=headers) # Belongs to company 2
    assert res.status_code == 403

def test_idor_put_foreign_account(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.put("/api/accounts/3", json={"name": "Hacked"}, headers=headers)
    assert res.status_code == 403

def test_idor_delete_foreign_account(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.delete("/api/accounts/3", headers=headers)
    assert res.status_code == 403

def test_delete_account_super_admin(setup_db):
    token = get_token("sa@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    res = client.delete("/api/accounts/1", headers=headers)
    assert res.status_code == 200


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
