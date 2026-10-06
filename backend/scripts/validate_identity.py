import sys
import os

sys.path.insert(0, os.path.abspath('.'))

from sqlalchemy import create_engine, text
from app.models import Base
from app.core.database import SessionLocal

print("--- PHASE 4H: IDENTITY VALIDATION ---")
engine = SessionLocal().get_bind()

try:
    with engine.connect() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name == "alembic_version" or table.name == "meeting_participants":
                # These don't have identity columns
                continue
                
            max_id = conn.execute(text(f"SELECT MAX(id) FROM {table.name}")).scalar()
            
            # Use IDENT_CURRENT to check the current identity value
            ident_current = conn.execute(text(f"SELECT IDENT_CURRENT('{table.name}')")).scalar()
            
            max_id_str = str(max_id) if max_id is not None else "None"
            ident_current_str = str(ident_current) if ident_current is not None else "None"
            
            print(f"Table: {table.name:<20} | MAX(id): {max_id_str:<10} | IDENT_CURRENT: {ident_current_str:<10}")

    print("Identity validation complete.")
except Exception as e:
    print(f"Identity validation error: {e}")
