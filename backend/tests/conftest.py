import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

# Add backend to sys path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash

# Test database URL
SQLALCHEMY_DATABASE_URL = "mssql+pyodbc://@localhost/CRM360_Test?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Create tables once for the test session."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test."""
    session = TestingSessionLocal()
    
    # Clean tables
    from app.models.audit_log import AuditLog
    from app.models.tracking import EmployeeLocation, Visit, CheckOut, CheckIn
    from app.models.meeting import Meeting, meeting_participants
    from app.models.task import Task
    from app.models.activity import Activity
    from app.models.opportunity import Opportunity
    from app.models.contact import Contact
    from app.models.account import Account
    from app.models.customer import Customer
    from app.models.lead import Lead
    from app.models.employee import Employee
    from app.models.company import Company

    try:
        session.query(AuditLog).delete()
        session.query(EmployeeLocation).delete()
        session.query(Visit).delete()
        session.query(CheckOut).delete()
        session.query(CheckIn).delete()
        session.execute(meeting_participants.delete())
        session.query(Meeting).delete()
        session.query(Task).delete()
        session.query(Activity).delete()
        session.query(Opportunity).delete()
        session.query(Contact).delete()
        session.query(Account).delete()
        session.query(Customer).delete()
        session.query(Lead).delete()
        session.execute(text("UPDATE employees SET manager_id = NULL"))
        session.query(Employee).delete()
        session.query(Company).delete()
        session.commit()
    except Exception as e:
        session.rollback()
        raise e

    yield session
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Test client with db override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_data(db_session):
    """Pre-populated data for RBAC testing."""
    from app.models.company import Company
    from app.models.employee import Employee
    
    comp1 = Company(company_code="COMPA", name="Company A", status="Active")
    comp2 = Company(company_code="COMPB", name="Company B", status="Active")
    db_session.add_all([comp1, comp2])
    db_session.commit()
    
    pwd = get_password_hash("testpass")
    
    from datetime import date
    super_admin = Employee(employee_code="SA1", name="Super Admin", email="sa@test.com", mobile="1234567890", designation="Test", date_of_joining=date(2023, 1, 1), hashed_password=pwd, role="Super Admin", status="Active")
    
    admin_a = Employee(employee_code="AA1", name="Admin A", email="admina@test.com", mobile="1234567890", designation="Test", date_of_joining=date(2023, 1, 1), hashed_password=pwd, role="Company Admin", company_id=comp1.id, status="Active")
    
    mgr_a = Employee(employee_code="MA1", name="Manager A", email="mgra@test.com", mobile="1234567890", designation="Test", date_of_joining=date(2023, 1, 1), hashed_password=pwd, role="Manager", company_id=comp1.id, status="Active")
    
    emp_a1 = Employee(employee_code="EA1", name="Emp A1", email="empa1@test.com", mobile="1234567890", designation="Test", date_of_joining=date(2023, 1, 1), hashed_password=pwd, role="Employee", company_id=comp1.id, manager_id=mgr_a.id, status="Active")
    emp_a2 = Employee(employee_code="EA2", name="Emp A2", email="empa2@test.com", mobile="1234567890", designation="Test", date_of_joining=date(2023, 1, 1), hashed_password=pwd, role="Employee", company_id=comp1.id, manager_id=mgr_a.id, status="Active")
    
    emp_b1 = Employee(employee_code="EB1", name="Emp B1", email="empb1@test.com", mobile="1234567890", designation="Test", date_of_joining=date(2023, 1, 1), hashed_password=pwd, role="Employee", company_id=comp2.id, status="Active")
    
    db_session.add_all([super_admin, admin_a, mgr_a, emp_a1, emp_a2, emp_b1])
    db_session.commit()
    
    # Assign manager id explicitly
    emp_a1.manager_id = mgr_a.id
    emp_a2.manager_id = mgr_a.id
    db_session.commit()
    
    return {
        "comp1": comp1,
        "comp2": comp2,
        "super_admin": super_admin,
        "admin_a": admin_a,
        "mgr_a": mgr_a,
        "emp_a1": emp_a1,
        "emp_a2": emp_a2,
        "emp_b1": emp_b1
    }
