import sys
import os

sys.path.insert(0, os.path.abspath('.'))

from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker
from app.models import Base

# Configuration
mssql_url = "mssql+pyodbc://@localhost/CRM360?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"
sqlite_url = "sqlite:///./crm360.db"

# Engines
sqlite_engine = create_engine(sqlite_url)
mssql_engine = create_engine(mssql_url)

# Sessions
SqliteSession = sessionmaker(bind=sqlite_engine)
MssqlSession = sessionmaker(bind=mssql_engine)

def migrate_data():
    sqlite_session = SqliteSession()
    mssql_session = MssqlSession()

    # Tables in dependency order (Base.metadata.sorted_tables)
    tables = Base.metadata.sorted_tables

    print("--- STARTING DATA MIGRATION ---")
    try:
        for table in tables:
            table_name = table.name
            
            # Skip alembic_version as it's managed separately
            if table_name == "alembic_version":
                continue
                
            print(f"Migrating table: {table_name}")
            
            # Read rows from SQLite
            rows = sqlite_session.execute(table.select()).fetchall()
            
            if not rows:
                print(f"  No rows to migrate for {table_name}.")
                continue
            
            # Prepare data dictionaries
            # Using row._mapping (or converting to dict) to ensure safe insert
            data_to_insert = [dict(row._mapping) for row in rows]
            
            # Check if table has an identity column (e.g. id)
            # In SQLAlchemy, autoincrement integer PKs imply Identity in SQL Server.
            has_identity = any(col.primary_key and col.autoincrement == True for col in table.columns)
            
            # Perform transactional insert
            with mssql_engine.begin() as mssql_conn:
                if has_identity:
                    mssql_conn.execute(text(f"SET IDENTITY_INSERT {table_name} ON"))
                
                # Insert data
                mssql_conn.execute(table.insert(), data_to_insert)
                
                if has_identity:
                    mssql_conn.execute(text(f"SET IDENTITY_INSERT {table_name} OFF"))
            
            print(f"  Successfully migrated {len(rows)} rows for {table_name}.")

    except Exception as e:
        print(f"ERROR: Migration failed at table '{table_name}'. Exception: {e}")
        # Sessions and connections are closed via context manager / cleanup, rollback happens in begin()
        sys.exit(1)
    finally:
        sqlite_session.close()
        mssql_session.close()

    print("--- MIGRATION COMPLETED SUCCESSFULLY ---")

def validate_counts():
    print("\n--- VALIDATING ROW COUNTS ---")
    print(f"{'TABLE':<30} {'SQLITE':<10} {'MSSQL':<10} {'STATUS'}")
    
    sqlite_conn = sqlite_engine.connect()
    mssql_conn = mssql_engine.connect()
    
    try:
        for table in Base.metadata.sorted_tables:
            table_name = table.name
            
            sqlite_count = sqlite_conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            
            # Handle if table might not exist in MSSQL (though it should)
            try:
                mssql_count = mssql_conn.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            except Exception:
                mssql_count = 0
                
            status = "PASS" if sqlite_count == mssql_count else "FAIL"
            print(f"{table_name:<30} {sqlite_count:<10} {mssql_count:<10} {status}")
    finally:
        sqlite_conn.close()
        mssql_conn.close()

if __name__ == "__main__":
    # Validate before running
    # migrate_data()
    # validate_counts()
    print("Migration script generated. Review before execution.")
