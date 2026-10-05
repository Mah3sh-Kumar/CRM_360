from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Iterable
from datetime import date

class ReportResponse(BaseModel):
    title: str
    columns: List[str]
    data: Iterable[Dict[str, Any]]

class ReportFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    employee_id: Optional[int] = None
    company_id: Optional[int] = None
    status: Optional[str] = None
    customer_id: Optional[int] = None
    opportunity_id: Optional[int] = None
    lead_source: Optional[str] = None
