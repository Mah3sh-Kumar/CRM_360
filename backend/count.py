import sys, os
sys.path.append(os.getcwd())
from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
tables = ['companies', 'employees', 'customers', 'accounts', 'contacts', 'leads', 'opportunities', 'activities', 'meetings', 'meeting_participants', 'tasks', 'check_ins', 'check_outs', 'employee_locations', 'visits', 'audit_logs']
print('--- PRE-MIGRATION BACKUP COUNTS ---')
for t in tables:
    try:
        res = db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        print(f"{t}: {res}")
    except Exception as e:
        print(f"{t}: Error {e}")
