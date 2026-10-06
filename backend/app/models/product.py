from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Ownership
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    # Pricing
    unit_price = Column(Numeric(15, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    company = relationship("Company")

class OpportunityProduct(Base):
    __tablename__ = "opportunity_products"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)
    discount = Column(Numeric(15, 2), default=0, nullable=False)
    total_price = Column(Numeric(15, 2), nullable=False)

    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    opportunity = relationship("Opportunity", back_populates="products")
    product = relationship("Product")
    company = relationship("Company")
