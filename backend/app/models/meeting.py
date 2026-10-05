from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column("meeting_id", Integer, ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("employee_id", Integer, ForeignKey("employees.id", ondelete="CASCADE"), primary_key=True)
)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    meeting_type = Column(String(50), nullable=False)
    
    related_module = Column(String(50), nullable=True)
    related_record_id = Column(Integer, nullable=True)
    
    organizer_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    
    location = Column(String(200), nullable=True)
    agenda = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="Scheduled")
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    created_date = Column(DateTime, default=func.now())
    updated_date = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    company = relationship("Company")
    organizer = relationship("Employee", foreign_keys=[organizer_id])
    participants = relationship("Employee", secondary=meeting_participants)

    @property
    def participant_ids(self):
        return [p.id for p in self.participants]
