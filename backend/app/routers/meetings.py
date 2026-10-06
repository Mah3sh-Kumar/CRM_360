from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.meeting import Meeting
from app.models.employee import Employee
from app.models.account import Account
from app.models.contact import Contact
from app.models.customer import Customer
from app.models.opportunity import Opportunity
from app.models.lead import Lead
from app.models.activity import Activity

from app.schemas.meeting import MeetingCreate, MeetingUpdate, MeetingResponse, MeetingDetailResponse
from app.api.deps import get_current_user, verify_record_access, get_team_member_ids, require_role

router = APIRouter()

def validate_related_record(db: Session, module: str, record_id: int, company_id: int, user: Employee):
    if not record_id:
        return
        
    model_map = {
        "Lead": Lead,
        "Account": Account,
        "Contact": Contact,
        "Customer": Customer,
        "Opportunity": Opportunity,
        "Activity": Activity,
    }
    
    model = model_map.get(module)
    if not model:
        raise HTTPException(status_code=400, detail=f"Invalid related module: {module}")
        
    record = db.query(model).filter(model.id == record_id).first()
    if not record:
        raise HTTPException(status_code=400, detail="Related record not found")
        
    if record.company_id != company_id:
        raise HTTPException(status_code=403, detail="Related record belongs to a different company")
        
    if hasattr(record, "status") and getattr(record, "status") == "Inactive":
        raise HTTPException(status_code=400, detail="Related record is inactive")
        
    owner_id = getattr(record, "assigned_employee_id", None) or getattr(record, "owner_id", None)
    verify_record_access(db, user, record.company_id, owner_id)

def check_conflicts(db: Session, start: datetime, end: datetime, employee_ids: List[int], exclude_meeting_id: Optional[int] = None):
    # Time overlap condition: (existing.start < new.end) AND (existing.end > new.start)
    query = db.query(Meeting).filter(
        Meeting.status.in_(["Scheduled", "In Progress"]),
        Meeting.start_datetime < end,
        Meeting.end_datetime > start
    )
    if exclude_meeting_id:
        query = query.filter(Meeting.id != exclude_meeting_id)
        
    conflicting_meetings = query.all()
    
    for meeting in conflicting_meetings:
        if meeting.organizer_id in employee_ids:
            raise HTTPException(status_code=409, detail=f"Conflict: Employee {meeting.organizer_id} has an overlapping meeting (ID: {meeting.id})")
        for participant in meeting.participants:
            if participant.id in employee_ids:
                raise HTTPException(status_code=409, detail=f"Conflict: Employee {participant.id} has an overlapping meeting (ID: {meeting.id})")

