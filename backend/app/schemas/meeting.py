from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    meeting_type: Literal[
        "Customer Meeting", 
        "Internal Meeting", 
        "Sales Meeting", 
        "Requirement Discussion", 
        "Project Discussion", 
        "Review Meeting"
    ]
    related_module: Optional[str] = None
    related_record_id: Optional[int] = None
    organizer_id: int
    start_datetime: datetime
    end_datetime: datetime
    location: Optional[str] = None
    agenda: Optional[str] = None

class MeetingCreate(MeetingBase):
    participant_ids: List[int] = Field(..., min_items=1)

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    meeting_type: Optional[Literal[
        "Customer Meeting", 
        "Internal Meeting", 
        "Sales Meeting", 
        "Requirement Discussion", 
        "Project Discussion", 
        "Review Meeting"
    ]] = None
    related_module: Optional[str] = None
    related_record_id: Optional[int] = None
    organizer_id: Optional[int] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    agenda: Optional[str] = None
    participant_ids: Optional[List[int]] = None

class MeetingResponse(MeetingBase):
    id: int
    company_id: int
    status: str
    created_date: datetime
    updated_date: datetime
    
    class Config:
        from_attributes = True

class MeetingDetailResponse(MeetingResponse):
    participant_ids: List[int]
    
    class Config:
        from_attributes = True
