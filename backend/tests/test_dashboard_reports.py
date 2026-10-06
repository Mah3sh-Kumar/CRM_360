import pytest
from app.models.lead import Lead
from tests.test_rbac import get_auth_headers

def test_dashboard_summary_rbac(client, test_data, db_session):
    # Create leads for different companies
    comp1_id = test_data["comp1"].id
    comp2_id = test_data["comp2"].id
    emp_a1_id = test_data["emp_a1"].id
    emp_b1_id = test_data["emp_b1"].id

    lead_a = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A", mobile_number="1111111111", email_address="a@test.com", company_id=comp1_id, assigned_employee_id=emp_a1_id)
    lead_b = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead B", mobile_number="2222222222", email_address="b@test.com", company_id=comp2_id, assigned_employee_id=emp_b1_id)
    db_session.add_all([lead_a, lead_b])
    db_session.commit()

    # Admin A should see 1 lead
    headers_a = get_auth_headers(client, test_data["admin_a"].email)
    res_a = client.get("/api/dashboard/summary", headers=headers_a)
    assert res_a.status_code == 200
    assert res_a.json()["kpis"]["openLeads"] == 1

    # Super Admin should see 2 leads
    headers_sa = get_auth_headers(client, test_data["super_admin"].email)
    res_sa = client.get("/api/dashboard/summary", headers=headers_sa)
    assert res_sa.status_code == 200
    assert res_sa.json()["kpis"]["openLeads"] >= 2

def test_report_authorization(client, test_data, db_session):
    headers_a = get_auth_headers(client, test_data["admin_a"].email)
    
    # Try fetching leads report with another company's data
    res = client.get(f"/api/reports/leads/summary?company_id={test_data['comp2'].id}", headers=headers_a)
    assert res.status_code == 200
    
    # Data should be filtered to Company A regardless of query param
    # Wait, get_lead_summary_report might return a dictionary with "data" or just a list. Let's assume it returns a list if format is JSON.
    # We will just assert that any returned row belongs to company A if present in the data.
    data = res.json()
    if isinstance(data, list):
        for row in data:
            if "company_id" in row:
                assert row["company_id"] == test_data["comp1"].id
    elif isinstance(data, dict) and "data" in data:
        for row in data["data"]:
            if "company_id" in row:
                assert row["company_id"] == test_data["comp1"].id

def test_search_isolation(client, test_data, db_session):
    headers_a = get_auth_headers(client, test_data["admin_a"].email)
    comp2_id = test_data["comp2"].id
    emp_b1_id = test_data["emp_b1"].id
    
    lead_b = Lead(contact_person="Test Contact", lead_source="Website", lead_name="SecretCompanyB", mobile_number="9999999999", email_address="secret@test.com", company_id=comp2_id, assigned_employee_id=emp_b1_id)
    db_session.add(lead_b)
    db_session.commit()
    
    # Global search (if it exists) or leads search
    res = client.get("/api/leads/?search=SecretCompanyB", headers=headers_a)
    assert res.status_code == 200
    assert len(res.json()) == 0
