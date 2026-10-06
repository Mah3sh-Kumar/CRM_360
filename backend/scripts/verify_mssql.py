from sqlalchemy import create_engine, text, inspect
import sys
import os

sys.path.insert(0, os.path.abspath('.'))

mssql_url = "mssql+pyodbc://@localhost/CRM360?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"
sqlite_url = "sqlite:///./crm360.db"

mssql_engine = create_engine(mssql_url)
sqlite_engine = create_engine(sqlite_url)

print("--- PHASE 3A: SCHEMA VERIFICATION ---")
try:
    with mssql_engine.connect() as conn:
        # Check alembic version
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        mssql_version = result.scalar()
        print(f"MSSQL Alembic Version: {mssql_version}")
        
    with sqlite_engine.connect() as conn:
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        sqlite_version = result.scalar()
        print(f"SQLite Alembic Version: {sqlite_version}")
        
    if mssql_version == sqlite_version:
        print("MSSQL schema is already at Alembic head; no schema migration required.")
    else:
        print("Warning: Alembic versions do not match.")

    # Check for existing data in MSSQL tables
    print("\n--- CHECKING MSSQL DATA ---")
    inspector = inspect(mssql_engine)
    tables = inspector.get_table_names()
    has_data = False
    
    with mssql_engine.connect() as conn:
        for table in tables:
            if table == "alembic_version":
                continue
            count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            if count > 0:
                print(f"Table {table} has {count} rows.")
                has_data = True
                
    if has_data:
        print("STOP: MSSQL database contains unexpected data. It is not empty.")
    else:
        print("MSSQL database is empty and ready for data migration.")

except Exception as e:
    print(f"Error during verification: {e}")
    sys.exit(1)
