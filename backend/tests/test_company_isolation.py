import pytest
from app.models.lead import Lead
from app.models.customer import Customer
from tests.test_rbac import get_auth_headers

def test_company_isolation_list(client, test_data, db_session):
    admin_a = test_data["admin_a"]
    comp1 = test_data["comp1"]
    comp2 = test_data["comp2"]
    
    # Create records in both companies
    lead_a = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A", mobile_number="1111111111", email_address="a@test.com", company_id=comp1.id, assigned_employee_id=test_data["emp_a1"].id)
    lead_b = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead B", mobile_number="2222222222", email_address="b@test.com", company_id=comp2.id, assigned_employee_id=test_data["emp_b1"].id)
    
    cust_a = Customer(customer_code="CA", name="Cust A", email="ca@test.com", company_id=comp1.id, owner_id=test_data["emp_a1"].id)
    cust_b = Customer(customer_code="CB", name="Cust B", email="cb@test.com", company_id=comp2.id, owner_id=test_data["emp_b1"].id)
    
    db_session.add_all([lead_a, lead_b, cust_a, cust_b])
    db_session.commit()
    
    headers = get_auth_headers(client, admin_a.email)
    
    # Test Leads
    res_leads = client.get("/api/leads/", headers=headers)
    assert res_leads.status_code == 200
    for lead in res_leads.json():
        assert lead["company_id"] == comp1.id
        
    # Test Customers
    res_cust = client.get("/api/customers/", headers=headers)
    assert res_cust.status_code == 200
    for cust in res_cust.json():
        assert cust["company_id"] == comp1.id

def test_company_isolation_query_param_bypass(client, test_data, db_session):
    # Try to fetch another company's data by passing company_id explicitly
    admin_a = test_data["admin_a"]
    comp2 = test_data["comp2"]
    
    lead_b = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead B", mobile_number="2222222222", email_address="b@test.com", company_id=comp2.id, assigned_employee_id=test_data["emp_b1"].id)
    db_session.add(lead_b)
    db_session.commit()
    
    headers = get_auth_headers(client, admin_a.email)
    
    res = client.get(f"/api/leads/?company_id={comp2.id}", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 0 # Should ignore or enforce own company_id
