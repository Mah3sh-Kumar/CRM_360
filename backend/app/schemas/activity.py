from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, timezone

class ActivityBase(BaseModel):
    activity_type: str = Field(..., description="Must be one of the allowed activity types")
    subject: Optional[str] = None
    account_id: int
    contact_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    assigned_employee_id: int
    due_date: datetime
    status: str = "Created"
    remarks: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    activity_type: Optional[str] = None
    subject: Optional[str] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    assigned_employee_id: Optional[int] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class ActivityResponse(ActivityBase):
    id: int
    company_id: int
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True
