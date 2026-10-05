from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
import re

LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"]
LEAD_SOURCES = [
    "Website", "Referral", "Social Media", "Advertisement",
    "Walk-In", "Cold Call", "Existing Customer", "Employee Reference", "Trade Show", "Partner", "Other"
]

class LeadBase(BaseModel):
    lead_name: str = Field(..., max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    contact_person: str = Field(..., max_length=200)
    mobile_number: str = Field(..., min_length=10, max_length=15)
    email_address: Optional[EmailStr] = None
    lead_source: str = Field(..., max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    status: str = Field(default="New", max_length=50)
    expected_revenue: Optional[Decimal] = Field(None, ge=0)
    remarks: Optional[str] = None
    assigned_employee_id: int
    company_id: Optional[int] = None

    @validator('mobile_number')
    def validate_mobile_number(cls, v):
        if v and not re.match(r'^\+?[\d\-\s]+$', v):
            raise ValueError('Mobile Number must contain only digits, +, -, and spaces')
        return v

    @validator('status')
    def validate_status(cls, v):
        if v not in LEAD_STATUSES:
            raise ValueError(f'Status must be one of {LEAD_STATUSES}')
        return v

    @validator('lead_source')
    def validate_lead_source(cls, v):
        if v not in LEAD_SOURCES:
            raise ValueError(f'Lead Source must be one of {LEAD_SOURCES}')
        return v

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    lead_name: Optional[str] = Field(None, max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    contact_person: Optional[str] = Field(None, max_length=200)
    mobile_number: Optional[str] = Field(None, min_length=10, max_length=15)
    email_address: Optional[EmailStr] = None
    lead_source: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=50)
    expected_revenue: Optional[Decimal] = Field(None, ge=0)
    remarks: Optional[str] = None
    assigned_employee_id: Optional[int] = None
    company_id: Optional[int] = None

    @validator('mobile_number')
    def validate_mobile_number(cls, v):
        if v and not re.match(r'^\+?[\d\-\s]+$', v):
            raise ValueError('Mobile Number must contain only digits, +, -, and spaces')
        return v

    @validator('status')
    def validate_status(cls, v):
        if v and v not in LEAD_STATUSES:
            raise ValueError(f'Status must be one of {LEAD_STATUSES}')
        return v

    @validator('lead_source')
    def validate_lead_source(cls, v):
        if v and v not in LEAD_SOURCES:
            raise ValueError(f'Lead Source must be one of {LEAD_SOURCES}')
        return v

class LeadResponse(LeadBase):
    id: int
    company_id: int
    created_date: datetime
    updated_date: datetime

    class Config:
        from_attributes = True
