from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, verify_record_access, require_role, get_team_member_ids
from app.models.employee import Employee
from app.models.account import Account
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse

router = APIRouter()

VALID_ACTIVITY_TYPES = [
    'Call', 'Follow-Up', 'Customer Visit', 'Visit', 'Discussion', 
    'Note', 'Meeting Follow-Up', 'Email', 'Demo'
]
VALID_STATUSES = ['Created', 'Scheduled', 'Completed', 'Cancelled']

def validate_related_records(db: Session, company_id: int, 
                             account_id: int, 
                             contact_id: Optional[int], 
                             opportunity_id: Optional[int], 
                             assigned_employee_id: int,
                             current_user: Employee):
    # Account validation
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Account Required")
    if account.status != "Active":
        raise HTTPException(status_code=400, detail="Account is not active")
    if current_user.role != "Super Admin" and account.company_id != company_id:
        raise HTTPException(status_code=400, detail="Account belongs to a different company")

    # Contact validation
    if contact_id:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if not contact:
            raise HTTPException(status_code=400, detail="Contact not found")
        if contact.status != "Active":
            raise HTTPException(status_code=400, detail="Contact is not active")
        if current_user.role != "Super Admin" and contact.company_id != company_id:
            raise HTTPException(status_code=400, detail="Contact belongs to a different company")
    
    # Opportunity validation
    if opportunity_id:
        opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=400, detail="Opportunity not found")
        # Opportunity doesn't have an explicit 'status' Active in earlier phases, we might check stage not being lost, but let's assume it exists. If there's no active flag, just checking existence and company_id.
        if current_user.role != "Super Admin" and opportunity.company_id != company_id:
            raise HTTPException(status_code=400, detail="Opportunity belongs to a different company")
            
    # Assigned Employee validation
    assigned = db.query(Employee).filter(Employee.id == assigned_employee_id).first()
    if not assigned:
        raise HTTPException(status_code=400, detail="Employee not found")
    if assigned.status != "Active":
        raise HTTPException(status_code=400, detail="Employee Inactive")
    if current_user.role != "Super Admin" and assigned.company_id != company_id:
        raise HTTPException(status_code=400, detail="Employee belongs to a different company")


@router.post("/", response_model=ActivityResponse)
def create_activity(
    activity_in: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if activity_in.activity_type not in VALID_ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid Activity Type")
    if activity_in.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid Status")
        
    # Future due date validation
    # Handle timezone awareness (FastAPI usually parses datetime as naive or UTC depending on input)
    if activity_in.due_date.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid Date: Due Date must be in the future")
        
    company_id = current_user.company_id
    # If Super Admin creating for another company, we might need company_id in payload, 
    # but based on SRS, usually inherits from current_user or Account. Let's inherit from Account if provided, but Account must be validated against something.
    # Actually, we should stick to user's company_id unless specified (Super Admin cross company).
    # Since company_id is not in ActivityCreate, we use current_user.company_id.
    
    if current_user.role == "Super Admin":
        # Get company from account
        account = db.query(Account).filter(Account.id == activity_in.account_id).first()
        if not account:
            raise HTTPException(status_code=400, detail="Account Required")
        company_id = account.company_id

    validate_related_records(db, company_id, 
                             activity_in.account_id, 
                             activity_in.contact_id, 
                             activity_in.opportunity_id, 
                             activity_in.assigned_employee_id,
                             current_user)
                             
    # If creating for another employee, verify permissions
    if activity_in.assigned_employee_id != current_user.id:
        if current_user.role == "Employee":
            raise HTTPException(status_code=403, detail="Employees can only assign activities to themselves")
        elif current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if activity_in.assigned_employee_id not in team_ids:
                raise HTTPException(status_code=403, detail="Managers can only assign activities to team members")

    new_activity = Activity(
        **activity_in.dict(),
        company_id=company_id
    )
    
    try:
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        return new_activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Save Failed")

@router.get("/", response_model=List[ActivityResponse])
def get_activities(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    activity_type: Optional[str] = None,
    status: Optional[str] = None,
    assigned_employee_id: Optional[int] = None,
    account_id: Optional[int] = None
):
    query = db.query(Activity)
    
    if current_user.role != "Super Admin":
        query = query.filter(Activity.company_id == current_user.company_id)
        
    if current_user.role == "Employee":
        query = query.filter(Activity.assigned_employee_id == current_user.id)
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Activity.assigned_employee_id.in_(team_ids))
        
    if activity_type:
        query = query.filter(Activity.activity_type == activity_type)
    if status:
        query = query.filter(Activity.status == status)
    if assigned_employee_id:
        query = query.filter(Activity.assigned_employee_id == assigned_employee_id)
    if account_id:
        query = query.filter(Activity.account_id == account_id)
        
    return query.order_by(Activity.due_date.asc()).offset(skip).limit(limit).all()

@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    verify_record_access(db, current_user, activity.company_id, activity.assigned_employee_id)
    return activity

@router.put("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    activity_in: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    verify_record_access(db, current_user, activity.company_id, activity.assigned_employee_id)
    
    if activity.status == "Completed":
        raise HTTPException(status_code=400, detail="Cannot edit a completed activity")
        
    if activity.status == "Cancelled" and activity_in.status in ["Created", "Scheduled"]:
        raise HTTPException(status_code=400, detail="Cannot reopen a cancelled activity")
        
    update_data = activity_in.dict(exclude_unset=True)
    
    if "activity_type" in update_data and update_data["activity_type"] not in VALID_ACTIVITY_TYPES:
        raise HTTPException(status_code=400, detail="Invalid Activity Type")
        
    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid Status")
        
    if "due_date" in update_data:
        if update_data["due_date"].replace(tzinfo=None) < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid Date: Due Date must be in the future")
            
    if "assigned_employee_id" in update_data and update_data["assigned_employee_id"] != activity.assigned_employee_id:
        if current_user.role == "Employee":
            raise HTTPException(status_code=403, detail="Employees cannot reassign activities")
        elif current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if update_data["assigned_employee_id"] not in team_ids:
                raise HTTPException(status_code=403, detail="Managers can only assign to team members")
                
    # Re-validate related records if any of them are being updated
    new_account = update_data.get("account_id", activity.account_id)
    new_contact = update_data.get("contact_id", activity.contact_id)
    new_opp = update_data.get("opportunity_id", activity.opportunity_id)
    new_assigned = update_data.get("assigned_employee_id", activity.assigned_employee_id)
    
    if any(k in update_data for k in ["account_id", "contact_id", "opportunity_id", "assigned_employee_id"]):
        validate_related_records(db, activity.company_id, new_account, new_contact, new_opp, new_assigned, current_user)

    try:
        for key, value in update_data.items():
            setattr(activity, key, value)
        db.commit()
        db.refresh(activity)
        return activity
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Save Failed")

@router.delete("/{activity_id}")
def delete_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin"]))
):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
        
    try:
        db.delete(activity)
        db.commit()
        return {"detail": "Activity deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Save Failed")
