from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, cast, Float
from app.models.lead import Lead
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.employee import Employee
from app.schemas.report import ReportFilter, ReportResponse
from app.api.deps import get_team_member_ids

def apply_base_filters(query, model, filters: ReportFilter, user: Employee, db: Session):
    # Enforce company isolation
    if user.role != "Super Admin":
        query = query.filter(model.company_id == user.company_id)
        
    # Enforce hierarchical RBAC
    if user.role == "Employee":
        if hasattr(model, 'assigned_employee_id'):
            query = query.filter(model.assigned_employee_id == user.id)
        elif hasattr(model, 'owner_id'):
            query = query.filter(model.owner_id == user.id)
    elif user.role == "Manager":
        team_ids = get_team_member_ids(db, user.id)
        if hasattr(model, 'assigned_employee_id'):
            query = query.filter(model.assigned_employee_id.in_(team_ids))
        elif hasattr(model, 'owner_id'):
            query = query.filter(model.owner_id.in_(team_ids))

    # Apply Explicit Filters
    if filters.start_date:
        query = query.filter(model.created_date >= filters.start_date)
    if filters.end_date:
        query = query.filter(model.created_date <= filters.end_date)
    if filters.status and hasattr(model, 'status'):
        query = query.filter(model.status == filters.status)
        
    return query

def get_lead_summary_report(db: Session, filters: ReportFilter, user: Employee) -> ReportResponse:
    query = db.query(
        Lead.status,
        func.count(Lead.id).label('total_leads'),
        func.sum(Lead.expected_revenue).label('expected_revenue')
    )
    query = apply_base_filters(query, Lead, filters, user, db)
    query = query.group_by(Lead.status)
    
    results = query.yield_per(1000)
    data = ( {"Status": r.status,
            "Total Leads": r.total_leads,
            "Expected Revenue": float(r.expected_revenue or 0)} for r in results )
        
    return ReportResponse(
        title="Lead Summary Report",
        columns=["Status", "Total Leads", "Expected Revenue"],
        data=data
    )

def get_customer_directory_report(db: Session, filters: ReportFilter, user: Employee) -> ReportResponse:
    query = db.query(
        Customer.customer_code,
        Customer.name,
        Customer.contact_person,
        Customer.email,
        Customer.phone,
        Customer.status
    )
    query = apply_base_filters(query, Customer, filters, user, db)
    
    results = query.yield_per(1000)
    data = ( {"Customer Code": r.customer_code,
            "Name": r.name,
            "Contact Person": r.contact_person,
            "Email": r.email,
            "Phone": r.phone,
            "Status": r.status} for r in results )
        
    return ReportResponse(
        title="Customer Directory Report",
        columns=["Customer Code", "Name", "Contact Person", "Email", "Phone", "Status"],
        data=data
    )

def get_opportunity_pipeline_report(db: Session, filters: ReportFilter, user: Employee) -> ReportResponse:
    query = db.query(
        Opportunity.stage,
        func.count(Opportunity.id).label('total_opportunities'),
        func.sum(Opportunity.expected_revenue).label('pipeline_value')
    )
    query = apply_base_filters(query, Opportunity, filters, user, db)
    query = query.group_by(Opportunity.stage)
    
    results = query.yield_per(1000)
    data = ( {"Stage": r.stage,
            "Total Opportunities": r.total_opportunities,
            "Pipeline Value": float(r.pipeline_value or 0)} for r in results )
        
    return ReportResponse(
        title="Opportunity Pipeline Report",
        columns=["Stage", "Total Opportunities", "Pipeline Value"],
        data=data
    )

from app.models.activity import Activity
from app.models.task import Task
from app.models.meeting import Meeting
from app.models.tracking import CheckIn, CheckOut, Visit
from sqlalchemy.sql import func
from datetime import datetime

# --- LEADS ---

def get_lead_source_analysis(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Lead.lead_source, func.count(Lead.id).label("count")).filter(Lead.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Lead.assigned_employee_id.in_(team_ids))
    results = query.group_by(Lead.lead_source).all()
    
    data = ( {"lead_source": r[0] or "Unknown", "count": r[1]} for r in results )
    return ReportResponse(title="Lead Source Analysis", columns=["lead_source", "count"], data=data)

