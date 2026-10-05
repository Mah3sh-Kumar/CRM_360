from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

class EmployeeBase(BaseModel):
    employee_code: str
    name: str
    email: str
    mobile: str
    role: str = Field(..., description="Super Admin, Company Admin, Manager, Employee")
    company_id: Optional[int] = None
    designation: str
    manager_id: Optional[int] = None
    date_of_joining: date
    gps_tracking_enabled: bool = True
    status: str = "Active"

class EmployeeCreate(EmployeeBase):
    password: str

class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    role: Optional[str] = None
    company_id: Optional[int] = None
    designation: Optional[str] = None
    manager_id: Optional[int] = None
    date_of_joining: Optional[date] = None
    gps_tracking_enabled: Optional[bool] = None
    status: Optional[str] = None
    password: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    created_date: datetime

    class Config:
        from_attributes = True
