from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    related_module = Column(String(50), nullable=False)
    related_record_id = Column(Integer, nullable=True)
    
    assigned_to_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    priority = Column(String(50), nullable=False, default="Medium")
    status = Column(String(50), nullable=False, default="Open")
    due_date = Column(DateTime, nullable=False)
    
    completion_remarks = Column(Text, nullable=True)
    completed_date = Column(DateTime, nullable=True)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_date = Column(DateTime, default=func.now())
    updated_date = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    company = relationship("Company")
    assigned_to = relationship("Employee", foreign_keys=[assigned_to_id])
    assigned_by = relationship("Employee", foreign_keys=[assigned_by_id])
