import sys
import os
sys.path.insert(0, os.path.abspath('.'))
from sqlalchemy import create_engine, text
from app.models import Base

mssql_url = "mssql+pyodbc://@localhost/CRM360?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"
engine = create_engine(mssql_url)

with engine.connect() as conn:
    print("Clearing tables and resetting identities...")
    for table in reversed(Base.metadata.sorted_tables):
        if table.name == "alembic_version" or table.name == "meeting_participants":
            if table.name == "meeting_participants":
                conn.execute(text(f"DELETE FROM {table.name}"))
            continue
        conn.execute(text(f"DELETE FROM {table.name}"))
        conn.execute(text(f"DBCC CHECKIDENT ('{table.name}', RESEED, 0)"))
    conn.commit()
    print("Database cleared and identities reset.")
