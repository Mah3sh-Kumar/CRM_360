import pytest
from app.models.lead import Lead
from app.models.customer import Customer
from tests.test_rbac import get_auth_headers

def test_employee_idor_get(client, test_data, db_session):
    # Employee A1 tries to access Employee A2's lead
    emp_a1 = test_data["emp_a1"]
    emp_a2 = test_data["emp_a2"]
    
    lead_a2 = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A2", mobile_number="2222222222", email_address="a2@test.com", company_id=test_data["comp1"].id, assigned_employee_id=emp_a2.id)
    db_session.add(lead_a2)
    db_session.commit()
    
    headers = get_auth_headers(client, emp_a1.email)
    res = client.get(f"/api/leads/{lead_a2.id}", headers=headers)
    
    # Based on leads.py, should be 403 Forbidden
    assert res.status_code == 403

def test_employee_idor_patch(client, test_data, db_session):
    emp_a1 = test_data["emp_a1"]
    emp_a2 = test_data["emp_a2"]
    
    lead_a2 = Lead(contact_person="Test Contact", lead_source="Website", lead_name="Lead A2", mobile_number="2222222222", email_address="a2@test.com", company_id=test_data["comp1"].id, assigned_employee_id=emp_a2.id)
    db_session.add(lead_a2)
    db_session.commit()
    
    headers = get_auth_headers(client, emp_a1.email)
    res = client.put(f"/api/leads/{lead_a2.id}", json={"lead_name": "Hacked"}, headers=headers)
    
    assert res.status_code == 403

def test_company_admin_idor_get(client, test_data, db_session):
    # Company A Admin tries to access Company B Customer
    admin_a = test_data["admin_a"]
    comp2 = test_data["comp2"]
    emp_b1 = test_data["emp_b1"]
    
    customer_b = Customer(customer_code="CUSTB", name="Customer B", email="b@test.com", company_id=comp2.id, owner_id=emp_b1.id)
    db_session.add(customer_b)
    db_session.commit()
    
    headers = get_auth_headers(client, admin_a.email)
    res = client.get(f"/api/customers/{customer_b.id}", headers=headers)
    
    assert res.status_code in [403, 404]

def test_company_admin_idor_patch(client, test_data, db_session):
    admin_a = test_data["admin_a"]
    comp2 = test_data["comp2"]
    emp_b1 = test_data["emp_b1"]
    
    customer_b = Customer(customer_code="CUSTB", name="Customer B", email="b@test.com", company_id=comp2.id, owner_id=emp_b1.id)
    db_session.add(customer_b)
    db_session.commit()
    
    headers = get_auth_headers(client, admin_a.email)
    res = client.put(f"/api/customers/{customer_b.id}", json={"name": "Hacked"}, headers=headers)
    
    assert res.status_code in [403, 404]

def test_company_admin_idor_delete(client, test_data, db_session):
    admin_a = test_data["admin_a"]
    comp2 = test_data["comp2"]
    emp_b1 = test_data["emp_b1"]
    
    customer_b = Customer(customer_code="CUSTB", name="Customer B", email="b@test.com", company_id=comp2.id, owner_id=emp_b1.id)
    db_session.add(customer_b)
    db_session.commit()
    
    headers = get_auth_headers(client, admin_a.email)
    res = client.delete(f"/api/customers/{customer_b.id}", headers=headers)
    
    # Typically regular users or company admins cannot delete across companies, often only Super Admin or it's 403
    assert res.status_code in [403, 404]
