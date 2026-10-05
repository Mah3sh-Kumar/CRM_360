import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app.core.database import SessionLocal
from app.models.employee import Employee
from app.core.security import get_password_hash
from datetime import date

db = SessionLocal()

# Check if admin exists
admin = db.query(Employee).filter(Employee.email == "admin@crm360.io").first()
if not admin:
    admin = Employee(
        employee_code="ADM-001",
        name="Aditya Verma",
        email="admin@crm360.io",
        mobile="+1234567890",
        hashed_password=get_password_hash("admin123"),
        role="Super Admin",
        designation="Platform Administrator",
        date_of_joining=date.today(),
        status="Active"
    )
    db.add(admin)
    db.commit()
    print("Admin created successfully.")
else:
    print("Admin already exists.")

db.close()
