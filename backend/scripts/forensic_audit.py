import sys
import os

sys.path.insert(0, os.path.abspath('.'))

from sqlalchemy import create_engine, text, inspect
from app.models import Base

mssql_url = "mssql+pyodbc://@localhost/CRM360?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"
sqlite_url = "sqlite:///./crm360.db"

mssql_engine = create_engine(mssql_url)
sqlite_engine = create_engine(sqlite_url)

print("--- 2. ALEMBIC HISTORY ANALYSIS ---")
with mssql_engine.connect() as conn:
    try:
        ms_rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"MSSQL Alembic Revision: {ms_rev}")
    except Exception as e:
        print(f"Error reading MSSQL alembic_version: {e}")

with sqlite_engine.connect() as conn:
    try:
        sq_rev = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"SQLite Alembic Revision: {sq_rev}")
    except Exception as e:
        print(f"Error reading SQLite alembic_version: {e}")

print("\n--- 3. SCHEMA COMPARISON ---")
inspector = inspect(mssql_engine)
print(f"{'TABLE':<25} | {'MSSQL COLS':<10} | {'MODEL COLS':<10} | {'MATCH'}")
for table in Base.metadata.sorted_tables:
    tname = table.name
    try:
        db_cols = inspector.get_columns(tname)
        db_col_names = [c['name'] for c in db_cols]
        model_col_names = [c.name for c in table.columns]
        
        match = "YES" if set(db_col_names) == set(model_col_names) else "NO"
        print(f"{tname:<25} | {len(db_col_names):<10} | {len(model_col_names):<10} | {match}")
        if match == "NO":
            print(f"  MSSQL has: {set(db_col_names) - set(model_col_names)}")
            print(f"  Model has: {set(model_col_names) - set(db_col_names)}")
    except Exception as e:
        print(f"{tname:<25} | {'ERROR':<10} | {len(table.columns):<10} | NO")

print("\n--- 4. DATA CHARACTERIZATION (MSSQL SAMPLE) ---")
tables_to_sample = ['companies', 'employees', 'customers', 'leads']
with mssql_engine.connect() as conn:
    for t in tables_to_sample:
        print(f"\n--- {t} ---")
        try:
            res = conn.execute(text(f"SELECT TOP 3 * FROM {t}")).fetchall()
            for r in res:
                d = dict(r._mapping)
                if 'hashed_password' in d:
                    d['hashed_password'] = '***'
                print(d)
        except Exception as e:
            print(f"Error sampling {t}: {e}")

print("\n--- 7. SQLITE VS MSSQL COMPARISON (SQLITE SAMPLE) ---")
with sqlite_engine.connect() as conn:
    for t in tables_to_sample:
        print(f"\n--- {t} ---")
        try:
            res = conn.execute(text(f"SELECT * FROM {t} LIMIT 3")).fetchall()
            for r in res:
                d = dict(r._mapping)
                if 'hashed_password' in d:
                    d['hashed_password'] = '***'
                print(d)
        except Exception as e:
            print(f"Error sampling {t}: {e}")