@router.post("/", response_model=MeetingDetailResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Ensure we compare aware datetimes by converting now to UTC and start_datetime to UTC if aware, or naive if naive
    now = datetime.now(timezone.utc)
    # If the input datetime is naive, assume it's in UTC or make now naive
    start_dt = meeting_in.start_datetime
    if start_dt.tzinfo is None:
        now = now.replace(tzinfo=None)
    
    if start_dt <= now:
        raise HTTPException(status_code=400, detail="Start datetime must be in the future")
    if meeting_in.end_datetime <= meeting_in.start_datetime:
        raise HTTPException(status_code=400, detail="End datetime must be after start datetime")
        
    # Organizer validation
    organizer = db.query(Employee).filter(Employee.id == meeting_in.organizer_id).first()
    if not organizer:
        raise HTTPException(status_code=400, detail="Organizer not found")
    if current_user.role != "Super Admin" and organizer.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Organizer must belong to the same company")
    if organizer.status != "Active":
        raise HTTPException(status_code=400, detail="Organizer must be active")
        
    # Participant validation
    participants = db.query(Employee).filter(Employee.id.in_(meeting_in.participant_ids)).all()
    if len(participants) != len(set(meeting_in.participant_ids)):
        raise HTTPException(status_code=400, detail="One or more participants not found")
    for p in participants:
        if p.company_id != organizer.company_id:
            raise HTTPException(status_code=403, detail="Cross-company participants are not allowed")
        if p.status != "Active":
            raise HTTPException(status_code=400, detail="All participants must be active employees")
            
    # Related Record validation
    if meeting_in.related_module and meeting_in.related_record_id:
        validate_related_record(db, meeting_in.related_module, meeting_in.related_record_id, organizer.company_id, current_user)
        
    # RBAC
    if current_user.role == "Employee":
        if meeting_in.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Employees can only organize meetings for themselves")
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        if meeting_in.organizer_id not in team_ids:
            raise HTTPException(status_code=403, detail="Managers can only create meetings for their team")
            
    # Conflict Detection
    all_involved = set(meeting_in.participant_ids)
    all_involved.add(meeting_in.organizer_id)
    check_conflicts(db, meeting_in.start_datetime, meeting_in.end_datetime, list(all_involved))
        
    meeting_data = meeting_in.dict(exclude={"participant_ids"})
    db_meeting = Meeting(
        **meeting_data,
        company_id=organizer.company_id,
        status="Scheduled"
    )
    db_meeting.participants = participants
    
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@router.get("/", response_model=List[MeetingResponse])
def read_meetings(
    skip: int = 0,
    limit: int = 100,
    title: Optional[str] = None,
    meeting_type: Optional[str] = None,
    status: Optional[str] = None,
    organizer_id: Optional[int] = None,
    participant_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Meeting)
    if current_user.role != "Super Admin":
        query = query.filter(Meeting.company_id == current_user.company_id)
    
    if current_user.role == "Employee":
        query = query.filter(
            (Meeting.organizer_id == current_user.id) | 
            (Meeting.participants.any(Employee.id == current_user.id))
        )
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        query = query.filter(
            Meeting.organizer_id.in_(team_ids) | 
            (Meeting.participants.any(Employee.id.in_(team_ids)))
        )
        
    if title:
        query = query.filter(Meeting.title.ilike(f"%{title}%"))
    if meeting_type:
        query = query.filter(Meeting.meeting_type == meeting_type)
    if status:
        query = query.filter(Meeting.status == status)
    if organizer_id:
        query = query.filter(Meeting.organizer_id == organizer_id)
    if participant_id:
        query = query.filter(Meeting.participants.any(Employee.id == participant_id))
    if start_date:
        query = query.filter(Meeting.start_datetime >= start_date)
    if end_date:
        query = query.filter(Meeting.start_datetime <= end_date)
        
    return query.order_by(Meeting.id.desc()).offset(skip).limit(limit).all()

@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def read_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    # Basic company check
    verify_record_access(db, current_user, meeting.company_id)
    
    if current_user.role == "Employee":
        if meeting.organizer_id != current_user.id and current_user.id not in meeting.participant_ids:
            raise HTTPException(status_code=403, detail="Access denied")
    elif current_user.role == "Manager":
        team_ids = get_team_member_ids(db, current_user.id)
        if meeting.organizer_id not in team_ids and not any(p_id in team_ids for p_id in meeting.participant_ids):
            raise HTTPException(status_code=403, detail="Access denied")
            
    return meeting

@router.put("/{meeting_id}", response_model=MeetingDetailResponse)
def update_meeting(
    meeting_id: int,
    meeting_in: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    verify_record_access(db, current_user, meeting.company_id, meeting.organizer_id)
    
    if meeting.status in ["Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot edit a completed or cancelled meeting")
        
    update_data = meeting_in.dict(exclude_unset=True)
    
    start_dt = update_data.get("start_datetime", meeting.start_datetime)
    end_dt = update_data.get("end_datetime", meeting.end_datetime)
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="End datetime must be after start datetime")
        
    # Related Record validation
    mod = update_data.get("related_module", meeting.related_module)
    rec_id = update_data.get("related_record_id", meeting.related_record_id)
    if mod and rec_id:
        validate_related_record(db, mod, rec_id, meeting.company_id, current_user)
        
    part_ids = update_data.get("participant_ids", meeting.participant_ids)
    org_id = update_data.get("organizer_id", meeting.organizer_id)
    
    if "organizer_id" in update_data:
        org = db.query(Employee).filter(Employee.id == org_id).first()
        if not org or org.company_id != meeting.company_id or org.status != "Active":
            raise HTTPException(status_code=400, detail="Invalid organizer")
            
    if "participant_ids" in update_data:
        participants = db.query(Employee).filter(Employee.id.in_(part_ids)).all()
        if len(participants) != len(set(part_ids)):
            raise HTTPException(status_code=400, detail="One or more participants not found")
        for p in participants:
            if p.company_id != meeting.company_id or p.status != "Active":
                raise HTTPException(status_code=403, detail="Invalid participant")
        meeting.participants = participants

    all_involved = set(part_ids)
    all_involved.add(org_id)
    
    if "start_datetime" in update_data or "end_datetime" in update_data or "participant_ids" in update_data or "organizer_id" in update_data:
        check_conflicts(db, start_dt, end_dt, list(all_involved), exclude_meeting_id=meeting.id)

    for field, value in update_data.items():
        if field != "participant_ids":
            setattr(meeting, field, value)
            
    db.commit()
    db.refresh(meeting)
    return meeting

@router.patch("/{meeting_id}/complete", response_model=MeetingDetailResponse)
def complete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    verify_record_access(db, current_user, meeting.company_id, meeting.organizer_id)
    
    if meeting.status == "Completed":
        raise HTTPException(status_code=400, detail="Meeting is already completed")
    if meeting.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Cannot complete a cancelled meeting")
        
    meeting.status = "Completed"
    db.commit()
    db.refresh(meeting)
    return meeting

@router.patch("/{meeting_id}/cancel", response_model=MeetingDetailResponse)
def cancel_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if current_user.role == "Employee":
        raise HTTPException(status_code=403, detail="Employees cannot cancel meetings")
        
    verify_record_access(db, current_user, meeting.company_id, meeting.organizer_id)
    
    if meeting.status == "Completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed meeting")
    if meeting.status == "Cancelled":
        raise HTTPException(status_code=400, detail="Meeting is already cancelled")
        
    meeting.status = "Cancelled"
    db.commit()
    db.refresh(meeting)
    return meeting

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if current_user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can delete meetings")
        
    verify_record_access(db, current_user, meeting.company_id)
    
    db.delete(meeting)
    db.commit()
