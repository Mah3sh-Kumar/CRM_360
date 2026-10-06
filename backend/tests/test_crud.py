import pytest
from tests.test_rbac import get_auth_headers
from app.models.lead import Lead

def test_crud_lead_lifecycle(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["admin_a"].email)
    comp_id = test_data["comp1"].id
    emp_id = test_data["admin_a"].id
    
    # 1. CREATE
    create_data = {
        "lead_name": "CRUD Lead",
        "company_name": "CRUD Corp",
        "mobile_number": "1234567890",
        "lead_source": "Website", "email_address": "crud@test.com",
        "contact_person": "CRUD Contact",
        "status": "New",
        "assigned_employee_id": emp_id
    }
    res_create = client.post("/api/leads/", json=create_data, headers=headers)
    assert res_create.status_code == 201
    lead_id = res_create.json()["id"]
    
    # 2. READ
    res_read = client.get(f"/api/leads/{lead_id}", headers=headers)
    assert res_read.status_code == 200
    assert res_read.json()["lead_name"] == "CRUD Lead"
    
    # 3. UPDATE
    update_data = {"lead_name": "CRUD Lead Updated"}
    res_update = client.put(f"/api/leads/{lead_id}", json=update_data, headers=headers)
    assert res_update.status_code == 200
    assert res_update.json()["lead_name"] == "CRUD Lead Updated"
    
    # Verify in DB directly
    db_lead = db_session.query(Lead).filter(Lead.id == lead_id).first()
    assert db_lead.lead_name == "CRUD Lead Updated"
    
    # 4. DELETE (Super Admin only per SRS 21.5, so we use Super Admin)
    sa_headers = get_auth_headers(client, test_data["super_admin"].email)
    res_delete = client.delete(f"/api/leads/{lead_id}", headers=sa_headers)
    assert res_delete.status_code == 204
    
    # Verify deleted
    res_read_deleted = client.get(f"/api/leads/{lead_id}", headers=headers)
    assert res_read_deleted.status_code == 404
