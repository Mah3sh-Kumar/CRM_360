from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=True)
    mobile_number = Column(String(20), nullable=False)
    alternate_number = Column(String(20), nullable=True)
    email_address = Column(String(255), nullable=True)
    
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("employees.id"), nullable=False)

    status = Column(String(50), default="Active", nullable=False)
    notes = Column(Text, nullable=True)

    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company")
    account = relationship("Account", back_populates="contacts")
    customer = relationship("Customer")
    owner = relationship("Employee")
