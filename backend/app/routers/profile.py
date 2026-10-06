from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.core.database import get_db
from app.models.employee import Employee
from app.models.company import Company
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.customer import Customer
from app.models.task import Task
from app.models.tracking import Visit, CheckIn
from app.models.meeting import Meeting
from app.models.account import Account
from app.api.deps import get_current_user, get_team_member_ids
from app.core.security import get_password_hash, verify_password

router = APIRouter()

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

@router.put("/")
def update_profile(
    update_data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if update_data.email and update_data.email != current_user.email:
        if db.query(Employee).filter(Employee.email == update_data.email, Employee.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = update_data.email
        
    if update_data.name:
        current_user.name = update_data.name
    if update_data.mobile:
        current_user.mobile = update_data.mobile

    db.commit()
    db.refresh(current_user)
    
    # Audit log
    from app.models.audit_log import AuditLog
    audit_entry = AuditLog(
        company_id=current_user.company_id,
        module="Profile",
        record_id=current_user.id,
        action="Updated",
        user_id=current_user.id,
        ip_address="127.0.0.1" 
    )
    db.add(audit_entry)
    db.commit()
    
    return {"status": "success", "message": "Profile updated successfully"}

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
        
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    current_user.hashed_password = get_password_hash(data.new_password)
    
    # Audit log
    from app.models.audit_log import AuditLog
    audit_entry = AuditLog(
        company_id=current_user.company_id,
        module="Profile",
        record_id=current_user.id,
        action="Password Changed",
        user_id=current_user.id,
        ip_address="127.0.0.1" 
    )
    db.add(audit_entry)
    db.commit()
    
    return {"status": "success", "message": "Password changed successfully"}

@router.get("/stats")
def get_profile_stats(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    stats = {}
    
    def apply_filters(query, model, role=None, user_id=None):
        if role != "Super Admin" and hasattr(model, 'company_id'):
            query = query.filter(model.company_id == current_user.company_id)
        if user_id is not None:
            if hasattr(model, 'assigned_employee_id'):
                query = query.filter(model.assigned_employee_id == user_id)
            elif hasattr(model, 'owner_id'):
                query = query.filter(model.owner_id == user_id)
            elif hasattr(model, 'assigned_to_id'):
                query = query.filter(model.assigned_to_id == user_id)
            elif hasattr(model, 'employee_id'):
                query = query.filter(model.employee_id == user_id)
            elif hasattr(model, 'organizer_id'):
                query = query.filter(model.organizer_id == user_id)
        return query
        
    def apply_team_filters(query, model, team_ids):
        if hasattr(model, 'assigned_employee_id'):
            query = query.filter(model.assigned_employee_id.in_(team_ids))
        elif hasattr(model, 'owner_id'):
            query = query.filter(model.owner_id.in_(team_ids))
        elif hasattr(model, 'assigned_to_id'):
            query = query.filter(model.assigned_to_id.in_(team_ids))
        elif hasattr(model, 'employee_id'):
            query = query.filter(model.employee_id.in_(team_ids))
        elif hasattr(model, 'organizer_id'):
            query = query.filter(model.organizer_id.in_(team_ids))
        return query

    if current_user.role == "Employee":
        stats["assignedLeads"] = apply_filters(db.query(func.count(Lead.id)).filter(Lead.status.notin_(["Won", "Lost"])), Lead, role="Employee", user_id=current_user.id).scalar() or 0
        stats["openOpportunities"] = apply_filters(db.query(func.count(Opportunity.id)).filter(Opportunity.stage != "Lost"), Opportunity, role="Employee", user_id=current_user.id).scalar() or 0
        stats["pendingTasks"] = apply_filters(db.query(func.count(Task.id)).filter(Task.status != "Completed"), Task, role="Employee", user_id=current_user.id).scalar() or 0
        stats["upcomingMeetings"] = apply_filters(db.query(func.count(Meeting.id)).filter(Meeting.status == "Scheduled"), Meeting, role="Employee", user_id=current_user.id).scalar() or 0
        stats["completedVisits"] = apply_filters(db.query(func.count(Visit.id)).filter(Visit.status == "Completed"), Visit, role="Employee", user_id=current_user.id).scalar() or 0
        stats["attendanceSummary"] = apply_filters(db.query(func.count(CheckIn.id)), CheckIn, role="Employee", user_id=current_user.id).scalar() or 0

    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        stats["teamSize"] = len(team_ids)
        stats["teamLeads"] = apply_team_filters(apply_filters(db.query(func.count(Lead.id)), Lead, role="Manager"), Lead, team_ids).scalar() or 0
        stats["teamOpportunities"] = apply_team_filters(apply_filters(db.query(func.count(Opportunity.id)), Opportunity, role="Manager"), Opportunity, team_ids).scalar() or 0
        stats["teamTasks"] = apply_team_filters(apply_filters(db.query(func.count(Task.id)), Task, role="Manager"), Task, team_ids).scalar() or 0
        stats["teamMeetings"] = apply_team_filters(apply_filters(db.query(func.count(Meeting.id)), Meeting, role="Manager"), Meeting, team_ids).scalar() or 0
        stats["teamAttendance"] = apply_team_filters(apply_filters(db.query(func.count(CheckIn.id)), CheckIn, role="Manager"), CheckIn, team_ids).scalar() or 0

    elif current_user.role == "Company Admin":
        stats["companyEmployees"] = apply_filters(db.query(func.count(Employee.id)), Employee, role="Company Admin").scalar() or 0
        stats["activeEmployees"] = apply_filters(db.query(func.count(Employee.id)).filter(Employee.status == "Active"), Employee, role="Company Admin").scalar() or 0
        stats["customers"] = apply_filters(db.query(func.count(Customer.id)), Customer, role="Company Admin").scalar() or 0
        stats["accounts"] = apply_filters(db.query(func.count(Account.id)), Account, role="Company Admin").scalar() or 0
        stats["leads"] = apply_filters(db.query(func.count(Lead.id)), Lead, role="Company Admin").scalar() or 0
        stats["opportunities"] = apply_filters(db.query(func.count(Opportunity.id)), Opportunity, role="Company Admin").scalar() or 0

    elif current_user.role == "Super Admin":
        stats["totalCompanies"] = db.query(func.count(Company.id)).scalar() or 0
        stats["totalEmployees"] = db.query(func.count(Employee.id)).scalar() or 0
        stats["totalCustomers"] = db.query(func.count(Customer.id)).scalar() or 0
        stats["totalAccounts"] = db.query(func.count(Account.id)).scalar() or 0
        stats["totalLeads"] = db.query(func.count(Lead.id)).scalar() or 0
        stats["totalOpportunities"] = db.query(func.count(Opportunity.id)).scalar() or 0

    return stats
