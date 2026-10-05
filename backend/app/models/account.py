from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    email_address = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(String(50), default="Active", nullable=False)
    annual_revenue = Column(Numeric(15, 2), nullable=True)
    address = Column(Text, nullable=True)

    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company")
    owner = relationship("Employee")
    contacts = relationship("Contact", back_populates="account")
