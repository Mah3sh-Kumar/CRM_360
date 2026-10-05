from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.lead import Lead
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse
from app.api.deps import get_current_user, require_role, get_team_member_ids

router = APIRouter()

@router.get("/", response_model=List[LeadResponse])
def get_leads(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    query = db.query(Lead)
    
    if current_user.role == "Super Admin":
        pass
    elif current_user.role == "Company Admin":
        query = query.filter(Lead.company_id == current_user.company_id)
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Lead.company_id == current_user.company_id, Lead.assigned_employee_id.in_(team_ids))
    elif current_user.role == "Employee":
        query = query.filter(Lead.company_id == current_user.company_id, Lead.assigned_employee_id == current_user.id)
        
    if search:
        query = query.filter(Lead.lead_name.contains(search) | Lead.contact_person.contains(search) | Lead.mobile_number.contains(search) | Lead.email_address.contains(search))
        
    return query.offset(skip).limit(limit).all()

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        
    if current_user.role != "Super Admin":
        if lead.company_id != current_user.company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Different company.")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if lead.assigned_employee_id not in team_ids:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not owned by your team.")
        elif current_user.role == "Employee":
            if lead.assigned_employee_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You do not own this lead.")

    return lead

@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Company rules
    if current_user.role != "Super Admin":
        if lead_in.company_id is not None and lead_in.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Cannot create lead for another company")
        lead_in.company_id = current_user.company_id
    else:
        if lead_in.company_id is None:
            raise HTTPException(status_code=400, detail="company_id is required for Super Admin")
            
    company = db.query(Company).filter(Company.id == lead_in.company_id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Invalid company_id")
    if company.status != "Active":
        raise HTTPException(status_code=400, detail="Cannot create lead in an inactive company")

    # Ownership rules
    owner = db.query(Employee).filter(Employee.id == lead_in.assigned_employee_id).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Invalid assigned_employee_id")
    if owner.company_id != lead_in.company_id:
        raise HTTPException(status_code=400, detail="Employee must belong to the same company as the lead")
    if owner.status != "Active":
        raise HTTPException(status_code=400, detail="Assigned employee must be Active")

    # Employee restriction: can only assign to themselves
    if current_user.role == "Employee" and lead_in.assigned_employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Employees can only assign leads to themselves")
    
    # Manager restriction: can only assign to team
    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        if lead_in.assigned_employee_id not in team_ids:
            raise HTTPException(status_code=403, detail="Managers can only assign leads to their team members")

    # Duplicate checking
    duplicate = db.query(Lead).filter(
        Lead.company_id == lead_in.company_id,
        Lead.mobile_number == lead_in.mobile_number
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Lead with this mobile number already exists")

    if lead_in.email_address:
        duplicate_email = db.query(Lead).filter(
            Lead.company_id == lead_in.company_id,
            Lead.email_address == lead_in.email_address
        ).first()
        if duplicate_email:
            raise HTTPException(status_code=400, detail="Lead with this email address already exists")
            
    db_lead = Lead(**lead_in.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    # Access control
    if current_user.role != "Super Admin":
        if db_lead.company_id != current_user.company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if db_lead.assigned_employee_id not in team_ids:
                raise HTTPException(status_code=403, detail="Access denied. Not in your team.")
        elif current_user.role == "Employee":
            if db_lead.assigned_employee_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied. You do not own this lead.")

    # Employees cannot change ownership (SRS 21.5 Assign Lead: Employee - No)
    if current_user.role == "Employee" and lead_in.assigned_employee_id is not None and lead_in.assigned_employee_id != db_lead.assigned_employee_id:
        raise HTTPException(status_code=403, detail="Employees cannot reassign lead ownership")

    # Employees cannot change company_id (nobody should really, but just in case)
    if lead_in.company_id is not None and lead_in.company_id != db_lead.company_id:
        raise HTTPException(status_code=403, detail="Cannot change company ownership of a lead")

    # Validations for new assigned employee
    if lead_in.assigned_employee_id is not None and lead_in.assigned_employee_id != db_lead.assigned_employee_id:
        new_owner = db.query(Employee).filter(Employee.id == lead_in.assigned_employee_id).first()
        if not new_owner:
            raise HTTPException(status_code=400, detail="Invalid assigned_employee_id")
        if new_owner.company_id != db_lead.company_id:
            raise HTTPException(status_code=400, detail="Employee must belong to the same company")
        if new_owner.status != "Active":
            raise HTTPException(status_code=400, detail="Assigned employee must be Active")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if lead_in.assigned_employee_id not in team_ids:
                raise HTTPException(status_code=403, detail="Managers can only assign leads within their team")

    # Duplicate checking if mobile or email is updated
    if lead_in.mobile_number is not None and lead_in.mobile_number != db_lead.mobile_number:
        duplicate = db.query(Lead).filter(
            Lead.company_id == db_lead.company_id,
            Lead.mobile_number == lead_in.mobile_number
        ).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Lead with this mobile number already exists")

    if lead_in.email_address is not None and lead_in.email_address != db_lead.email_address:
        duplicate_email = db.query(Lead).filter(
            Lead.company_id == db_lead.company_id,
            Lead.email_address == lead_in.email_address
        ).first()
        if duplicate_email:
            raise HTTPException(status_code=400, detail="Lead with this email address already exists")

    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_lead, field, value)

    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin"]))
):
    # Only Super Admin can delete leads according to SRS 21.5
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    db.delete(db_lead)
    db.commit()
    return None
