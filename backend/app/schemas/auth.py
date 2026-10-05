from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    employee_code: str
    company_id: Optional[int]
    company: Optional[str]
    designation: str
    manager: Optional[str]

    class Config:
        from_attributes = True
