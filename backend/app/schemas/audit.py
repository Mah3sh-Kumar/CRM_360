
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import json

class AuditLogResponse(BaseModel):
    id: int
    company_id: Optional[int]
    module: str
    record_id: int
    action: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    user_id: Optional[int]
    timestamp: datetime
    ip_address: Optional[str]

    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    total: int
    items: list[AuditLogResponse]
