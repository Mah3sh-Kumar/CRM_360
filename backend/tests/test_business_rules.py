import pytest
from datetime import datetime
from app.models.account import Account
from app.models.opportunity import Opportunity
from tests.test_rbac import get_auth_headers

def test_opportunity_lost_reason(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["mgr_a"].email)
    comp_id = test_data["comp1"].id
    emp_id = test_data["mgr_a"].id
    
    acc = Account(name="Acc", code="123", company_id=comp_id, owner_id=emp_id, status="Active")
    db_session.add(acc)
    db_session.commit()
    
    # Try creating lost opp without reason
    create_data = {
        "name": "Lost Opp",
        "account_id": acc.id,
        "owner_id": emp_id,
        "stage": "Lost",
        "expected_revenue": 1000,
        "expected_close_date": "2026-12-31T00:00:00Z"
    }
    res = client.post("/api/opportunities/", json=create_data, headers=headers)
    assert res.status_code == 400
    assert "Lost reason is required" in res.json()["detail"]

def test_opportunity_won_locked(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["mgr_a"].email)
    comp_id = test_data["comp1"].id
    emp_id = test_data["mgr_a"].id
    
    acc = Account(name="Acc", code="123", company_id=comp_id, owner_id=emp_id, status="Active")
    db_session.add(acc)
    db_session.commit()
    
    # Create won opp
    opp = Opportunity(expected_revenue=100.0, expected_close_date=datetime(2026, 12, 31), name="Won Opp", account_id=acc.id, owner_id=emp_id, company_id=comp_id, stage="Won", status="Won", probability=100)
    db_session.add(opp)
    db_session.commit()
    
    # Try updating
    res = client.put(f"/api/opportunities/{opp.id}", json={"name": "Changed"}, headers=headers)
    assert res.status_code == 400
    assert "Won opportunities are locked" in res.json()["detail"]

def test_opportunity_probability_calculation(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["mgr_a"].email)
    comp_id = test_data["comp1"].id
    emp_id = test_data["mgr_a"].id
    
    acc = Account(name="Acc", code="123", company_id=comp_id, owner_id=emp_id, status="Active")
    db_session.add(acc)
    db_session.commit()
    
    create_data = {
        "name": "Test Opp",
        "account_id": acc.id,
        "owner_id": emp_id,
        "stage": "Proposal",
        "expected_revenue": 1000,
        "expected_close_date": "2026-12-31T00:00:00Z"
    }
    res = client.post("/api/opportunities/", json=create_data, headers=headers)
    assert res.status_code == 200
    assert res.json()["probability"] == 60
    assert res.json()["status"] == "Active"

def test_opportunity_employee_cannot_close(client, test_data, db_session):
    headers = get_auth_headers(client, test_data["emp_a1"].email)
    comp_id = test_data["comp1"].id
    emp_id = test_data["emp_a1"].id
    
    acc = Account(name="Acc", code="123", company_id=comp_id, owner_id=emp_id, status="Active")
    db_session.add(acc)
    db_session.commit()
    
    opp = Opportunity(expected_revenue=100.0, expected_close_date=datetime(2026, 12, 31), name="Test Opp", account_id=acc.id, owner_id=emp_id, company_id=comp_id, stage="Proposal", status="Active", probability=60)
    db_session.add(opp)
    db_session.commit()
    
    res = client.put(f"/api/opportunities/{opp.id}", json={"stage": "Won"}, headers=headers)
    assert res.status_code == 403
    assert "Employees cannot Close Won" in res.json()["detail"]
