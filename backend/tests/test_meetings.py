import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime, timedelta

from app.main import app
from app.core.database import Base, get_db
from app.models.company import Company
from app.models.employee import Employee
from app.models.account import Account
from app.models.meeting import Meeting
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
    u_m1 = Employee(id=5, employee_code="M1", name="M1", email="m1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Manager", company_id=1, designation="M", date_of_joining=d, status="Active")
    u_e1 = Employee(id=3, employee_code="E1", name="E1", email="e1@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Active")
    u_e2 = Employee(id=4, employee_code="E2", name="E2", email="e2@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Active")
    u_e_inactive = Employee(id=6, employee_code="E_INACTIVE", name="EI", email="ei@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Employee", company_id=1, designation="E", manager_id=5, date_of_joining=d, status="Inactive")

    db.add_all([u_sa, u_ca1, u_m1, u_e1, u_e2, u_e_inactive])
    db.commit()

    # Create Account
    a1 = Account(id=1, code="A1", name="Account 1", company_id=1, owner_id=3, status="Active")
    db.add(a1)
    db.commit()
    
    
    yield
    
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    db.close()

def get_token(email):
    res = client.post("/api/auth/login", json={"email": email, "password": "test"})
    return res.json()["access_token"]


def create_mock_meeting_data(organizer_id, participant_ids, start_offset=1, end_offset=2):
    now = datetime.now()
    return {
        "title": "Project Kickoff",
        "meeting_type": "Project Discussion",
        "organizer_id": organizer_id,
        "participant_ids": participant_ids,
        "start_datetime": (now + timedelta(days=start_offset)).isoformat() + "Z",
        "end_datetime": (now + timedelta(days=end_offset)).isoformat() + "Z",
        "location": "Conference Room A",
        "agenda": "Discuss initial project phases"
    }

def test_create_meeting_success(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    data = create_mock_meeting_data(2, [2, 3])
    response = client.post("/api/meetings/", json=data, headers=headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["title"] == "Project Kickoff"
    assert res_data["status"] == "Scheduled"
    assert len(res_data["participant_ids"]) == 2

def test_create_meeting_past_date_fails(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = create_mock_meeting_data(2, [2], -2, -1)
    response = client.post("/api/meetings/", json=data, headers=headers)
    assert response.status_code == 400
    assert "Start datetime must be in the future" in response.json()["detail"]

def test_create_meeting_conflict(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = create_mock_meeting_data(2, [2], 5, 6)
    r1 = client.post("/api/meetings/", json=data, headers=headers)
    assert r1.status_code == 201
    
    # Same exact time, should fail with 409
    r2 = client.post("/api/meetings/", json=data, headers=headers)
    assert r2.status_code == 409
    assert "Conflict" in r2.json()["detail"]

def test_read_meetings(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/meetings/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_update_meeting(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = create_mock_meeting_data(2, [2], 10, 11)
    r1 = client.post("/api/meetings/", json=data, headers=headers)
    meeting_id = r1.json()["id"]
    
    update_data = {"title": "Updated Meeting"}
    r2 = client.put(f"/api/meetings/{meeting_id}", json=update_data, headers=headers)
    assert r2.status_code == 200
    assert r2.json()["title"] == "Updated Meeting"

def test_complete_meeting(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = create_mock_meeting_data(2, [2], 12, 13)
    r1 = client.post("/api/meetings/", json=data, headers=headers)
    meeting_id = r1.json()["id"]
    
    r2 = client.patch(f"/api/meetings/{meeting_id}/complete", headers=headers)
    assert r2.status_code == 200
    assert r2.json()["status"] == "Completed"
    
    # Update should fail
    r3 = client.put(f"/api/meetings/{meeting_id}", json={"title": "fails"}, headers=headers)
    assert r3.status_code == 400

def test_cancel_meeting(setup_db):
    token = get_token("ca1@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    data = create_mock_meeting_data(2, [2], 15, 16)
    r1 = client.post("/api/meetings/", json=data, headers=headers)
    meeting_id = r1.json()["id"]
    
    r2 = client.patch(f"/api/meetings/{meeting_id}/cancel", headers=headers)
    assert r2.status_code == 200
    assert r2.json()["status"] == "Cancelled"

def test_delete_meeting_permissions(setup_db):
    admin_token = get_token("sa@test.com")
    normal_token = get_token("e1@test.com")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    normal_headers = {"Authorization": f"Bearer {normal_token}"}
    
    data = create_mock_meeting_data(3, [3], 20, 21)
    r1 = client.post("/api/meetings/", json=data, headers=normal_headers)
    meeting_id = r1.json()["id"]
    
    # Normal user delete fails
    r2 = client.delete(f"/api/meetings/{meeting_id}", headers=normal_headers)
    assert r2.status_code == 403
    
    # Super Admin delete succeeds
    r3 = client.delete(f"/api/meetings/{meeting_id}", headers=admin_headers)
    assert r3.status_code == 204


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
