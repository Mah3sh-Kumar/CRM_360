from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional
from datetime import datetime

class AccountBase(BaseModel):
    name: str = Field(..., max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    owner_id: int
    status: Optional[str] = "Active"
    annual_revenue: Optional[float] = Field(None, ge=0)
    address: Optional[str] = None

class AccountCreate(AccountBase):
    code: str = Field(..., max_length=50)

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    email_address: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    owner_id: Optional[int] = None
    status: Optional[str] = None
    annual_revenue: Optional[float] = Field(None, ge=0)
    address: Optional[str] = None

class AccountResponse(AccountBase):
    id: int
    code: str
    company_id: int
    created_date: datetime
    
    model_config = ConfigDict(from_attributes=True)
