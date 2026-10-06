import os
import sys
import random
from datetime import datetime, timedelta, date

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.employee import Employee
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.account import Account
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.activity import Activity
from app.models.task import Task
from app.models.meeting import Meeting, meeting_participants
from app.models.tracking import CheckIn, CheckOut, EmployeeLocation, Visit, VisitStatus, VisitOutcome
from app.models.audit_log import AuditLog

from seed.data import (
    COMPANIES, EMPLOYEES, FIRST_NAMES, LAST_NAMES, INDUSTRIES,
    LEAD_SOURCES, LEAD_STATUSES, OPP_STAGES, TASK_STATUSES, TASK_PRIORITIES,
    ACTIVITY_TYPES, random_phone, generate_leads
)

def reset_database(db: Session):
    print("Clearing existing data...")
    from sqlalchemy import text
    try:
        db.query(AuditLog).delete()
        db.query(EmployeeLocation).delete()
        db.query(Visit).delete()
        db.query(CheckOut).delete()
        db.query(CheckIn).delete()
        db.execute(meeting_participants.delete())
        db.query(Meeting).delete()
        db.query(Task).delete()
        db.query(Activity).delete()
        db.query(Opportunity).delete()
        db.query(Contact).delete()
        db.query(Account).delete()
        db.query(Customer).delete()
        db.query(Lead).delete()
        db.execute(text("UPDATE employees SET manager_id = NULL"))
        db.query(Employee).delete()
        db.query(Company).delete()
        db.commit()
        print("Database cleared.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
        raise e

def seed_companies(db: Session) -> dict:
    print("Seeding Companies...")
    company_map = {}
    for c_data in COMPANIES:
        comp = db.query(Company).filter(Company.company_code == c_data["company_code"]).first()
        if not comp:
            comp = Company(
                company_code=c_data["company_code"],
                name=c_data["name"],
                email=c_data["email"],
                phone=c_data["phone"],
                address_line_1=c_data["address_line_1"],
                city=c_data["city"],
                state=c_data["state"],
                country=c_data["country"],
                status=c_data["status"]
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)
        company_map[comp.company_code] = comp.id
    return company_map

def seed_employees(db: Session, company_map: dict) -> dict:
    print("Seeding Employees...")
    emp_map = {}
    # First pass: create employees without managers
    for e_data in EMPLOYEES:
        emp = db.query(Employee).filter(Employee.email == e_data["email"]).first()
        if not emp:
            hashed_pwd = get_password_hash(e_data.get("password", "password123"))
            comp_id = company_map.get(e_data["company_code"]) if e_data["company_code"] else None
            emp = Employee(
                employee_code=e_data["emp_code"],
                name=e_data["name"],
                email=e_data["email"],
                mobile=random_phone(),
                hashed_password=hashed_pwd,
                role=e_data["role"],
                company_id=comp_id,
                designation=e_data["designation"],
                date_of_joining=date(2023, 1, 1),
                gps_tracking_enabled=True,
                status="Active"
            )
            db.add(emp)
            db.commit()
            db.refresh(emp)
        emp_map[e_data["emp_code"]] = emp.id

    # Second pass: assign managers
    for e_data in EMPLOYEES:
        if e_data["manager_code"]:
            emp_id = emp_map[e_data["emp_code"]]
            mgr_id = emp_map[e_data["manager_code"]]
            emp = db.query(Employee).filter(Employee.id == emp_id).first()
            if emp and not emp.manager_id:
                emp.manager_id = mgr_id
                db.commit()
    
    return emp_map

def seed_leads(db: Session, company_map: dict, emp_map: dict):
    print("Seeding Leads...")
    count = db.query(Lead).count()
    if count >= 100:
        print("Leads already seeded. Skipping.")
        return

    leads_data = generate_leads(60)
    # We assign leads to regular employees (managers and employees) in APEX, TRIDENT, STERLING
    valid_emps = [e for e in EMPLOYEES if e["role"] in ["Manager", "Employee"] and e["company_code"]]
    
    for l_data in leads_data:
        emp_data = random.choice(valid_emps)
        comp_id = company_map[emp_data["company_code"]]
        emp_id = emp_map[emp_data["emp_code"]]
        
        lead = Lead(
            lead_name=l_data["lead_name"],
            company_name=l_data["company_name"],
            contact_person=l_data["contact_person"],
            mobile_number=l_data["mobile_number"],
            email_address=l_data["email_address"],
            lead_source=l_data["lead_source"],
            industry=l_data["industry"],
            status=l_data["status"],
            expected_revenue=l_data["expected_revenue"],
            company_id=comp_id,
            assigned_employee_id=emp_id
        )
        db.add(lead)
    db.commit()

def seed_customers_and_accounts(db: Session, company_map: dict, emp_map: dict):
    print("Seeding Customers & Accounts...")
    c_count = db.query(Customer).count()
    if c_count >= 60:
        return
    
    valid_emps = [e for e in EMPLOYEES if e["role"] in ["Manager", "Employee"] and e["company_code"]]
    
    for i in range(50):
        emp_data = random.choice(valid_emps)
        comp_id = company_map[emp_data["company_code"]]
        emp_id = emp_map[emp_data["emp_code"]]
        
        c_code = f"CUST-{random.randint(10000, 99999)}"
        customer = Customer(
            customer_code=c_code,
            name=f"Customer Enterprise {c_code}",
            company_id=comp_id,
            owner_id=emp_id,
            contact_person=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            email=f"cust{i}@enterprise.com",
            phone=random_phone(),
            address=f"{random.randint(10,99)}, Business Rd, City",
            status=random.choice(["Active", "Active", "Inactive"])
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        # Create corresponding account
        account = Account(
            name=f"Account - {customer.name}",
            code=f"ACC-{random.randint(10000, 99999)}",
            industry=random.choice(INDUSTRIES),
            website=f"www.enterprise{random.randint(1000, 9999)}.com",
            email_address=customer.email,
            phone_number=customer.phone,
            company_id=comp_id,
            owner_id=emp_id,
            status="Active",
            annual_revenue=random.choice([250000, 580000, 900000, 1250000, 1750000, 2400000, 3500000, 4800000])
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        
        # Create 1-3 contacts for this account
        for j in range(random.randint(1, 3)):
            contact = Contact(
                first_name=random.choice(FIRST_NAMES),
                last_name=random.choice(LAST_NAMES),
                designation="Manager",
                mobile_number=random_phone(),
                email_address=f"contact{j}_{i}@enterprise.com",
                account_id=account.id,
                customer_id=customer.id,
                company_id=comp_id,
                owner_id=emp_id
            )
            db.add(contact)
        db.commit()

def seed_opportunities(db: Session, company_map: dict, emp_map: dict):
    print("Seeding Opportunities...")
    if db.query(Opportunity).count() >= 80:
        return
        
    accounts = db.query(Account).all()
    if not accounts: return

    for i in range(60):
        acc = random.choice(accounts)
        
        contact = db.query(Contact).filter(Contact.account_id == acc.id).first()
        stage = random.choice(OPP_STAGES)
        
        prob = 10
        status = "Open"
        if stage == "Prospecting": prob = 10
        elif stage == "Qualification": prob = 30
        elif stage == "Proposal": prob = 50
        elif stage == "Negotiation": prob = 70
        elif stage == "Won": 
            prob = 100
            status = "Won"
        elif stage == "Lost": 
            prob = 0
            status = "Lost"
            
        opp = Opportunity(
            name=f"Opp for {acc.name} - {random.choice(['Expansion', 'Renewal', 'New Business'])}",
            account_id=acc.id,
            contact_id=contact.id if contact else None,
            owner_id=acc.owner_id,
            company_id=acc.company_id,
            stage=stage,
            status=status,
            expected_revenue=random.choice([250000, 580000, 900000, 1250000, 1750000, 2400000, 3500000, 4800000]),
            probability=prob,
            expected_close_date=datetime.utcnow() + timedelta(days=random.randint(-30, 90)),
            description="Generated by seed script",
            lost_reason="Budget Constraints" if stage == "Lost" else None
        )
        db.add(opp)
    db.commit()

def seed_activities_and_tasks(db: Session):
    print("Seeding Activities & Tasks...")
    if db.query(Task).count() >= 100: return
    
    accounts = db.query(Account).all()
    leads = db.query(Lead).all()
    emps = db.query(Employee).filter(Employee.role.in_(["Employee", "Manager"])).all()
    
    if not emps: return
    
    # Tasks
    for i in range(60):
        emp = random.choice(emps)
        due = datetime.utcnow() + timedelta(days=random.randint(-10, 20))
        task = Task(
            title=f"Follow up Task {i}",
            description="Call the client to discuss proposal.",
            related_module=random.choice(["Account", "Lead"]),
            related_record_id=random.choice(accounts).id if accounts else 1,
            assigned_to_id=emp.id,
            assigned_by_id=emp.id,
            priority=random.choice(TASK_PRIORITIES),
            status=random.choice(TASK_STATUSES),
            due_date=due,
            company_id=emp.company_id
        )
        db.add(task)
        
    # Activities
    for i in range(60):
        acc = random.choice(accounts)
        emp = db.query(Employee).filter(Employee.id == acc.owner_id).first()
        act = Activity(
            activity_type=random.choice(ACTIVITY_TYPES),
            subject=f"Activity {i}",
            account_id=acc.id,
            assigned_employee_id=emp.id,
            due_date=datetime.utcnow() + timedelta(days=random.randint(-5, 10)),
            status=random.choice(["Scheduled", "Completed", "Cancelled"]),
            company_id=acc.company_id
        )
        db.add(act)
    db.commit()

def seed_meetings(db: Session):
    print("Seeding Meetings...")
    if db.query(Meeting).count() >= 80: return
    emps = db.query(Employee).filter(Employee.role.in_(["Employee", "Manager"])).all()
    if not emps: return
    
    for i in range(60):
        organizer = random.choice(emps)
        start = datetime.utcnow() + timedelta(days=random.randint(-5, 15), hours=random.randint(9, 16))
        end = start + timedelta(hours=1)
        
        meeting = Meeting(
            title=f"Sync Meeting {i}",
            meeting_type=random.choice(["Customer Meeting", "Internal Meeting", "Sales Meeting", "Project Discussion"]),
            organizer_id=organizer.id,
            start_datetime=start,
            end_datetime=end,
            status=random.choice(["Scheduled", "Completed", "Cancelled"]),
            company_id=organizer.company_id
        )
        meeting.participants.append(organizer)
        if len(emps) > 1:
            participant2 = random.choice([e for e in emps if e.id != organizer.id])
            meeting.participants.append(participant2)
            
        db.add(meeting)
    db.commit()

def seed_tracking_and_visits(db: Session):
    print("Seeding Tracking & Visits...")
    if db.query(Visit).count() >= 80: return
    
    customers = db.query(Customer).all()
    emps = db.query(Employee).filter(Employee.role == "Employee").all()
    if not customers or not emps: return
    
    # 25 Visits
    for i in range(60):
        emp = random.choice(emps)
        cust = random.choice([c for c in customers if c.company_id == emp.company_id])
        if not cust: continue
        
        v_date = date.today() + timedelta(days=random.randint(-10, 5))
        status = random.choice(list(VisitStatus))
        
        visit = Visit(
            employee_id=emp.id,
            company_id=emp.company_id,
            customer_id=cust.id,
            visit_date=v_date,
            status=status,
            outcome=random.choice(list(VisitOutcome)) if status == VisitStatus.Completed else None,
            latitude=19.0760 + random.uniform(-0.1, 0.1),
            longitude=72.8777 + random.uniform(-0.1, 0.1),
        )
        db.add(visit)
    db.commit()
    
    print("Seeding Locations...")
    for emp in emps:
        # Create a check-in for this employee
        check_in = db.query(CheckIn).filter(CheckIn.employee_id == emp.id, CheckIn.check_in_date == date.today()).first()
        if not check_in:
            check_in = CheckIn(
                employee_id=emp.id,
                company_id=emp.company_id,
                check_in_date=date.today(),
                check_in_time=datetime.utcnow() - timedelta(hours=8),
                latitude=19.0,
                longitude=72.0,
                address="Home Office"
            )
            db.add(check_in)
            db.commit()
            db.refresh(check_in)
        
        for i in range(10): # 10 locations per emp
            loc = EmployeeLocation(
                employee_id=emp.id,
                company_id=emp.company_id,
                check_in_id=check_in.id,
                latitude=19.0760 + random.uniform(-0.1, 0.1),
                longitude=72.8777 + random.uniform(-0.1, 0.1),
                timestamp=datetime.utcnow() - timedelta(minutes=random.randint(10, 480))
            )
            db.add(loc)
    db.commit()

def seed_audit_logs(db: Session):
    print("Seeding Audit Logs...")
    if db.query(AuditLog).count() >= 120: return
    
    emps = db.query(Employee).all()
    if not emps: return
    
    actions = ["Login", "Lead Created", "Lead Updated", "Opportunity Stage Changed", "Task Completed"]
    modules = ["Auth", "Lead", "Lead", "Opportunity", "Task"]
    
    for i in range(80):
        emp = random.choice(emps)
        idx = random.randint(0, len(actions)-1)
        log = AuditLog(
            company_id=emp.company_id,
            module=modules[idx],
            record_id=random.randint(1, 20),
            action=actions[idx],
            user_id=emp.id,
            timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 5), hours=random.randint(0, 23))
        )
        db.add(log)
    db.commit()

def run_seed():
    db = SessionLocal()
    try:
        print("Starting Database Seed...")
        # reset_database(db)  # Removed to avoid deleting existing data
        
        c_map = seed_companies(db)
        e_map = seed_employees(db, c_map)
        seed_leads(db, c_map, e_map)
        seed_customers_and_accounts(db, c_map, e_map)
        seed_opportunities(db, c_map, e_map)
        seed_activities_and_tasks(db)
        seed_meetings(db)
        seed_tracking_and_visits(db)
        seed_audit_logs(db)
        
        print("Seed completed successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error during seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
