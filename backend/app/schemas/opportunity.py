from pydantic import BaseModel, constr, validator, condecimal
from typing import Optional
from datetime import datetime

class OpportunityBase(BaseModel):
    name: constr(min_length=1, max_length=200)
    account_id: int
    contact_id: Optional[int] = None
    owner_id: int
    stage: str
    expected_revenue: condecimal(gt=0, max_digits=15, decimal_places=2)
    expected_close_date: datetime
    description: Optional[str] = None
    lost_reason: Optional[str] = None

    @validator('stage')
    def validate_stage(cls, v):
        allowed = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Won", "Lost"]
        if v not in allowed:
            raise ValueError(f"stage must be one of {allowed}")
        return v

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    name: Optional[constr(min_length=1, max_length=200)] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    owner_id: Optional[int] = None
    stage: Optional[str] = None
    expected_revenue: Optional[condecimal(gt=0, max_digits=15, decimal_places=2)] = None
    expected_close_date: Optional[datetime] = None
    description: Optional[str] = None
    lost_reason: Optional[str] = None

    @validator('stage')
    def validate_stage(cls, v):
        if v is not None:
            allowed = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Won", "Lost"]
            if v not in allowed:
                raise ValueError(f"stage must be one of {allowed}")
        return v

class OpportunityOut(OpportunityBase):
    id: int
    company_id: int
    status: str
    probability: int
    created_date: datetime

    class Config:
        from_attributes = True
