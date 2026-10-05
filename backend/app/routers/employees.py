from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.employee import Employee
from app.models.company import Company
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.api.deps import get_current_user, require_role, get_team_member_ids, require_company_access
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    query = db.query(Employee)
    
    if current_user.role == "Super Admin":
        pass
    elif current_user.role == "Company Admin":
        query = query.filter(Employee.company_id == current_user.company_id)
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(Employee.id.in_(team_ids), Employee.company_id == current_user.company_id)
    elif current_user.role == "Employee":
        query = query.filter(Employee.id == current_user.id)
        
    if search:
        query = query.filter(Employee.name.contains(search) | Employee.email.contains(search) | Employee.employee_code.contains(search))
        
    return query.offset(skip).limit(limit).all()

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        
    if current_user.role != "Super Admin":
        if employee.company_id != current_user.company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        if current_user.role == "Manager":
            team_ids = get_team_member_ids(db, current_user.id)
            if employee.id not in team_ids:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not in your team.")
        elif current_user.role == "Employee":
            if employee.id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Can only view own profile.")

    return employee

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin", "Company Admin"]))
):
    # Validation
    if db.query(Employee).filter(Employee.email == employee_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(Employee).filter(Employee.employee_code == employee_in.employee_code).first():
        raise HTTPException(status_code=400, detail="Employee code already registered")
        
    if current_user.role == "Company Admin":
        # Force company_id to the admin's company
        if employee_in.company_id and employee_in.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Cannot create employee for another company")
        employee_in.company_id = current_user.company_id
        
        if employee_in.role == "Super Admin":
            raise HTTPException(status_code=403, detail="Company Admin cannot create a Super Admin")
            
    if employee_in.company_id:
        company = db.query(Company).filter(Company.id == employee_in.company_id).first()
        if not company:
            raise HTTPException(status_code=400, detail="Invalid company_id")
        if company.status != "Active":
            raise HTTPException(status_code=400, detail="Cannot create employee in an inactive company")
            
    if employee_in.manager_id:
        manager = db.query(Employee).filter(Employee.id == employee_in.manager_id).first()
        if not manager:
            raise HTTPException(status_code=400, detail="Invalid manager_id")
        if manager.company_id != employee_in.company_id:
            raise HTTPException(status_code=400, detail="Manager must belong to the same company")
            
    # Create employee
    db_employee = Employee(
        **employee_in.dict(exclude={"password"}),
        hashed_password=get_password_hash(employee_in.password)
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def has_cycle(db: Session, employee_id: int, new_manager_id: int) -> bool:
    """Check if setting new_manager_id as manager for employee_id creates a cycle."""
    if employee_id == new_manager_id:
        return True
    
    current_manager = new_manager_id
    while current_manager is not None:
        if current_manager == employee_id:
            return True
        manager = db.query(Employee).filter(Employee.id == current_manager).first()
        if not manager:
            break
        current_manager = manager.manager_id
    return False

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    # Access control
    if current_user.role != "Super Admin":
        if db_employee.company_id != current_user.company_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
        if current_user.role == "Company Admin":
            # Can update employees in own company. Cannot change their company.
            if employee_in.company_id and employee_in.company_id != current_user.company_id:
                raise HTTPException(status_code=403, detail="Cannot move employee to another company")
            if employee_in.role == "Super Admin":
                raise HTTPException(status_code=403, detail="Cannot assign Super Admin role")
                
        elif current_user.role == "Manager":
            # Manager cannot edit others or elevate privileges. Depending on SRS, maybe only some fields.
            # To be safe, usually Managers don't edit employee records, but the prompt says:
            # "perform only employee operations permitted by the SRS" - let's deny manager/employee from updating other employees unless specified.
            if current_user.id != employee_id:
                raise HTTPException(status_code=403, detail="Manager can only update their own profile")
                
        elif current_user.role == "Employee":
            if current_user.id != employee_id:
                raise HTTPException(status_code=403, detail="Can only update own profile")
                
        # Non-admins cannot change role or company
        if current_user.role in ["Manager", "Employee"]:
            if employee_in.role is not None and employee_in.role != db_employee.role:
                raise HTTPException(status_code=403, detail="Cannot change own role")
            if employee_in.company_id is not None and employee_in.company_id != db_employee.company_id:
                raise HTTPException(status_code=403, detail="Cannot change own company")
            if employee_in.status is not None and employee_in.status != db_employee.status:
                raise HTTPException(status_code=403, detail="Cannot change own status")

    # Validations
    if employee_in.email and employee_in.email != db_employee.email:
        if db.query(Employee).filter(Employee.email == employee_in.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
    if employee_in.employee_code and employee_in.employee_code != db_employee.employee_code:
        if db.query(Employee).filter(Employee.employee_code == employee_in.employee_code).first():
            raise HTTPException(status_code=400, detail="Employee code already registered")

    company_id_to_check = employee_in.company_id if employee_in.company_id is not None else db_employee.company_id

    if employee_in.company_id is not None and employee_in.company_id != db_employee.company_id:
        company = db.query(Company).filter(Company.id == employee_in.company_id).first()
        if not company:
            raise HTTPException(status_code=400, detail="Invalid company_id")
        if not company.is_active:
            raise HTTPException(status_code=400, detail="Cannot assign employee to an inactive company")

    if employee_in.manager_id is not None:
        if employee_in.manager_id != db_employee.manager_id:
            manager = db.query(Employee).filter(Employee.id == employee_in.manager_id).first()
            if not manager:
                raise HTTPException(status_code=400, detail="Invalid manager_id")
            if manager.company_id != company_id_to_check:
                raise HTTPException(status_code=400, detail="Manager must belong to the same company")
            if has_cycle(db, employee_id, employee_in.manager_id):
                raise HTTPException(status_code=400, detail="Circular manager relationship detected")

    update_data = employee_in.dict(exclude_unset=True)
    if "password" in update_data:
        db_employee.hashed_password = get_password_hash(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(db_employee, field, value)

    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_role(["Super Admin", "Company Admin"]))
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if current_user.role == "Company Admin" and db_employee.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    if db_employee.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    db_employee.status = "Inactive"
    db.commit()
    return None
