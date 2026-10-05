from typing import Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    related_module: Literal["Lead", "Account", "Contact", "Customer", "Opportunity", "Activity", "Meeting"]
    related_record_id: Optional[int] = None
    assigned_to_id: int
    priority: Literal["Low", "Medium", "High", "Critical"]
    due_date: datetime

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[Literal["Low", "Medium", "High", "Critical"]] = None
    due_date: Optional[datetime] = None

class TaskComplete(BaseModel):
    completion_remarks: Optional[str] = None

class TaskAssign(BaseModel):
    assigned_to_id: int

class TaskResponse(TaskBase):
    id: int
    company_id: int
    assigned_by_id: int
    status: str
    completion_remarks: Optional[str] = None
    completed_date: Optional[datetime] = None
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True
