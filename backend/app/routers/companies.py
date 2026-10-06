from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.api.deps import get_current_user, require_role, require_company_access

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Company)
    
    # RBAC filter
    if current_user.role != "Super Admin":
        query = query.filter(Company.id == current_user.company_id)
        
    if search:
        query = query.filter(Company.name.ilike(f"%{search}%") | Company.company_code.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Company.status == status_filter)
        
    companies = query.order_by(Company.id.desc()).offset(skip).limit(limit).all()
    return companies

@router.get("/{id}", response_model=CompanyResponse)
def get_company(
    id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    require_company_access(current_user, id)
    
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return company

@router.post("/", response_model=CompanyResponse)
def create_company(
    company_in: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin"]))
):
    # Check for duplicate code or name
    if db.query(Company).filter(Company.company_code == company_in.company_code).first():
        raise HTTPException(status_code=400, detail="Company code already exists")
    if db.query(Company).filter(Company.name == company_in.name).first():
        raise HTTPException(status_code=400, detail="Company name already exists")
        
    new_company = Company(
        **company_in.model_dump(),
        created_by=str(current_user.id),
        updated_by=str(current_user.id)
    )
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    return new_company

@router.put("/{id}", response_model=CompanyResponse)
def update_company(
    id: int,
    company_in: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin", "Company Admin"]))
):
    require_company_access(current_user, id)
    
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Check for duplicate name if updating
    if company_in.name and company_in.name != company.name:
        if db.query(Company).filter(Company.name == company_in.name).first():
            raise HTTPException(status_code=400, detail="Company name already exists")
            
    # Restrict status updates to Super Admin
    if company_in.status is not None and company_in.status != company.status:
        if current_user.role != "Super Admin":
            raise HTTPException(status_code=403, detail="Only Super Admin can change company status")

    update_data = company_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
        
    company.updated_by = str(current_user.id)
    company.updated_date = datetime.utcnow()
    
    db.commit()
    db.refresh(company)
    return company
