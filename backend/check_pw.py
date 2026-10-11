import os
import sys

sys.path.insert(0, r"m:\CRM_KIMI\backend")
from app.core.database import SessionLocal
from app.models.employee import Employee
from app.core.security import verify_password

db = SessionLocal()
emps = db.query(Employee).all()
for emp in emps:
    print(f"{emp.email}: status={emp.status} pw_match={verify_password('Password123!', emp.hashed_password)}")
