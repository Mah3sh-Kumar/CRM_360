import pytest
from app.models.lead import Lead

def get_auth_headers(client, email):
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "testpass"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_super_admin_rbac(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["super_admin"].email)
    
    # Create leads for Company A and Company B
    comp1_id = test_data["comp1"].id
    comp2_id = test_data["comp2"].id
    emp_a1_id = test_data["emp_a1"].id
    emp_b1_id = test_data["emp_b1"].id

    lead_a = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A", mobile_number="1111111111", email_address="a@test.com", company_id=comp1_id, assigned_employee_id=emp_a1_id)
    lead_b = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead B", mobile_number="2222222222", email_address="b@test.com", company_id=comp2_id, assigned_employee_id=emp_b1_id)
    db_session.add_all([lead_a, lead_b])
    db_session.commit()

    # Super Admin can see both
    res = client.get("/api/leads/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 2

def test_company_admin_rbac(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["admin_a"].email)
    
    # Create leads for A and B
    comp1_id = test_data["comp1"].id
    comp2_id = test_data["comp2"].id
    emp_a1_id = test_data["emp_a1"].id
    emp_b1_id = test_data["emp_b1"].id

    lead_a = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A", mobile_number="1111111111", email_address="a@test.com", company_id=comp1_id, assigned_employee_id=emp_a1_id)
    lead_b = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead B", mobile_number="2222222222", email_address="b@test.com", company_id=comp2_id, assigned_employee_id=emp_b1_id)
    db_session.add_all([lead_a, lead_b])
    db_session.commit()

    # Admin A can only see Lead A
    res = client.get("/api/leads/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert any(l["lead_name"] == "Lead A" for l in data)
    assert not any(l["lead_name"] == "Lead B" for l in data)

def test_manager_rbac(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["mgr_a"].email)
    
    emp_a1_id = test_data["emp_a1"].id
    mgr_a_id = test_data["mgr_a"].id
    
    # Needs to be able to see their own and their team members
    # Create leads assigned to team
    lead_a1 = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A1", mobile_number="1111111111", email_address="a1@test.com", company_id=test_data["comp1"].id, assigned_employee_id=emp_a1_id)
    # Create lead assigned to manager
    lead_mgr = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead Mgr", mobile_number="2222222222", email_address="mgr@test.com", company_id=test_data["comp1"].id, assigned_employee_id=mgr_a_id)
    # Create lead assigned to admin (not in team)
    lead_admin = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead Admin", mobile_number="3333333333", email_address="admin@test.com", company_id=test_data["comp1"].id, assigned_employee_id=test_data["admin_a"].id)
    
    db_session.add_all([lead_a1, lead_mgr, lead_admin])
    db_session.commit()

    res = client.get("/api/leads/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    names = [l["lead_name"] for l in data]
    assert "Lead A1" in names
    assert "Lead Mgr" in names
    assert "Lead Admin" not in names

def test_employee_rbac(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["emp_a1"].email)
    
    emp_a1_id = test_data["emp_a1"].id
    emp_a2_id = test_data["emp_a2"].id
    
    lead_a1 = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A1", mobile_number="1111111111", email_address="a1@test.com", company_id=test_data["comp1"].id, assigned_employee_id=emp_a1_id)
    lead_a2 = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A2", mobile_number="2222222222", email_address="a2@test.com", company_id=test_data["comp1"].id, assigned_employee_id=emp_a2_id)
    
    db_session.add_all([lead_a1, lead_a2])
    db_session.commit()

    res = client.get("/api/leads/", headers=headers)
    assert res.status_code == 200
    data = res.json()
    names = [l["lead_name"] for l in data]
    assert "Lead A1" in names
    assert "Lead A2" not in names
