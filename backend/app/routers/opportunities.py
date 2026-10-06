from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.opportunity import Opportunity
from app.models.employee import Employee
from app.models.account import Account
from app.models.contact import Contact
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, OpportunityOut
from app.api.deps import get_current_user, require_company_access, verify_record_access, get_team_member_ids

router = APIRouter()

def get_stage_info(stage: str):
    mapping = {
        "Prospecting": {"probability": 10, "status": "Active"},
        "Qualification": {"probability": 30, "status": "Active"},
        "Proposal": {"probability": 60, "status": "Active"},
        "Negotiation": {"probability": 80, "status": "Active"},
        "Won": {"probability": 100, "status": "Won"},
        "Lost": {"probability": 0, "status": "Lost"},
    }
    return mapping.get(stage)

@router.post("/", response_model=OpportunityOut)
def create_opportunity(
    opp: OpportunityCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Determine company
    owner = db.query(Employee).filter(Employee.id == opp.owner_id).first()
    if not owner or owner.status != "Active":
        raise HTTPException(status_code=400, detail="Owner must be active employee")
        
    # Validate Account first to get company_id if Super Admin
    account = db.query(Account).filter(Account.id == opp.account_id).first()
    if not account or account.status != "Active":
        raise HTTPException(status_code=400, detail="Account must be active")
        
    if current_user.role != "Super Admin":
        if owner.company_id != current_user.company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company")
        if account.company_id != current_user.company_id:
            raise HTTPException(status_code=400, detail="Account must belong to the same company")
        company_id = current_user.company_id
    else:
        # Super admin can assign to themselves or anyone, use account's company
        company_id = account.company_id
        if owner.role != "Super Admin" and owner.company_id != company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company as the account")

    # Validate Contact
    if opp.contact_id:
        contact = db.query(Contact).filter(Contact.id == opp.contact_id).first()
        if not contact or contact.status != "Active":
            raise HTTPException(status_code=400, detail="Contact must be active")
        if contact.company_id != company_id:
            raise HTTPException(status_code=400, detail="Contact must belong to the same company")

    stage_info = get_stage_info(opp.stage)
    if not stage_info:
        raise HTTPException(status_code=400, detail="Invalid stage")

    if opp.stage == "Lost" and not opp.lost_reason:
        raise HTTPException(status_code=400, detail="Lost reason is required for Lost opportunities")

    new_opp = Opportunity(
        **opp.model_dump(),
        company_id=company_id,
        probability=stage_info["probability"],
        status=stage_info["status"]
    )
    db.add(new_opp)
    db.commit()
    db.refresh(new_opp)
    return new_opp

@router.get("/", response_model=List[OpportunityOut])
def get_opportunities(
    name: Optional[str] = None,
    account_id: Optional[int] = None,
    contact_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    stage: Optional[str] = None,
    status_filter: Optional[str] = None,
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Opportunity)

    if current_user.role != "Super Admin":
        query = query.filter(Opportunity.company_id == current_user.company_id)
    elif company_id:
        query = query.filter(Opportunity.company_id == company_id)

    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Opportunity.owner_id.in_(team_ids))
    elif current_user.role == "Employee":
        query = query.filter(Opportunity.owner_id == current_user.id)

    if name:
        query = query.filter(Opportunity.name.ilike(f"%{name}%"))
    if account_id:
        query = query.filter(Opportunity.account_id == account_id)
    if contact_id:
        query = query.filter(Opportunity.contact_id == contact_id)
    if owner_id:
        query = query.filter(Opportunity.owner_id == owner_id)
    if stage:
        query = query.filter(Opportunity.stage == stage)
    if status_filter:
        query = query.filter(Opportunity.status == status_filter)

    return query.order_by(Opportunity.id.desc()).offset(skip).limit(limit).all()

@router.get("/{opp_id}", response_model=OpportunityOut)
def get_opportunity(
    opp_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    verify_record_access(db, current_user, opp.company_id, opp.owner_id)
    return opp

@router.put("/{opp_id}", response_model=OpportunityOut)
def update_opportunity(
    opp_id: int,
    opp_update: OpportunityUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    verify_record_access(db, current_user, opp.company_id, opp.owner_id)

    if opp.status == "Won":
        raise HTTPException(status_code=400, detail="Won opportunities are locked")

    if opp_update.owner_id is not None:
        if current_user.role == "Employee":
            raise HTTPException(status_code=403, detail="Employees cannot reassign opportunities")
        owner = db.query(Employee).filter(Employee.id == opp_update.owner_id).first()
        if not owner or owner.status != "Active":
            raise HTTPException(status_code=400, detail="Owner must be active")
        if current_user.role != "Super Admin" and owner.company_id != current_user.company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company")

    if opp_update.account_id is not None:
        account = db.query(Account).filter(Account.id == opp_update.account_id).first()
        if not account or account.status != "Active":
            raise HTTPException(status_code=400, detail="Account must be active")
        if account.company_id != opp.company_id:
            raise HTTPException(status_code=400, detail="Account must belong to the same company")

    if opp_update.contact_id is not None:
        contact = db.query(Contact).filter(Contact.id == opp_update.contact_id).first()
        if not contact or contact.status != "Active":
            raise HTTPException(status_code=400, detail="Contact must be active")
        if contact.company_id != opp.company_id:
            raise HTTPException(status_code=400, detail="Contact must belong to the same company")
            
    if opp_update.stage == "Won" and current_user.role == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot Close Won opportunities")
    if opp_update.stage == "Lost" and current_user.role == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot Close Lost opportunities")

    stage_to_use = opp_update.stage if opp_update.stage is not None else opp.stage
    if stage_to_use == "Lost":
        lost_reason_to_use = opp_update.lost_reason if opp_update.lost_reason is not None else opp.lost_reason
        if not lost_reason_to_use:
            raise HTTPException(status_code=400, detail="Lost reason is required for Lost opportunities")

    for key, value in opp_update.model_dump(exclude_unset=True).items():
        setattr(opp, key, value)
        
    if opp_update.stage is not None:
        stage_info = get_stage_info(opp_update.stage)
        opp.probability = stage_info["probability"]
        opp.status = stage_info["status"]

    db.commit()
    db.refresh(opp)
    return opp

@router.delete("/{opp_id}")
def delete_opportunity(
    opp_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can delete opportunities")
        
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    db.delete(opp)
    db.commit()
    return {"detail": "Opportunity deleted successfully"}
