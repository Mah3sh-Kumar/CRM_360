import os
import pytest
import subprocess

def test_seeder_safety_guard():
    # Run seeder without SEED_MODE
    env = os.environ.copy()
    if "SEED_MODE" in env:
        del env["SEED_MODE"]
        
    result = subprocess.run(
        ["venv\\Scripts\\python", "seed\\seed_database.py"], 
        env=env,
        capture_output=True,
        text=True,
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    )
    
    assert result.returncode == 1
    assert "Destructive seed operation aborted" in result.stdout

def test_seeder_execution():
    # Only test that it runs successfully with the flag.
    # Note: this will wipe the main DB or whatever DB is in the .env if we just run it directly.
    # So we should mock the DB or just trust the environment variables.
    # Let's pass the test DB URL to it.
    env = os.environ.copy()
    env["SEED_MODE"] = "development"
    env["DATABASE_URL"] = "mssql+pyodbc://@localhost/CRM360_Test?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"
    
    result = subprocess.run(
        ["venv\\Scripts\\python", "seed\\seed_database.py"], 
        env=env,
        capture_output=True,
        text=True,
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    )
    
    assert result.returncode == 0
    assert "Seed completed successfully." in result.stdout
