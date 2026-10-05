from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    contact_id = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    stage = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    
    expected_revenue = Column(Numeric(15, 2), nullable=False)
    probability = Column(Integer, nullable=False)
    expected_close_date = Column(DateTime, nullable=False)
    
    description = Column(Text, nullable=True)
    lost_reason = Column(Text, nullable=True)
    
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company")
    account = relationship("Account")
    contact = relationship("Contact")
    owner = relationship("Employee")