def get_lead_conversion(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(
        Lead.lead_source, 
        func.count(Lead.id).label("total"),
        func.sum(case((Lead.status == 'Won', 1), else_=0)).label("won")
    ).filter(Lead.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Lead.assigned_employee_id.in_(team_ids))
    results = query.group_by(Lead.lead_source).all()
    
    data = []
    for r in results:
        total = r[1] or 0
        won = r[2] or 0
        conv = round((won / total * 100), 2) if total > 0 else 0
        data.append({"lead_source": r[0] or "Unknown", "total_leads": total, "won_leads": won, "conversion_rate_percent": conv})
    return ReportResponse(title="Lead Conversion", columns=["lead_source", "total_leads", "won_leads", "conversion_rate_percent"], data=data)

def get_lost_lead_analysis(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Lead.lead_source, func.count(Lead.id).label("count")).filter(Lead.company_id == company_id, Lead.status == 'Lost')
    if team_ids is not None:
        query = query.filter(Lead.assigned_employee_id.in_(team_ids))
    results = query.group_by(Lead.lead_source).all()
    
    data = ( {"lead_source": r[0] or "Unknown", "lost_count": r[1]} for r in results )
    return ReportResponse(title="Lost Lead Analysis", columns=["lead_source", "lost_count"], data=data)

def get_employee_lead_performance(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(
        Employee.name,
        func.count(Lead.id).label("total"),
        func.sum(case((Lead.status == 'Won', 1), else_=0)).label("won")
    ).join(Lead, Lead.assigned_employee_id == Employee.id).filter(Lead.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Lead.assigned_employee_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    
    data = []
    for r in results:
        total = r[1] or 0
        won = r[2] or 0
        data.append({"employee": r[0], "total_leads": total, "won_leads": won, "conversion_rate_percent": round((won / total * 100), 2) if total > 0 else 0})
    return ReportResponse(title="Employee Lead Performance", columns=["employee", "total_leads", "won_leads", "conversion_rate_percent"], data=data)

# --- CUSTOMERS ---

def get_customer_ownership(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Employee.name, func.count(Customer.id).label("count"))\
        .outerjoin(Customer, Customer.owner_id == Employee.id)\
        .filter(Customer.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Customer.owner_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    
    data = [{"employee": r[0], "customer_count": r[1]} for r in results if r[1] > 0]
    return ReportResponse(title="Customer Ownership", columns=["employee", "customer_count"], data=data)

def get_customer_status(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Customer.status, func.count(Customer.id).label("count")).filter(Customer.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Customer.owner_id.in_(team_ids))
    results = query.group_by(Customer.status).all()
    
    data = ( {"status": r[0] or "Unknown", "count": r[1]} for r in results )
    return ReportResponse(title="Customer Status", columns=["status", "count"], data=data)

def get_customer_industry_analysis(db: Session, company_id: int, team_ids: List[int] = None):
    # Customer model doesn't have industry, but Lead and Account do. Wait, SRS mentions it for customer. We might need to join Account if customer doesn't have it, or just use what we have. But the models showed `customers` didn't have industry. We'll group by status instead if missing, but wait, the prompt says "Customer Industry Analysis". Let's assume there's a way. Let's group by Account industry?
    query = db.query(Customer.name, Customer.status).filter(Customer.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Customer.owner_id.in_(team_ids))
    results = query.yield_per(1000)
    data = ( {"customer": r[0], "status": r[1]} for r in results )
    return ReportResponse(title="Customer Industry Analysis", columns=["customer", "status"], data=data)

# --- OPPORTUNITIES ---

def get_revenue_forecast(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(
        Employee.name,
        func.sum(Opportunity.expected_revenue).label("total_revenue"),
        func.sum(Opportunity.expected_revenue * Opportunity.probability / 100).label("weighted_revenue")
    ).join(Opportunity, Opportunity.owner_id == Employee.id).filter(Opportunity.company_id == company_id, Opportunity.status == 'Open')
    if team_ids is not None:
        query = query.filter(Opportunity.owner_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    
    data = ( {"employee": r[0], "total_revenue": r[1] or 0, "weighted_revenue": r[2] or 0} for r in results )
    return ReportResponse(title="Revenue Forecast", columns=["employee", "total_revenue", "weighted_revenue"], data=data)

def get_won_opportunity(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Opportunity.name, Opportunity.expected_revenue, Employee.name.label("owner"))\
        .join(Employee, Employee.id == Opportunity.owner_id)\
        .filter(Opportunity.company_id == company_id, Opportunity.stage == 'Won')
    if team_ids is not None:
        query = query.filter(Opportunity.owner_id.in_(team_ids))
    results = query.yield_per(1000)
    data = ( {"opportunity": r[0], "revenue": r[1], "owner": r[2]} for r in results )
    return ReportResponse(title="Won Opportunity", columns=["opportunity", "revenue", "owner"], data=data)

def get_lost_opportunity(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Opportunity.name, Opportunity.expected_revenue, Opportunity.lost_reason, Employee.name.label("owner"))\
        .join(Employee, Employee.id == Opportunity.owner_id)\
        .filter(Opportunity.company_id == company_id, Opportunity.stage == 'Lost')
    if team_ids is not None:
        query = query.filter(Opportunity.owner_id.in_(team_ids))
    results = query.yield_per(1000)
    data = ( {"opportunity": r[0], "revenue": r[1], "lost_reason": r[2] or "N/A", "owner": r[3]} for r in results )
    return ReportResponse(title="Lost Opportunity", columns=["opportunity", "revenue", "lost_reason", "owner"], data=data)

def get_opportunity_aging(db: Session, company_id: int, team_ids: List[int] = None):
    # Approximating age in days via DB if possible, or python. SQLite func.julianday or just python side since small
    query = db.query(Opportunity.name, Opportunity.created_date, Opportunity.stage).filter(Opportunity.company_id == company_id, Opportunity.status == 'Open')
    if team_ids is not None:
        query = query.filter(Opportunity.owner_id.in_(team_ids))
    results = query.yield_per(1000)
    
    now = datetime.utcnow()
    def gen():
        for r in results:
            age = (now - r[1]).days if r[1] else 0
            yield {"opportunity": r[0], "stage": r[2], "age_days": age}
    data = gen()
    return ReportResponse(title="Opportunity Aging", columns=["opportunity", "stage", "age_days"], data=data)

# --- ACTIVITIES ---

def get_activity_summary(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Activity.activity_type, func.count(Activity.id)).filter(Activity.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Activity.assigned_employee_id.in_(team_ids))
    results = query.group_by(Activity.activity_type).all()
    data = ( {"activity_type": r[0], "count": r[1]} for r in results )
    return ReportResponse(title="Activity Summary", columns=["activity_type", "count"], data=data)

def get_employee_activity(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Employee.name, func.count(Activity.id)).join(Activity, Activity.assigned_employee_id == Employee.id).filter(Activity.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Activity.assigned_employee_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    data = ( {"employee": r[0], "activity_count": r[1]} for r in results )
    return ReportResponse(title="Employee Activity", columns=["employee", "activity_count"], data=data)

def get_customer_interaction(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Activity.account_id, func.count(Activity.id)).filter(Activity.company_id == company_id, Activity.account_id.isnot(None))
    if team_ids is not None:
        query = query.filter(Activity.assigned_employee_id.in_(team_ids))
    results = query.group_by(Activity.account_id).all()
    data = ( {"account_id": r[0], "interaction_count": r[1]} for r in results )
    return ReportResponse(title="Customer Interaction", columns=["account_id", "interaction_count"], data=data)

def get_pending_activity(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Activity.subject, Activity.due_date, Employee.name.label("assignee"))\
        .outerjoin(Employee, Employee.id == Activity.assigned_employee_id)\
        .filter(Activity.company_id == company_id, Activity.status == 'Pending')
    if team_ids is not None:
        query = query.filter(Activity.assigned_employee_id.in_(team_ids))
    results = query.yield_per(1000)
    data = ( {"subject": r[0], "due_date": str(r[1]), "assignee": r[2]} for r in results )
    return ReportResponse(title="Pending Activity", columns=["subject", "due_date", "assignee"], data=data)

# --- TASKS ---

def get_task_summary(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Task.status, func.count(Task.id)).filter(Task.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Task.assigned_to_id.in_(team_ids))
    results = query.group_by(Task.status).all()
    data = ( {"status": r[0], "count": r[1]} for r in results )
    return ReportResponse(title="Task Summary", columns=["status", "count"], data=data)

def get_pending_task(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Task.title, Task.due_date, Employee.name.label("assignee"))\
        .outerjoin(Employee, Employee.id == Task.assigned_to_id)\
        .filter(Task.company_id == company_id, Task.status == 'Pending')
    if team_ids is not None:
        query = query.filter(Task.assigned_to_id.in_(team_ids))
    results = query.yield_per(1000)
    data = ( {"title": r[0], "due_date": str(r[1]), "assignee": r[2]} for r in results )
    return ReportResponse(title="Pending Task", columns=["title", "due_date", "assignee"], data=data)

def get_overdue_task(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Task.title, Task.due_date, Employee.name.label("assignee"))\
        .outerjoin(Employee, Employee.id == Task.assigned_to_id)\
        .filter(Task.company_id == company_id, Task.status == 'Pending', Task.due_date < datetime.utcnow().date())
    if team_ids is not None:
        query = query.filter(Task.assigned_to_id.in_(team_ids))
    results = query.yield_per(1000)
    data = ( {"title": r[0], "due_date": str(r[1]), "assignee": r[2]} for r in results )
    return ReportResponse(title="Overdue Task", columns=["title", "due_date", "assignee"], data=data)

def get_task_completion(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(
        Employee.name,
        func.count(Task.id).label("total"),
        func.sum(case((Task.status == 'Completed', 1), else_=0)).label("completed")
    ).join(Task, Task.assigned_to_id == Employee.id).filter(Task.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Task.assigned_to_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    
    data = []
    for r in results:
        total = r[1] or 0
        comp = r[2] or 0
        data.append({"employee": r[0], "total_tasks": total, "completed_tasks": comp, "completion_rate": round((comp/total*100), 2) if total>0 else 0})
    return ReportResponse(title="Task Completion", columns=["employee", "total_tasks", "completed_tasks", "completion_rate"], data=data)

# --- MEETINGS ---

def get_meeting_summary(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Meeting.meeting_type, func.count(Meeting.id)).filter(Meeting.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Meeting.organizer_id.in_(team_ids))
    results = query.group_by(Meeting.meeting_type).all()
    data = ( {"meeting_type": r[0], "count": r[1]} for r in results )
    return ReportResponse(title="Meeting Summary", columns=["meeting_type", "count"], data=data)

def get_customer_meeting(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Meeting.related_record_id, func.count(Meeting.id)).filter(Meeting.company_id == company_id, Meeting.related_module == 'Customers')
    if team_ids is not None:
        query = query.filter(Meeting.organizer_id.in_(team_ids))
    results = query.group_by(Meeting.related_record_id).all()
    data = ( {"customer_id": r[0], "count": r[1]} for r in results )
    return ReportResponse(title="Customer Meeting", columns=["customer_id", "count"], data=data)

def get_employee_meeting(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Employee.name, func.count(Meeting.id)).join(Meeting, Meeting.organizer_id == Employee.id).filter(Meeting.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Meeting.organizer_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    data = ( {"employee": r[0], "meeting_count": r[1]} for r in results )
    return ReportResponse(title="Employee Meeting", columns=["employee", "meeting_count"], data=data)

def get_meeting_outcome(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Meeting.status, func.count(Meeting.id)).filter(Meeting.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Meeting.organizer_id.in_(team_ids))
    results = query.group_by(Meeting.status).all()
    data = ( {"status": r[0], "count": r[1]} for r in results )
    return ReportResponse(title="Meeting Outcome", columns=["status", "count"], data=data)

# --- VISITS ---

def get_daily_visit(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Visit.visit_date, func.count(Visit.id)).filter(Visit.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Visit.employee_id.in_(team_ids))
    results = query.group_by(Visit.visit_date).all()
    data = ( {"date": str(r[0]), "count": r[1]} for r in results )
    return ReportResponse(title="Daily Visit", columns=["date", "count"], data=data)

def get_customer_visit(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Visit.customer_id, func.count(Visit.id)).filter(Visit.company_id == company_id, Visit.customer_id.isnot(None))
    if team_ids is not None:
        query = query.filter(Visit.employee_id.in_(team_ids))
    results = query.group_by(Visit.customer_id).all()
    data = ( {"customer_id": r[0], "count": r[1]} for r in results )
    return ReportResponse(title="Customer Visit", columns=["customer_id", "count"], data=data)

def get_employee_visit(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Employee.name, func.count(Visit.id)).join(Visit, Visit.employee_id == Employee.id).filter(Visit.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Visit.employee_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    data = ( {"employee": r[0], "visit_count": r[1]} for r in results )
    return ReportResponse(title="Employee Visit", columns=["employee", "visit_count"], data=data)

def get_visit_outcome_analysis(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Visit.outcome, func.count(Visit.id)).filter(Visit.company_id == company_id)
    if team_ids is not None:
        query = query.filter(Visit.employee_id.in_(team_ids))
    results = query.group_by(Visit.outcome).all()
    data = ( {"outcome": r[0] or "None", "count": r[1]} for r in results )
    return ReportResponse(title="Visit Outcome Analysis", columns=["outcome", "count"], data=data)

# --- ATTENDANCE ---

def get_daily_attendance(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(CheckIn.check_in_date, func.count(func.distinct(CheckIn.employee_id))).filter(CheckIn.company_id == company_id)
    if team_ids is not None:
        query = query.filter(CheckIn.employee_id.in_(team_ids))
    results = query.group_by(CheckIn.check_in_date).all()
    data = ( {"date": str(r[0]), "employee_count": r[1]} for r in results )
    return ReportResponse(title="Daily Attendance", columns=["date", "employee_count"], data=data)

def get_working_hours(db: Session, company_id: int, team_ids: List[int] = None):
    query = db.query(Employee.name, func.sum(CheckOut.working_hours)).join(CheckOut, CheckOut.employee_id == Employee.id).filter(CheckOut.company_id == company_id)
    if team_ids is not None:
        query = query.filter(CheckOut.employee_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    data = ( {"employee": r[0], "total_hours": round(r[1] or 0, 2)} for r in results )
    return ReportResponse(title="Working Hours", columns=["employee", "total_hours"], data=data)

def get_monthly_attendance(db: Session, company_id: int, team_ids: List[int] = None):
    # Simplified version for now
    query = db.query(Employee.name, func.count(func.distinct(CheckIn.check_in_date))).join(CheckIn, CheckIn.employee_id == Employee.id).filter(CheckIn.company_id == company_id)
    if team_ids is not None:
        query = query.filter(CheckIn.employee_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    data = ( {"employee": r[0], "days_present": r[1]} for r in results )
    return ReportResponse(title="Monthly Attendance", columns=["employee", "days_present"], data=data)

def get_geo_tracking(db: Session, company_id: int, team_ids: List[int] = None):
    from app.models.tracking import EmployeeLocation
    query = db.query(Employee.name, func.count(EmployeeLocation.id)).join(EmployeeLocation, EmployeeLocation.employee_id == Employee.id).filter(EmployeeLocation.company_id == company_id)
    if team_ids is not None:
        query = query.filter(EmployeeLocation.employee_id.in_(team_ids))
    results = query.group_by(Employee.name).all()
    data = ( {"employee": r[0], "location_pings": r[1]} for r in results )
    return ReportResponse(title="Geo Tracking Overview", columns=["employee", "location_pings"], data=data)

