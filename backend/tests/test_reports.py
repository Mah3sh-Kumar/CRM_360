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

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create companies
    c1 = Company(id=1, company_code="C1", name="Company 1", email="c1@test.com", status="Active")
    db.add(c1)
    db.commit()
    
    # Create employees
    d = date(2023, 1, 1)
    u_sa = Employee(id=1, employee_code="SA", name="SA", email="sa@test.com", mobile="1", hashed_password=get_password_hash("test"), role="Super Admin", company_id=None, designation="SA", date_of_joining=d, status="Active")
    db.add(u_sa)
    db.commit()

    # Create dummy data
    lead1 = Lead(lead_name="L1", contact_person="C1", mobile_number="1", lead_source="Web", status="New", company_id=1, assigned_employee_id=1)
    db.add(lead1)
    db.commit()
    db.close()

@pytest.fixture
def sa_token():
    response = client.post(
        "/api/auth/login",
        json={"email": "sa@test.com", "password": "test"}
    )
    return response.json()["access_token"]

@pytest.fixture
def sa_headers(sa_token):
    return {"Authorization": f"Bearer {sa_token}"}

def test_reports_authorization_missing():
    response = client.get("/api/reports/leads/summary")
    assert response.status_code == 401

def test_reports_lead_summary_json(sa_headers):
    response = client.get("/api/reports/leads/summary?format=json", headers=sa_headers)
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "columns" in data
    assert "data" in data
    assert len(data["data"]) == 1

def test_reports_customer_directory_csv(sa_headers):
    response = client.get("/api/reports/customers/directory?format=csv", headers=sa_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"

def test_reports_opportunity_pipeline_xlsx(sa_headers):
    response = client.get("/api/reports/opportunities/pipeline?format=xlsx", headers=sa_headers)
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]

def test_reports_opportunity_pipeline_pdf(sa_headers):
    response = client.get("/api/reports/opportunities/pipeline?format=pdf", headers=sa_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"


@pytest.fixture(autouse=True)
def apply_override():
    app.dependency_overrides[get_db] = override_get_db
