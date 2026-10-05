from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class VisitStatus(str, enum.Enum):
    Planned = "Planned"
    Started = "Started"
    Completed = "Completed"
    Cancelled = "Cancelled"

class VisitOutcome(str, enum.Enum):
    Meeting_Conducted = "Meeting Conducted"
    Follow_Up_Required = "Follow-Up Required"
    Opportunity_Created = "Opportunity Created"
    Opportunity_Updated = "Opportunity Updated"
    Customer_Not_Available = "Customer Not Available"
    Visit_Cancelled = "Visit Cancelled"

class CheckIn(Base):
    __tablename__ = "check_ins"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    check_in_date = Column(Date, nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=False)
    device_information = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    employee = relationship("Employee")
    company = relationship("Company")
    check_out = relationship("CheckOut", back_populates="check_in", uselist=False)
    locations = relationship("EmployeeLocation", back_populates="check_in")
    visits = relationship("Visit", back_populates="check_in")
    
    __table_args__ = (
        UniqueConstraint('employee_id', 'check_in_date', name='uq_checkin_employee_date'),
    )


class CheckOut(Base):
    __tablename__ = "check_outs"

    id = Column(Integer, primary_key=True, index=True)
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), unique=True, nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    check_out_date = Column(Date, nullable=False, index=True)
    check_out_time = Column(DateTime, nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=False)
    
    working_hours = Column(Float, nullable=False)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    check_in = relationship("CheckIn", back_populates="check_out")
    employee = relationship("Employee")
    company = relationship("Company")


class EmployeeLocation(Base):
    __tablename__ = "employee_locations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    employee = relationship("Employee")
    company = relationship("Company")
    check_in = relationship("CheckIn", back_populates="locations")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    check_in_id = Column(Integer, ForeignKey("check_ins.id"), nullable=True)
    
    visit_date = Column(Date, nullable=False, index=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    status = Column(Enum(VisitStatus), default=VisitStatus.Planned, nullable=False)
    outcome = Column(Enum(VisitOutcome), nullable=True)
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    employee = relationship("Employee")
    company = relationship("Company")
    customer = relationship("Customer")
    account = relationship("Account")
    contact = relationship("Contact")
    check_in = relationship("CheckIn", back_populates="visits")
