from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mobile = Column(String(20), nullable=False)
    
    # Auth fields
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="Employee") # Super Admin, Company Admin, Manager, Employee
    
    # Organization
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True) # Nullable for Super Admin possibly
    designation = Column(String(100), nullable=False)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    date_of_joining = Column(Date, nullable=False)
    gps_tracking_enabled = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="Active", nullable=False) # Active/On Leave/Inactive

    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="employees")
    manager = relationship("Employee", remote_side=[id], backref="subordinates")
