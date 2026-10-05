from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from app.core.database import get_db
from app.models.employee import Employee
from app.models.tracking import CheckIn, CheckOut, EmployeeLocation
from app.schemas.tracking import (
    CheckInCreate, CheckInResponse,
    CheckOutCreate, CheckOutResponse,
    TrackingStatusResponse,
    EmployeeLocationCreate, EmployeeLocationResponse
)
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/check-in", response_model=CheckInResponse)
def create_check_in(
    check_in_data: CheckInCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.status != "Active":
        raise HTTPException(status_code=400, detail="Employee Inactive")
    
    today = date.today()
    
    # Check if already checked in today
    existing_checkin = db.query(CheckIn).filter(
        CheckIn.employee_id == current_user.id,
        CheckIn.check_in_date == today
    ).first()
    
    if existing_checkin:
        raise HTTPException(status_code=400, detail="Already Checked-In")

    # If address is missing, mock a resolution or require frontend to send it.
    address = check_in_data.address or f"Lat: {check_in_data.latitude}, Lng: {check_in_data.longitude}"
    
    new_check_in = CheckIn(
        employee_id=current_user.id,
        company_id=current_user.company_id,
        check_in_date=today,
        check_in_time=datetime.utcnow(),
        latitude=check_in_data.latitude,
        longitude=check_in_data.longitude,
        address=address,
        device_information=check_in_data.device_information,
        remarks=check_in_data.remarks
    )
    db.add(new_check_in)
    db.commit()
    db.refresh(new_check_in)
    return new_check_in

@router.post("/check-out", response_model=CheckOutResponse)
def create_check_out(
    check_out_data: CheckOutCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    today = date.today()
    
    # Must have a check-in today
    check_in = db.query(CheckIn).filter(
        CheckIn.employee_id == current_user.id,
        CheckIn.check_in_date == today
    ).first()
    
    if not check_in:
        raise HTTPException(status_code=400, detail="No Check-In record found.")
        
    # Must not already be checked out today
    existing_checkout = db.query(CheckOut).filter(
        CheckOut.employee_id == current_user.id,
        CheckOut.check_out_date == today
    ).first()
    
    if existing_checkout:
        raise HTTPException(status_code=400, detail="Already checked out.")

    now = datetime.utcnow()
    # Calculate working hours
    working_hours = (now - check_in.check_in_time).total_seconds() / 3600.0
    
    address = check_out_data.address or f"Lat: {check_out_data.latitude}, Lng: {check_out_data.longitude}"
    
    new_check_out = CheckOut(
        check_in_id=check_in.id,
        employee_id=current_user.id,
        company_id=current_user.company_id,
        check_out_date=today,
        check_out_time=now,
        latitude=check_out_data.latitude,
        longitude=check_out_data.longitude,
        address=address,
        working_hours=working_hours,
        remarks=check_out_data.remarks
    )
    db.add(new_check_out)
    db.commit()
    db.refresh(new_check_out)
    return new_check_out

@router.get("/status", response_model=TrackingStatusResponse)
def get_tracking_status(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    today = date.today()
    check_in = db.query(CheckIn).filter(
        CheckIn.employee_id == current_user.id,
        CheckIn.check_in_date == today
    ).first()
    
    check_out = db.query(CheckOut).filter(
        CheckOut.employee_id == current_user.id,
        CheckOut.check_out_date == today
    ).first()
    
    return TrackingStatusResponse(
        is_checked_in=check_in is not None,
        is_checked_out=check_out is not None,
        active_check_in_id=check_in.id if check_in else None,
        check_in_time=check_in.check_in_time if check_in else None
    )

@router.post("/location", response_model=EmployeeLocationResponse)
def record_location(
    location_data: EmployeeLocationCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.status != "Active":
        raise HTTPException(status_code=400, detail="Employee Inactive")
        
    today = date.today()
    check_in = db.query(CheckIn).filter(
        CheckIn.employee_id == current_user.id,
        CheckIn.check_in_date == today
    ).first()
    
    if not check_in:
        raise HTTPException(status_code=400, detail="Check-In required to record location.")
        
    check_out = db.query(CheckOut).filter(
        CheckOut.employee_id == current_user.id,
        CheckOut.check_out_date == today
    ).first()
    
    if check_out:
        raise HTTPException(status_code=400, detail="Cannot record location after Check-Out.")
        
    address = location_data.address or f"Lat: {location_data.latitude}, Lng: {location_data.longitude}"
    
    new_location = EmployeeLocation(
        employee_id=current_user.id,
        company_id=current_user.company_id,
        check_in_id=check_in.id,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        address=address,
        timestamp=datetime.utcnow()
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location

@router.get("/locations", response_model=List[EmployeeLocationResponse])
def get_locations(
    employee_id: int = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(EmployeeLocation).filter(EmployeeLocation.company_id == current_user.company_id)
    
    if current_user.role == "Employee":
        query = query.filter(EmployeeLocation.employee_id == current_user.id)
    elif current_user.role == "Manager":
        # Simplified: Manger sees all in company for now, should be team.
        # Following exact SRS: "Manager -> team locations". We'll filter by manager_id if employee_id isn't provided.
        subordinates = [e.id for e in db.query(Employee.id).filter(Employee.manager_id == current_user.id).all()]
        if employee_id:
            if employee_id not in subordinates and employee_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to view this employee's locations.")
            query = query.filter(EmployeeLocation.employee_id == employee_id)
        else:
            query = query.filter(EmployeeLocation.employee_id.in_(subordinates + [current_user.id]))
    else:
        # Company Admin / Super Admin
        if employee_id:
            query = query.filter(EmployeeLocation.employee_id == employee_id)
            
    today = date.today()
    query = query.filter(EmployeeLocation.timestamp >= datetime(today.year, today.month, today.day))
            
    return query.order_by(EmployeeLocation.timestamp.desc()).limit(100).all()

@router.delete("/cleanup", status_code=status.HTTP_200_OK)
def cleanup_old_locations(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if current_user.role != "Super Admin" and current_user.role != "Company Admin":
        raise HTTPException(status_code=403, detail="Not authorized to perform cleanup")
        
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=180)
    
    deleted = db.query(EmployeeLocation).filter(
        EmployeeLocation.company_id == current_user.company_id,
        EmployeeLocation.timestamp < cutoff
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"message": f"Cleaned up {deleted} location records older than 180 days."}
