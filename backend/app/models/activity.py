from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(50), nullable=False)
    subject = Column(String(200), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=True)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), nullable=False, default="Scheduled")
    remarks = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_date = Column(DateTime, default=func.now())
    updated_date = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    company = relationship("Company")
    account = relationship("Account")
    contact = relationship("Contact")
    opportunity = relationship("Opportunity")
    assigned_employee = relationship("Employee", foreign_keys=[assigned_employee_id])
