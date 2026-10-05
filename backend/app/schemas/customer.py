from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    customer_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"

class CustomerCreate(CustomerBase):
    owner_id: int
    company_id: int # Often injected server-side or required by API

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    owner_id: Optional[int] = None
    status: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    company_id: int
    owner_id: int
    created_date: datetime
    updated_date: datetime
    
    # Nested info if needed, but simple IDs work fine for now
    
    model_config = {"from_attributes": True}
