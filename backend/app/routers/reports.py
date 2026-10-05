from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.core.database import get_db
from app.api.deps import get_current_user, require_company_access, get_team_member_ids
from app.models.employee import Employee
from app.schemas.report import ReportFilter
from app.services.report_service import (
    get_lead_summary_report,
    get_customer_directory_report,
    get_opportunity_pipeline_report
)
from app.services.export_service import export_report
import app.services.report_service as report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

def parse_report_filters(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    employee_id: Optional[int] = None,
    company_id: Optional[int] = None,
    status: Optional[str] = None
) -> ReportFilter:
    return ReportFilter(
        start_date=start_date,
        end_date=end_date,
        employee_id=employee_id,
        company_id=company_id,
        status=status
    )

@router.get("/leads/summary", response_model=None)
def get_lead_summary(
    format: str = Query("json", description="json, csv, xlsx, pdf"),
    filters: ReportFilter = Depends(parse_report_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    report_data = get_lead_summary_report(db, filters, current_user)
    if format == "json":
        return report_data
    return export_report(report_data, format, "lead_summary")

@router.get("/customers/directory", response_model=None)
def get_customer_directory(
    format: str = Query("json", description="json, csv, xlsx, pdf"),
    filters: ReportFilter = Depends(parse_report_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    report_data = get_customer_directory_report(db, filters, current_user)
    if format == "json":
        return report_data
    return export_report(report_data, format, "customer_directory")

@router.get("/opportunities/pipeline", response_model=None)
def get_opportunity_pipeline(
    format: str = Query("json", description="json, csv, xlsx, pdf"),
    filters: ReportFilter = Depends(parse_report_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    report_data = get_opportunity_pipeline_report(db, filters, current_user)
    if format == "json":
        return report_data
    return export_report(report_data, format, "opportunity_pipeline")

# LEADS

@router.get("/leads/source-analysis", response_model=None)
def report_lead_source_analysis(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_lead_source_analysis(db, current_user.company_id, team_ids)
    return export_report(report, format, "lead_source_analysis")

@router.get("/leads/conversion", response_model=None)
def report_lead_conversion(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_lead_conversion(db, current_user.company_id, team_ids)
    return export_report(report, format, "lead_conversion")

@router.get("/leads/lost-analysis", response_model=None)
def report_lost_lead_analysis(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_lost_lead_analysis(db, current_user.company_id, team_ids)
    return export_report(report, format, "lost_lead_analysis")

@router.get("/leads/employee-performance", response_model=None)
def report_employee_lead_performance(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_employee_lead_performance(db, current_user.company_id, team_ids)
    return export_report(report, format, "employee_lead_performance")

# CUSTOMERS

@router.get("/customers/ownership", response_model=None)
def report_customer_ownership(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_customer_ownership(db, current_user.company_id, team_ids)
    return export_report(report, format, "customer_ownership")

@router.get("/customers/status", response_model=None)
def report_customer_status(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_customer_status(db, current_user.company_id, team_ids)
    return export_report(report, format, "customer_status")

@router.get("/customers/industry-analysis", response_model=None)
def report_customer_industry_analysis(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_customer_industry_analysis(db, current_user.company_id, team_ids)
    return export_report(report, format, "customer_industry_analysis")

# OPPORTUNITIES

@router.get("/opportunities/revenue-forecast", response_model=None)
def report_revenue_forecast(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_revenue_forecast(db, current_user.company_id, team_ids)
    return export_report(report, format, "revenue_forecast")

@router.get("/opportunities/won", response_model=None)
def report_won_opportunity(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_won_opportunity(db, current_user.company_id, team_ids)
    return export_report(report, format, "won_opportunity")

@router.get("/opportunities/lost", response_model=None)
def report_lost_opportunity(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_lost_opportunity(db, current_user.company_id, team_ids)
    return export_report(report, format, "lost_opportunity")

@router.get("/opportunities/aging", response_model=None)
def report_opportunity_aging(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_opportunity_aging(db, current_user.company_id, team_ids)
    return export_report(report, format, "opportunity_aging")

# ACTIVITIES

@router.get("/activities/summary", response_model=None)
def report_activity_summary(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_activity_summary(db, current_user.company_id, team_ids)
    return export_report(report, format, "activity_summary")

@router.get("/activities/employee", response_model=None)
def report_employee_activity(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_employee_activity(db, current_user.company_id, team_ids)
    return export_report(report, format, "employee_activity")

@router.get("/activities/customer-interaction", response_model=None)
def report_customer_interaction(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_customer_interaction(db, current_user.company_id, team_ids)
    return export_report(report, format, "customer_interaction")

@router.get("/activities/pending", response_model=None)
def report_pending_activity(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_pending_activity(db, current_user.company_id, team_ids)
    return export_report(report, format, "pending_activity")

# TASKS

@router.get("/tasks/summary", response_model=None)
def report_task_summary(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_task_summary(db, current_user.company_id, team_ids)
    return export_report(report, format, "task_summary")

@router.get("/tasks/pending", response_model=None)
def report_pending_task(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_pending_task(db, current_user.company_id, team_ids)
    return export_report(report, format, "pending_task")

@router.get("/tasks/overdue", response_model=None)
def report_overdue_task(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_overdue_task(db, current_user.company_id, team_ids)
    return export_report(report, format, "overdue_task")

@router.get("/tasks/completion", response_model=None)
def report_task_completion(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_task_completion(db, current_user.company_id, team_ids)
    return export_report(report, format, "task_completion")

# MEETINGS

@router.get("/meetings/summary", response_model=None)
def report_meeting_summary(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_meeting_summary(db, current_user.company_id, team_ids)
    return export_report(report, format, "meeting_summary")

@router.get("/meetings/customer", response_model=None)
def report_customer_meeting(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_customer_meeting(db, current_user.company_id, team_ids)
    return export_report(report, format, "customer_meeting")

@router.get("/meetings/employee", response_model=None)
def report_employee_meeting(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_employee_meeting(db, current_user.company_id, team_ids)
    return export_report(report, format, "employee_meeting")

@router.get("/meetings/outcome", response_model=None)
def report_meeting_outcome(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_meeting_outcome(db, current_user.company_id, team_ids)
    return export_report(report, format, "meeting_outcome")

# VISITS

@router.get("/visits/daily", response_model=None)
def report_daily_visit(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_daily_visit(db, current_user.company_id, team_ids)
    return export_report(report, format, "daily_visit")

@router.get("/visits/customer", response_model=None)
def report_customer_visit(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_customer_visit(db, current_user.company_id, team_ids)
    return export_report(report, format, "customer_visit")

@router.get("/visits/employee", response_model=None)
def report_employee_visit(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_employee_visit(db, current_user.company_id, team_ids)
    return export_report(report, format, "employee_visit")

@router.get("/visits/outcome", response_model=None)
def report_visit_outcome_analysis(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_visit_outcome_analysis(db, current_user.company_id, team_ids)
    return export_report(report, format, "visit_outcome_analysis")

# ATTENDANCE

@router.get("/attendance/daily", response_model=None)
def report_daily_attendance(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_daily_attendance(db, current_user.company_id, team_ids)
    return export_report(report, format, "daily_attendance")

@router.get("/attendance/working-hours", response_model=None)
def report_working_hours(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_working_hours(db, current_user.company_id, team_ids)
    return export_report(report, format, "working_hours")

@router.get("/attendance/monthly", response_model=None)
def report_monthly_attendance(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_monthly_attendance(db, current_user.company_id, team_ids)
    return export_report(report, format, "monthly_attendance")

# GEO TRACKING

@router.get("/geo/tracking", response_model=None)
def report_geo_tracking(format: str = "json", db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    team_ids = get_team_member_ids(db, current_user.id) if current_user.role == "Manager" else ([current_user.id] if current_user.role == "Employee" else None)
    report = report_service.get_geo_tracking(db, current_user.company_id, team_ids)
    return export_report(report, format, "geo_tracking")

