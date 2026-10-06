from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date, datetime

from app.core.database import get_db
from app.api.deps import get_current_user, get_team_member_ids
from app.models.employee import Employee
from app.models.lead import Lead
from app.models.opportunity import Opportunity
from app.models.customer import Customer
from app.models.task import Task
from app.models.tracking import Visit
from app.models.meeting import Meeting

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    team_ids = None
    if current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
    elif current_user.role == "Employee":
        team_ids = [current_user.id]

    def apply_filters(query, model):
        if current_user.role != "Super Admin":
            query = query.filter(model.company_id == current_user.company_id)
        if team_ids is not None:
            if hasattr(model, 'assigned_employee_id'):
                query = query.filter(model.assigned_employee_id.in_(team_ids))
            elif hasattr(model, 'owner_id'):
                query = query.filter(model.owner_id.in_(team_ids))
            elif hasattr(model, 'assigned_to_id'):
                query = query.filter(model.assigned_to_id.in_(team_ids))
            elif hasattr(model, 'employee_id'):
                query = query.filter(model.employee_id.in_(team_ids))
            elif hasattr(model, 'organizer_id'):
                query = query.filter(model.organizer_id.in_(team_ids))
        return query

    # Open Leads
    open_leads = apply_filters(db.query(func.count(Lead.id)).filter(Lead.status.notin_(["Won", "Lost"])), Lead).scalar() or 0
    
    # Pipeline Value (Opp not lost)
    pipeline_value = apply_filters(db.query(func.sum(Opportunity.expected_revenue)).filter(Opportunity.stage != "Lost"), Opportunity).scalar() or 0
    
    # Win Rate
    total_opps = apply_filters(db.query(func.count(Opportunity.id)), Opportunity).scalar() or 0
    won_opps = apply_filters(db.query(func.count(Opportunity.id)).filter(Opportunity.stage == "Won"), Opportunity).scalar() or 0
    win_rate = int((won_opps / total_opps * 100)) if total_opps > 0 else 0
    
    # Active Customers
    active_customers = apply_filters(db.query(func.count(Customer.id)).filter(Customer.status == "Active"), Customer).scalar() or 0
    
    # Tasks Overdue
    now = datetime.utcnow()
    overdue_tasks = apply_filters(db.query(func.count(Task.id)).filter(Task.status != "Completed", Task.due_date < now), Task).scalar() or 0
    
    # Field Visits Today
    today = date.today()
    visits_today = apply_filters(db.query(func.count(Visit.id)).filter(cast(Visit.visit_date, Date) == today), Visit).scalar() or 0

    # Lead Status
    lead_status_res = apply_filters(db.query(Lead.status, func.count(Lead.id)), Lead).group_by(Lead.status).all()
    lead_status = [{"s": row[0], "n": row[1]} for row in lead_status_res]
    
    # Pipeline funnel
    pipeline_stages_res = apply_filters(db.query(Opportunity.stage, func.sum(Opportunity.expected_revenue)), Opportunity).group_by(Opportunity.stage).all()
    stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won']
    pipeline_data = [{"name": s, "value": 0} for s in stages]
    for row in pipeline_stages_res:
        stage = row[0]
        value = row[1] or 0
        for p in pipeline_data:
            if p["name"] == stage:
                p["value"] += float(value)
                
    # Activity mix
    tasks_completed = apply_filters(db.query(func.count(Task.id)).filter(Task.status == "Completed"), Task).scalar() or 0
    visits_completed = apply_filters(db.query(func.count(Visit.id)).filter(Visit.status == "Completed"), Visit).scalar() or 0
    meetings_conducted = apply_filters(db.query(func.count(Meeting.id)).filter(Meeting.status == "Completed"), Meeting).scalar() or 0
    
    activity_mix = [
        {"name": "Tasks Completed", "value": tasks_completed, "fill": "hsl(var(--chart-1))"},
        {"name": "Visits Completed", "value": visits_completed, "fill": "hsl(var(--chart-2))"},
        {"name": "Meetings Conducted", "value": meetings_conducted, "fill": "hsl(var(--chart-3))"}
    ]

    return {
        "kpis": {
            "openLeads": open_leads,
            "pipelineValue": float(pipeline_value),
            "winRate": win_rate,
            "activeCustomers": active_customers,
            "overdueTasks": overdue_tasks,
            "visitsToday": visits_today
        },
        "leadStatus": lead_status,
        "pipeline": pipeline_data,
        "activityMix": activity_mix
    }
