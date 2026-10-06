from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, CheckConstraint, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        CheckConstraint('expected_revenue >= 0', name='chk_lead_revenue'),
        Index('ix_lead_company_employee', 'company_id', 'assigned_employee_id'),
        Index('ix_lead_company_status', 'company_id', 'status'),
    )

    id = Column(Integer, primary_key=True, index=True)
    lead_name = Column(String(200), nullable=False)
    company_name = Column(String(200), nullable=True)
    contact_person = Column(String(200), nullable=False)
    mobile_number = Column(String(20), nullable=False)
    email_address = Column(String(255), nullable=True)
    lead_source = Column(String(100), nullable=False)
    industry = Column(String(100), nullable=True)
    status = Column(String(50), default="New", nullable=False)
    expected_revenue = Column(Numeric(12, 2), nullable=True)
    remarks = Column(Text, nullable=True)

    # Ownership & Isolation
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    # Timestamps
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", backref="leads")
    assigned_employee = relationship("Employee", backref="assigned_leads")
