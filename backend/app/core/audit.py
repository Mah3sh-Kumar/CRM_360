
import json
from contextvars import ContextVar
from typing import Optional, Dict, Any
from sqlalchemy import event, insert, inspect
from sqlalchemy.orm import Session
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.models.audit_log import AuditLog
from app.models.company import Company
from app.models.employee import Employee
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.account import Account
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.task import Task
from app.models.meeting import Meeting
from app.models.tracking import CheckIn, CheckOut, Visit

audit_context: ContextVar[Dict[str, Any]] = ContextVar("audit_context", default={})

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        ip_address = request.client.host if request.client else "127.0.0.1"
        if "x-forwarded-for" in request.headers:
            ip_address = request.headers["x-forwarded-for"].split(",")[0].strip()
        
        ctx = {"ip_address": ip_address, "user_id": None, "company_id": None}
        token = audit_context.set(ctx)
        
        response = await call_next(request)
        
        audit_context.reset(token)
        return response

def safe_serialize(obj: Any) -> Optional[str]:
    if obj is None:
        return None
    try:
        return json.dumps(obj, default=str)
    except Exception:
        return str(obj)

def get_object_state(obj) -> dict:
    state = {}
    mapper = inspect(type(obj))
    for column in mapper.columns:
        if column.name in ["hashed_password"]:
            continue
        state[column.name] = getattr(obj, column.name)
    return state

AUDIT_MODELS = (Company, Employee, Customer, Lead, Account, Contact, Opportunity, Activity, Task, Meeting, CheckIn, CheckOut, Visit)

@event.listens_for(Session, "after_flush")
def audit_after_flush(session: Session, flush_context):
    try:
        ctx = audit_context.get()
    except LookupError:
        ctx = {}
    
    user_id = ctx.get("user_id")
    company_id = ctx.get("company_id")
    ip_address = ctx.get("ip_address", "127.0.0.1")
    
    audit_records = []
    
    for obj in session.new:
        if isinstance(obj, AUDIT_MODELS):
            action = "CREATE"
            if isinstance(obj, CheckIn): action = "CHECK_IN"
            elif isinstance(obj, CheckOut): action = "CHECK_OUT"
            elif isinstance(obj, Visit):
                if getattr(obj, "status", None) == "Started": action = "START"
                elif getattr(obj, "status", None) == "Completed": action = "COMPLETE"

            state = get_object_state(obj)
            c_id = getattr(obj, 'company_id', company_id)
            
            audit_records.append({
                "company_id": c_id,
                "module": obj.__class__.__name__,
                "record_id": getattr(obj, "id", 0),
                "action": action,
                "previous_value": None,
                "new_value": safe_serialize(state),
                "user_id": user_id,
                "ip_address": ip_address
            })
            
    for obj in session.dirty:
        if isinstance(obj, AUDIT_MODELS):
            state = get_object_state(obj)
            hist = inspect(obj).attrs
            prev_state = {}
            for key, attr in hist.items():
                if attr.history.has_changes():
                    prev_val = attr.history.deleted[0] if attr.history.deleted else None
                    prev_state[key] = prev_val
            
            if not prev_state:
                continue # No actual changes
                
            action = "UPDATE"
            if isinstance(obj, Lead) and "status" in prev_state and getattr(obj, "status") == "Converted":
                action = "CONVERT"
            elif isinstance(obj, Opportunity) and "status" in prev_state:
                if getattr(obj, "status") == "Won": action = "WON"
                elif getattr(obj, "status") == "Lost": action = "LOST"
            elif isinstance(obj, (Activity, Task, Meeting)) and "status" in prev_state and getattr(obj, "status") == "Completed":
                action = "COMPLETE"
            elif isinstance(obj, Visit) and "status" in prev_state and getattr(obj, "status") == "Completed":
                action = "COMPLETE"
                
            c_id = getattr(obj, 'company_id', company_id)
                
            audit_records.append({
                "company_id": c_id,
                "module": obj.__class__.__name__,
                "record_id": getattr(obj, "id", 0),
                "action": action,
                "previous_value": safe_serialize(prev_state),
                "new_value": safe_serialize(state),
                "user_id": user_id,
                "ip_address": ip_address
            })
            
    for obj in session.deleted:
        if isinstance(obj, AUDIT_MODELS):
            state = get_object_state(obj)
            c_id = getattr(obj, 'company_id', company_id)
            audit_records.append({
                "company_id": c_id,
                "module": obj.__class__.__name__,
                "record_id": getattr(obj, "id", 0),
                "action": "DELETE",
                "previous_value": safe_serialize(state),
                "new_value": None,
                "user_id": user_id,
                "ip_address": ip_address
            })
            
    if audit_records:
        session.execute(insert(AuditLog).values(audit_records))
