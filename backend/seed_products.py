import sys, os
from decimal import Decimal
sys.path.append(os.getcwd())
from app.core.database import SessionLocal
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.product import Product, OpportunityProduct
import random
from datetime import datetime

db = SessionLocal()

def seed_products_and_line_items():
    print("Seeding Products and Opportunity Line Items...")
    companies = db.query(Company).all()
    if not companies:
        print("No companies found.")
        return
    
    # Create products for each company
    products = db.query(Product).all()
    if not products:
        for c in companies:
            for i in range(1, 6): # 5 products per company
                prod = Product(
                    product_code=f"PRD-{c.company_code[-4:]}-{i}",
                    name=f"Enterprise Solution {i} for {c.name}",
                    description=f"High end enterprise solution {i}",
                    company_id=c.id,
                    unit_price=random.choice([1000, 5000, 10000, 50000, 100000]),
                    is_active=True
                )
                db.add(prod)
        db.commit()
    
    # Reload products
    all_products = db.query(Product).all()
    
    # Add opportunity products for existing opportunities
    opportunities = db.query(Opportunity).all()
    for opp in opportunities:
        comp_prods = [p for p in all_products if p.company_id == opp.company_id]
        if not comp_prods:
            continue
        
        # Add 1-3 line items
        num_items = random.randint(1, 3)
        selected_prods = random.sample(comp_prods, min(num_items, len(comp_prods)))
        
        total_revenue = 0
        for p in selected_prods:
            qty = random.randint(1, 10)
            disc = random.choice([0, 0, 5, 10])
            total_p = (p.unit_price * qty) * Decimal((100 - disc) / 100)
            total_revenue += total_p
            
            opp_prod = OpportunityProduct(
                opportunity_id=opp.id,
                product_id=p.id,
                company_id=opp.company_id,
                quantity=qty,
                unit_price=p.unit_price,
                discount=disc,
                total_price=total_p,
                created_date=datetime.utcnow()
            )
            db.add(opp_prod)
        
        # Update opportunity revenue to match line items
        opp.expected_revenue = total_revenue
    
    db.commit()
    print("Products and Line Items seeded successfully.")

if __name__ == "__main__":
    try:
        seed_products_and_line_items()
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
    finally:
        db.close()
