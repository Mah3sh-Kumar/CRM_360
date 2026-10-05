from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime

class CompanyBase(BaseModel):
    company_code: str
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    status: Optional[str] = "Active"

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    status: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    created_by: Optional[str] = None
    created_date: datetime
    updated_by: Optional[str] = None
    updated_date: datetime

    class Config:
        from_attributes = True
