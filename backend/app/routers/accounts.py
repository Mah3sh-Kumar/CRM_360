from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.account import Account
from app.models.employee import Employee
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.api.deps import get_current_user, require_company_access, verify_record_access, get_team_member_ids

router = APIRouter()

@router.post("/", response_model=AccountResponse)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot create accounts")
        
    company_id = current_user.company_id if current_user.role != "Super Admin" else (current_user.company_id)
    # If Super Admin wants to create for another company, they would need a company_id in the payload, but SRS fields don't expose company_id on create form typically. We'll use their own or assume they use the one from owner.
    # The SRS Account Access Matrix says Super Admin can create accounts. 
    # For now, let's derive company_id from the assigned owner to be safe, or just use current_user's if not Super Admin.
    
    owner = db.query(Employee).filter(Employee.id == account.owner_id).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Owner not found")
    if owner.status != "Active":
        raise HTTPException(status_code=400, detail="Owner must be active")
        
    if current_user.role != "Super Admin":
        if owner.company_id != current_user.company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company")
        company_id = current_user.company_id
    else:
        company_id = owner.company_id
        
    # Check duplicate code
    existing_account = db.query(Account).filter(Account.code == account.code).first()
    if existing_account:
        raise HTTPException(status_code=400, detail="Account with this code already exists")

    new_account = Account(
        **account.model_dump(),
        company_id=company_id
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@router.get("/", response_model=List[AccountResponse])
def get_accounts(
    name: Optional[str] = None,
    code: Optional[str] = None,
    owner_id: Optional[int] = None,
    account_status: Optional[str] = None,
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Account)
    
    # Company isolation
    if current_user.role != "Super Admin":
        query = query.filter(Account.company_id == current_user.company_id)
    elif company_id:
        query = query.filter(Account.company_id == company_id)
        
    # RBAC filters
    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Account.owner_id.in_(team_ids))
    elif current_user.role == "Employee":
        query = query.filter(Account.owner_id == current_user.id)
        
    # Search / Filters
    if name:
        query = query.filter(Account.name.ilike(f"%{name}%"))
    if code:
        query = query.filter(Account.code.ilike(f"%{code}%"))
    if owner_id:
        query = query.filter(Account.owner_id == owner_id)
    if account_status:
        query = query.filter(Account.status == account_status)
        
    return query.order_by(Account.id.desc()).offset(skip).limit(limit).all()

@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    verify_record_access(db, current_user, account.company_id, account.owner_id)
    return account

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_update: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    verify_record_access(db, current_user, account.company_id, account.owner_id)
    
    if account_update.owner_id is not None:
        owner = db.query(Employee).filter(Employee.id == account_update.owner_id).first()
        if not owner or owner.status != "Active":
            raise HTTPException(status_code=400, detail="Owner must be active")
        if current_user.role != "Super Admin" and owner.company_id != current_user.company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company")
            
    for key, value in account_update.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
        
    db.commit()
    db.refresh(account)
    return account

@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can delete accounts")
        
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    db.delete(account)
    db.commit()
    return {"detail": "Account deleted successfully"}
