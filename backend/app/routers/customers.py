from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.customer import Customer
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.api.deps import get_current_user, require_role, get_team_member_ids

router = APIRouter()

@router.get("/", response_model=List[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    query = db.query(Customer)
    
    if current_user.role == "Super Admin":
        pass
    elif current_user.role == "Company Admin":
        query = query.filter(Customer.company_id == current_user.company_id)
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        # Manager can view their own and team's customers
        query = query.filter(Customer.company_id == current_user.company_id, Customer.owner_id.in_(team_ids))
    elif current_user.role == "Employee":
        query = query.filter(Customer.company_id == current_user.company_id, Customer.owner_id == current_user.id)
        
    if search:
        query = query.filter(Customer.name.contains(search) | Customer.customer_code.contains(search) | Customer.email.contains(search))
        
    return query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
    if current_user.role != "Super Admin":
        if customer.company_id != current_user.company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Different company.")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if customer.owner_id not in team_ids:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not owned by your team.")
        elif current_user.role == "Employee":
            if customer.owner_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. You do not own this customer.")

    return customer

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if db.query(Customer).filter(Customer.customer_code == customer_in.customer_code).first():
        raise HTTPException(status_code=400, detail="Customer code already registered")
        
    # Company rules
    if current_user.role != "Super Admin":
        if customer_in.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Cannot create customer for another company")
        customer_in.company_id = current_user.company_id
        
    company = db.query(Company).filter(Company.id == customer_in.company_id).first()
    if not company:
        raise HTTPException(status_code=400, detail="Invalid company_id")
    if company.status != "Active":
        raise HTTPException(status_code=400, detail="Cannot create customer in an inactive company")
        
    # Ownership rules
    owner = db.query(Employee).filter(Employee.id == customer_in.owner_id).first()
    if not owner:
        raise HTTPException(status_code=400, detail="Invalid owner_id")
    if owner.company_id != customer_in.company_id:
        raise HTTPException(status_code=400, detail="Owner must belong to the same company as the customer")
    if owner.status != "Active":
        raise HTTPException(status_code=400, detail="Assigned owner must be an Active employee")
        
    # Employee restriction: can only assign to themselves or team
    if current_user.role == "Employee" and customer_in.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Employees can only assign customers to themselves")
    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        if customer_in.owner_id not in team_ids:
            raise HTTPException(status_code=403, detail="Managers can only assign customers to their team members")
            
    db_customer = Customer(**customer_in.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Access control
    if current_user.role != "Super Admin":
        if db_customer.company_id != current_user.company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if db_customer.owner_id not in team_ids:
                raise HTTPException(status_code=403, detail="Access denied. Not in your team.")
        elif current_user.role == "Employee":
            if db_customer.owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied. You do not own this customer.")
                
    # Employee restriction: cannot change ownership
    if current_user.role == "Employee" and customer_in.owner_id is not None and customer_in.owner_id != db_customer.owner_id:
        raise HTTPException(status_code=403, detail="Employees cannot reassign customer ownership")

    # Validations
    if customer_in.owner_id is not None and customer_in.owner_id != db_customer.owner_id:
        new_owner = db.query(Employee).filter(Employee.id == customer_in.owner_id).first()
        if not new_owner:
            raise HTTPException(status_code=400, detail="Invalid owner_id")
        if new_owner.company_id != db_customer.company_id:
            raise HTTPException(status_code=400, detail="Owner must belong to the same company")
        if new_owner.status != "Active":
            raise HTTPException(status_code=400, detail="Assigned owner must be an Active employee")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if customer_in.owner_id not in team_ids:
                raise HTTPException(status_code=403, detail="Managers can only assign customers within their team")

    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)

    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin", "Company Admin"]))
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    if current_user.role == "Company Admin" and db_customer.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    db_customer.status = "Inactive"
    db.commit()
    return None
