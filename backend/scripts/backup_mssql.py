import pyodbc
from datetime import datetime
import sys

server = 'localhost'
database = 'CRM360'
driver = '{ODBC Driver 18 for SQL Server}'
timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
backup_path = f'M:\\CRM360_Backups\\CRM360_Pre_Cutover_{timestamp}.bak'

conn_str = f'DRIVER={driver};SERVER={server};DATABASE={database};Trusted_Connection=yes;TrustServerCertificate=yes;'
try:
    conn = pyodbc.connect(conn_str, autocommit=True)
    cursor = conn.cursor()
    cursor.execute(f"BACKUP DATABASE {database} TO DISK = '{backup_path}'")
    while cursor.nextset():
        pass
    print(f"Backup successful: {backup_path}")
    conn.close()
except Exception as e:
    print(f"Backup failed: {e}")
    sys.exit(1)
