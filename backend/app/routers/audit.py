
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.employee import Employee
from app.models.audit_log import AuditLog
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.api.deps import get_current_user, require_role, get_team_member_ids

router = APIRouter()

@router.get("/", response_model=AuditLogListResponse)
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(100, le=500), # Enforce max page size
    module: Optional[str] = None,
    action: Optional[str] = None,
    user_id: Optional[int] = None,
    record_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    query = db.query(AuditLog)
    
    # Isolation
    if current_user.role == "Super Admin":
        pass
    elif current_user.role == "Company Admin":
        query = query.filter(AuditLog.company_id == current_user.company_id)
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(AuditLog.company_id == current_user.company_id, AuditLog.user_id.in_(team_ids))
    elif current_user.role == "Employee":
        query = query.filter(AuditLog.company_id == current_user.company_id, AuditLog.user_id == current_user.id)
        
    if module: query = query.filter(AuditLog.module == module)
    if action: query = query.filter(AuditLog.action == action)
    if user_id: query = query.filter(AuditLog.user_id == user_id)
    if record_id: query = query.filter(AuditLog.record_id == record_id)
    if start_date: query = query.filter(AuditLog.timestamp >= start_date)
    if end_date: query = query.filter(AuditLog.timestamp <= end_date)
    
    total = query.count()
    items = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "items": items}
