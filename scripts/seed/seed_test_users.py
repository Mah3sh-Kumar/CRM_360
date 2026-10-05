import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from datetime import date
from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.company import Company
from app.core.security import get_password_hash

db = SessionLocal()

# Create Company if not exists
company = db.query(Company).filter(Company.company_code == "ACME001").first()
if not company:
    company = Company(
        company_code="ACME001",
        name="ACME Corporation",
        status="Active",
        created_by="system"
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    print("Company ACME001 created.")
else:
    print("Company ACME001 already exists.")

# Define users data
users_data = [
    {
        "role": "Super Admin",
        "name": "System Administrator",
        "email": "superadmin@crm360.local",
        "password": "Super@123",
        "company_id": None,
        "employee_code": "SA-001",
        "designation": "Super Admin"
    },
    {
        "role": "Company Admin",
        "name": "Company Administrator",
        "email": "admin@acme.crm360.local",
        "password": "Admin@123",
        "company_id": company.id,
        "employee_code": "CA-001",
        "designation": "Company Admin"
    },
    {
        "role": "Manager",
        "name": "Sales Manager",
        "email": "manager@acme.crm360.local",
        "password": "Manager@123",
        "company_id": company.id,
        "employee_code": "MGR-001",
        "designation": "Manager"
    },
    {
        "role": "Employee",
        "name": "Sales Employee",
        "email": "employee@acme.crm360.local",
        "password": "Employee@123",
        "company_id": company.id,
        "employee_code": "EMP-001",
        "designation": "Employee"
    }
]

created_users = {}

for udata in users_data:
    user = db.query(Employee).filter(Employee.email == udata["email"]).first()
    if not user:
        user = Employee(
            employee_code=udata["employee_code"],
            name=udata["name"],
            email=udata["email"],
            mobile="+1234567890",
            hashed_password=get_password_hash(udata["password"]),
            role=udata["role"],
            designation=udata["designation"],
            company_id=udata["company_id"],
            date_of_joining=date.today(),
            status="Active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"User {udata['email']} created.")
    else:
        # Check if updates needed
        updated = False
        if user.role != udata["role"]:
            user.role = udata["role"]
            updated = True
        if user.company_id != udata["company_id"]:
            user.company_id = udata["company_id"]
            updated = True
        if updated:
            db.commit()
            print(f"User {udata['email']} updated.")
        else:
            print(f"User {udata['email']} already exists and is correct.")
    
    created_users[udata["role"]] = user

# Setup hierarchy
employee = created_users.get("Employee")
manager = created_users.get("Manager")

if employee and manager and employee.manager_id != manager.id:
    employee.manager_id = manager.id
    db.commit()
    print("Employee hierarchy updated.")

db.close()
