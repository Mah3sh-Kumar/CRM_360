import sys
import os

sys.path.insert(0, os.path.abspath('.'))

from sqlalchemy import create_engine, text, MetaData
from app.models import Base
from sqlalchemy.orm import sessionmaker

mssql_url = "mssql+pyodbc://@localhost/CRM360?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"
engine = create_engine(mssql_url)
Session = sessionmaker(bind=engine)

def clear_tables():
    session = Session()
    try:
        tables = Base.metadata.sorted_tables
        # Reverse order to delete child records before parent records
        tables_to_clear = reversed(tables)
        
        print("--- PHASE 4C: CLEARING SYNTHETIC SEED DATA ---")
        for table in tables_to_clear:
            if table.name == "alembic_version":
                continue
                
            print(f"Clearing table: {table.name}")
            session.execute(table.delete())
            
        session.commit()
        print("Successfully cleared synthetic seed data.")
        
    except Exception as e:
        session.rollback()
        print(f"Error during cleanup: {e}")
        sys.exit(1)
    finally:
        session.close()

def verify_empty():
    print("\n--- PHASE 4D: VERIFY DATABASE IS CLEAN ---")
    session = Session()
    try:
        tables = Base.metadata.sorted_tables
        has_data = False
        
        print(f"{'TABLE':<25} | {'ROWS':<10}")
        for table in tables:
            count = session.execute(text(f"SELECT COUNT(*) FROM {table.name}")).scalar()
            print(f"{table.name:<25} | {count:<10}")
            if table.name != "alembic_version" and count > 0:
                has_data = True
                
        # Check alembic_version
        al_ver = session.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"Alembic Version: {al_ver}")
        
        if al_ver != "5771a15037ac":
            print("ERROR: alembic_version was modified!")
            has_data = True
            
        if has_data:
            print("Database is NOT clean. STOPPING.")
            sys.exit(1)
        else:
            print("Database is clean and ready.")
            
    except Exception as e:
        print(f"Error during verification: {e}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    clear_tables()
    verify_empty()
