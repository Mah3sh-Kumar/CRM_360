from typing import Generator, Optional, List, Set
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.employee import Employee
from app.core.security import ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Employee:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(Employee).filter(Employee.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if user.status != "Active":
        raise HTTPException(status_code=403, detail="Inactive user")
        
    try:
        from app.core.audit import audit_context
        ctx = audit_context.get()
        ctx["user_id"] = user.id
        ctx["company_id"] = user.company_id
    except LookupError:
        pass
        
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Employee = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return user

def require_role(allowed_roles: List[str]):
    return RoleChecker(allowed_roles)

def require_company_access(user: Employee, target_company_id: int):
    """Ensure the user has access to the target company."""
    if user.role == "Super Admin":
        return True
    if user.company_id != target_company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this company's data"
        )
    return True

def get_team_member_ids(db: Session, manager_id: int) -> Set[int]:
    """Get all employee IDs in the manager's hierarchy (including themselves)."""
    team_ids = {manager_id}
    current_level = [manager_id]
    
    while current_level:
        emps = db.query(Employee.id).filter(Employee.manager_id.in_(current_level)).all()
        next_level = [e.id for e in emps if e.id not in team_ids]
        team_ids.update(next_level)
        current_level = next_level
        
    return team_ids

def verify_record_access(db: Session, user: Employee, record_company_id: int, record_owner_id: Optional[int] = None):
    """
    General verification for record access:
    1. Check company access.
    2. If role is Employee, owner must be themselves.
    3. If role is Manager, owner must be in their team.
    4. If role is Company Admin or Super Admin, company access is enough.
    """
    require_company_access(user, record_company_id)
    
    if user.role in ["Super Admin", "Company Admin"]:
        return True
        
    if record_owner_id is not None:
        if user.role == "Employee":
            if record_owner_id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You do not own this record."
                )
        elif user.role == "Manager":
            team_ids = get_team_member_ids(db, user.id)
            if record_owner_id not in team_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Record belongs to a user outside your team."
                )
    return True
