from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.contact import Contact
from app.models.account import Account
from app.models.employee import Employee
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse
from app.api.deps import get_current_user, require_company_access, verify_record_access, get_team_member_ids

router = APIRouter()

@router.post("/", response_model=ContactResponse)
def create_contact(
    contact: ContactCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Validate account
    account = db.query(Account).filter(Account.id == contact.account_id).first()
    if not account:
        raise HTTPException(status_code=400, detail="Account not found")
        
    if current_user.role != "Super Admin" and account.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Cannot assign contact to a foreign account")
        
    # Validate owner
    owner = db.query(Employee).filter(Employee.id == contact.owner_id).first()
    if not owner or owner.status != "Active":
        raise HTTPException(status_code=400, detail="Owner must be active")
        
    if current_user.role != "Super Admin" and owner.company_id != current_user.company_id:
        raise HTTPException(status_code=400, detail="Owner must belong to the same company")
        
    company_id = account.company_id

    new_contact = Contact(
        **contact.model_dump(),
        company_id=company_id
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@router.get("/", response_model=List[ContactResponse])
def get_contacts(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    mobile_number: Optional[str] = None,
    email_address: Optional[str] = None,
    account_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    contact_status: Optional[str] = None,
    company_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Contact)
    
    # Company isolation
    if current_user.role != "Super Admin":
        query = query.filter(Contact.company_id == current_user.company_id)
    elif company_id:
        query = query.filter(Contact.company_id == company_id)
        
    # RBAC filters
    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Contact.owner_id.in_(team_ids))
    elif current_user.role == "Employee":
        query = query.filter(Contact.owner_id == current_user.id)
        
    # Search / Filters
    if first_name:
        query = query.filter(Contact.first_name.ilike(f"%{first_name}%"))
    if last_name:
        query = query.filter(Contact.last_name.ilike(f"%{last_name}%"))
    if mobile_number:
        query = query.filter(Contact.mobile_number.ilike(f"%{mobile_number}%"))
    if email_address:
        query = query.filter(Contact.email_address.ilike(f"%{email_address}%"))
    if account_id:
        query = query.filter(Contact.account_id == account_id)
    if owner_id:
        query = query.filter(Contact.owner_id == owner_id)
    if contact_status:
        query = query.filter(Contact.status == contact_status)
        
    return query.offset(skip).limit(limit).all()

@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    verify_record_access(db, current_user, contact.company_id, contact.owner_id)
    return contact

@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    contact_update: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    verify_record_access(db, current_user, contact.company_id, contact.owner_id)
    
    if contact_update.account_id is not None:
        account = db.query(Account).filter(Account.id == contact_update.account_id).first()
        if not account or (current_user.role != "Super Admin" and account.company_id != current_user.company_id):
            raise HTTPException(status_code=400, detail="Invalid account or access denied")

    if contact_update.owner_id is not None:
        owner = db.query(Employee).filter(Employee.id == contact_update.owner_id).first()
        if not owner or owner.status != "Active":
            raise HTTPException(status_code=400, detail="Owner must be active")
        if current_user.role != "Super Admin" and owner.company_id != current_user.company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company")

    for key, value in contact_update.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
        
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can delete contacts")
        
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    db.delete(contact)
    db.commit()
    return {"detail": "Contact deleted successfully"}
