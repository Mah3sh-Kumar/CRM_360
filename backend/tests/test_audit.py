import pytest
from tests.test_rbac import get_auth_headers
from app.models.audit_log import AuditLog

def test_audit_logging(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["admin_a"].email)
    emp_id = test_data["admin_a"].id
    comp_id = test_data["comp1"].id
    
    # 1. Action: Login
    # Already performed in get_auth_headers. Let's check DB.
    login_log = db_session.query(AuditLog).filter(AuditLog.action == "Login", AuditLog.user_id == emp_id).first()
    assert login_log is not None
    
    # 2. Action: Create Lead
    create_data = {
        "lead_name": "Audit Lead",
        "mobile_number": "1234567890",
        "lead_source": "Website", "email_address": "audit@test.com",
        "contact_person": "Audit Contact",
        "company_id": comp_id,
        "assigned_employee_id": emp_id
    }
    res_create = client.post("/api/leads/", json=create_data, headers=headers)
    assert res_create.status_code == 201
    lead_id = res_create.json()["id"]
    
    lead_log = db_session.query(AuditLog).filter(AuditLog.module == "Lead", AuditLog.record_id == lead_id).first()
    assert lead_log is not None
    assert lead_log.action == "CREATE"
