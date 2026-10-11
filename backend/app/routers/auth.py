from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, Token, UserResponse
from app.api.deps import get_current_user

from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

@router.post("/swagger-login", response_model=Token, include_in_schema=False)
def swagger_login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(Employee).filter(Employee.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Employee).filter(Employee.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != "Active":
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    # Audit log
    from app.models.audit_log import AuditLog
    from fastapi import Request
    audit_entry = AuditLog(
        company_id=user.company_id,
        module="Auth",
        record_id=user.id,
        action="Login",
        user_id=user.id,
        ip_address="127.0.0.1" # or request.client.host if we inject Request
    )
    db.add(audit_entry)
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: Employee = Depends(get_current_user)):
    # Prepare extra fields expected by frontend
    company_name = current_user.company.name if current_user.company else "—"
    manager_name = current_user.manager.name if current_user.manager else "—"
    
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        employee_code=current_user.employee_code,
        company_id=current_user.company_id,
        company=company_name,
        designation=current_user.designation,
        manager=manager_name,
        mobile=current_user.mobile,
        status=current_user.status,
        date_of_joining=str(current_user.date_of_joining)
    )
