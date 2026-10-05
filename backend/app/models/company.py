from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    company_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    address_line_1 = Column(String(255), nullable=True)
    address_line_2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    status = Column(String(50), default="Active", nullable=False) # Active/Inactive

    created_by = Column(String(200), nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_by = Column(String(200), nullable=True)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    employees = relationship("Employee", back_populates="company")
