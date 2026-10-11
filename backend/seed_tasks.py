import sys
import os
sys.path.append(os.getcwd())
from app.core.database import SessionLocal
from app.models.employee import Employee
from app.models.task import Task
from app.models.company import Company
from datetime import datetime, timedelta

db = SessionLocal()
super_admin = db.query(Employee).filter(Employee.role == "Super Admin").first()
company = db.query(Company).first()

if not super_admin:
    print("No super admin found")
else:
    company_id = super_admin.company_id or (company.id if company else 1)
    
    t1 = Task(
        company_id=company_id,
        title="Complete API integration",
        description="Finish integrating the new payment gateway",
        related_module="Account",
        related_record_id=1,
        assigned_to_id=super_admin.id,
        assigned_by_id=super_admin.id,
        priority="High",
        status="Open",
        due_date=datetime.now() + timedelta(days=2)
    )
    t2 = Task(
        company_id=company_id,
        title="Review Server Logs",
        description="Analyze the logs for recent spikes in traffic",
        related_module="Account",
        related_record_id=1,
        assigned_to_id=super_admin.id,
        assigned_by_id=super_admin.id,
        priority="Medium",
        status="In Progress",
        due_date=datetime.now() + timedelta(days=1)
    )
    t3 = Task(
        company_id=company_id,
        title="Follow up with Falcon Packaging",
        description="Follow up on the enterprise contract",
        related_module="Account",
        related_record_id=1,
        assigned_to_id=super_admin.id,
        assigned_by_id=super_admin.id,
        priority="Critical",
        status="Open",
        due_date=datetime.now() - timedelta(days=1)
    )
    db.add(t1)
    db.add(t2)
    db.add(t3)
    db.commit()
    print(f"Tasks added successfully for Super Admin (Employee ID {super_admin.id}, Company ID {company_id}).")
