from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.tracking import VisitStatus, VisitOutcome

# Location Schema
class LocationBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None

# Check-In
class CheckInCreate(LocationBase):
    device_information: Optional[str] = None
    remarks: Optional[str] = None

class CheckInResponse(BaseModel):
    id: int
    employee_id: int
    company_id: int
    check_in_date: date
    check_in_time: datetime
    latitude: float
    longitude: float
    address: str
    device_information: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Check-Out
class CheckOutCreate(LocationBase):
    remarks: Optional[str] = None

class CheckOutResponse(BaseModel):
    id: int
    check_in_id: int
    employee_id: int
    company_id: int
    check_out_date: date
    check_out_time: datetime
    latitude: float
    longitude: float
    address: str
    working_hours: float
    remarks: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Tracking Status
class TrackingStatusResponse(BaseModel):
    is_checked_in: bool
    is_checked_out: bool
    active_check_in_id: Optional[int] = None
    check_in_time: Optional[datetime] = None

# Employee Location
class EmployeeLocationCreate(LocationBase):
    pass

class EmployeeLocationResponse(BaseModel):
    id: int
    employee_id: int
    company_id: int
    check_in_id: int
    latitude: float
    longitude: float
    address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Visit
class VisitBase(BaseModel):
    customer_id: int
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    visit_date: date
    remarks: Optional[str] = None

class VisitCreate(VisitBase):
    pass

class VisitUpdate(BaseModel):
    customer_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    visit_date: Optional[date] = None
    remarks: Optional[str] = None

class VisitStart(LocationBase):
    pass

class VisitComplete(LocationBase):
    outcome: VisitOutcome
    remarks: Optional[str] = None

class VisitResponse(BaseModel):
    id: int
    employee_id: int
    company_id: int
    customer_id: int
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    check_in_id: Optional[int] = None
    visit_date: date
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: VisitStatus
    outcome: Optional[VisitOutcome] = None
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
