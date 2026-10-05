from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional
from datetime import datetime

class ContactBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    designation: Optional[str] = Field(None, max_length=100)
    mobile_number: str = Field(..., max_length=20)
    alternate_number: Optional[str] = Field(None, max_length=20)
    email_address: Optional[EmailStr] = None
    account_id: int
    customer_id: Optional[int] = None
    owner_id: int
    status: Optional[str] = "Active"
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    designation: Optional[str] = Field(None, max_length=100)
    mobile_number: Optional[str] = Field(None, max_length=20)
    alternate_number: Optional[str] = Field(None, max_length=20)
    email_address: Optional[EmailStr] = None
    account_id: Optional[int] = None
    customer_id: Optional[int] = None
    owner_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ContactResponse(ContactBase):
    id: int
    company_id: int
    created_date: datetime
    
    model_config = ConfigDict(from_attributes=True)
