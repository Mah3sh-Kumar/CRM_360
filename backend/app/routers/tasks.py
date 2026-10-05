from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.models.task import Task
from app.models.employee import Employee
from app.models.company import Company
from app.models.lead import Lead
from app.models.account import Account
from app.models.contact import Contact
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.meeting import Meeting

from app.schemas.task import TaskCreate, TaskUpdate, TaskComplete, TaskAssign, TaskResponse
from app.api.deps import get_current_user, verify_record_access, get_team_member_ids, require_role

router = APIRouter()

def validate_related_record(db: Session, module: str, record_id: int, company_id: int, user: Employee):
    if not record_id:
        return
        
    model_map = {
        "Lead": Lead,
        "Account": Account,
        "Contact": Contact,
        "Customer": Customer,
        "Opportunity": Opportunity,
        "Activity": Activity,
        "Meeting": Meeting
    }
        
    model = model_map.get(module)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid related module: {module}")
        
    record = db.query(model).filter(model.id == record_id).first()
    if not record:
        raise HTTPException(status_code=400, detail="Related record not found")
        
    if record.company_id != company_id:
        raise HTTPException(status_code=403, detail="Related record belongs to a different company")
        
    # Check if record has status and is active (if applicable)
    if hasattr(record, "status") and getattr(record, "status") == "Inactive":
        raise HTTPException(status_code=400, detail="Related record is inactive")
        
    # Basic access check
    owner_id = getattr(record, "assigned_employee_id", None) or getattr(record, "owner_id", None)
    verify_record_access(db, user, record.company_id, owner_id)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if task_in.due_date.replace(tzinfo=None) <= datetime.now():
        raise HTTPException(status_code=400, detail="Due date must be in the future")
        
    # Validate assigned_to employee
    assignee = db.query(Employee).filter(Employee.id == task_in.assigned_to_id).first()
    if not assignee:
        raise HTTPException(status_code=400, detail="Assigned employee not found")
    if assignee.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Cannot assign task to an employee of a different company")
    if assignee.status != "Active":
        raise HTTPException(status_code=400, detail="Assigned employee is inactive")
        
    # Assignment RBAC
    if current_user.role == "Employee":
        if task_in.assigned_to_id != current_user.id:
            raise HTTPException(status_code=403, detail="Employees can only create tasks for themselves")
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        if task_in.assigned_to_id not in team_ids:
            raise HTTPException(status_code=403, detail="Managers can only assign tasks to their team members")
            
    # Validate related record
    if task_in.related_record_id:
        validate_related_record(db, task_in.related_module, task_in.related_record_id, current_user.company_id, current_user)
        
    db_task = Task(
        **task_in.dict(),
        company_id=current_user.company_id,
        assigned_by_id=current_user.id,
        status="Open"
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/", response_model=List[TaskResponse])
def read_tasks(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    related_module: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Task).filter(Task.company_id == current_user.company_id)
    
    if current_user.role == "Employee":
        query = query.filter(Task.assigned_to_id == current_user.id)
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Task.assigned_to_id.in_(team_ids))
        
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if related_module:
        query = query.filter(Task.related_module == related_module)
    if assigned_to_id:
        query = query.filter(Task.assigned_to_id == assigned_to_id)
        
    return query.offset(skip).limit(limit).all()


@router.get("/{task_id}", response_model=TaskResponse)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    verify_record_access(db, current_user, task.company_id, task.assigned_to_id)
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    verify_record_access(db, current_user, task.company_id, task.assigned_to_id)
    
    if task.status == "Completed":
        raise HTTPException(status_code=400, detail="Completed tasks are locked and cannot be edited")
    if task.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cancelled tasks cannot be edited")
        
    if task_in.due_date and task_in.due_date.replace(tzinfo=None) <= datetime.now():
        raise HTTPException(status_code=400, detail="Due date must be in the future")

    for field, value in task_in.dict(exclude_unset=True).items():
        setattr(task, field, value)
        
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: int,
    task_in: TaskComplete,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    verify_record_access(db, current_user, task.company_id, task.assigned_to_id)
    
    if task.status == "Completed":
        raise HTTPException(status_code=400, detail="Task is already completed")
    if task.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot complete a cancelled task")
        
    task.status = "Completed"
    task.completed_date = datetime.now()
    if task_in.completion_remarks is not None:
        task.completion_remarks = task_in.completion_remarks
        
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/cancel", response_model=TaskResponse)
def cancel_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot cancel tasks")
        
    verify_record_access(db, current_user, task.company_id, task.assigned_to_id)
    
    if task.status == "Completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed task")
    if task.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Task is already cancelled")
        
    task.status = "Cancelled"
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: int,
    task_in: TaskAssign,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot reassign tasks")
        
    verify_record_access(db, current_user, task.company_id, task.assigned_to_id)
    
    if task.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot reassign completed or cancelled tasks")
        
    new_assignee = db.query(Employee).filter(Employee.id == task_in.assigned_to_id).first()
    if not new_assignee:
        raise HTTPException(status_code=400, detail="Assigned employee not found")
    if new_assignee.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Cannot assign task to an employee of a different company")
    if new_assignee.status != "Active":
        raise HTTPException(status_code=400, detail="Assigned employee is inactive")
        
    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        if task_in.assigned_to_id not in team_ids:
            raise HTTPException(status_code=403, detail="Managers can only assign tasks to their team members")
            
    task.assigned_to_id = task_in.assigned_to_id
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if current_user.role not in ["Super Admin"]:
        raise HTTPException(status_code=403, detail="Only Super Admin can delete tasks")
        
    verify_record_access(db, current_user, task.company_id, task.assigned_to_id)
    
    db.delete(task)
    db.commit()
