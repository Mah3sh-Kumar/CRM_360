from datetime import datetime, timedelta
import random

# Fixed starting point for relative dates
NOW = datetime.utcnow()

COMPANIES = [
    {
        "company_code": "CMP-TECH",
        "name": "TechNova Solutions",
        "email": "contact@technova.com",
        "phone": "+91-9876543210",
        "address_line_1": "12, Tech Estate",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "status": "Active"
    },
    {
        "company_code": "CMP-GREEN",
        "name": "GreenGrid Systems",
        "email": "info@greengrid.in",
        "phone": "+91-9876543211",
        "address_line_1": "45, Green Park",
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "status": "Active"
    },
    {
        "company_code": "CMP-VERTEX",
        "name": "Vertex Digital",
        "email": "hello@vertex.in",
        "phone": "+91-9876543212",
        "address_line_1": "88, Vertex Hub",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "status": "Active"
    }
]

EMPLOYEES = [
    {
        "emp_code": "EMP-SA-01",
        "name": "System Administrator",
        "email": "admin@crm360.com",
        "role": "Super Admin",
        "company_code": None,
        "manager_code": None,
        "designation": "Super Admin",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-CA",
        "name": "Company Administrator",
        "email": "admin@technova.com",
        "role": "Company Admin",
        "company_code": "CMP-TECH",
        "manager_code": None,
        "designation": "CEO",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-MGR1",
        "name": "TechNova Manager 1",
        "email": "manager@technova.com",
        "role": "Manager",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-CA",
        "designation": "Sales Head",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-MGR2",
        "name": "TechNova Manager 2",
        "email": "manager2@technova.com",
        "role": "Manager",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-CA",
        "designation": "Regional Manager",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-01",
        "name": "TechNova Employee 1",
        "email": "employee@technova.com",
        "role": "Employee",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-02",
        "name": "TechNova Employee 2",
        "email": "employee2@technova.com",
        "role": "Employee",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-03",
        "name": "TechNova Employee 3",
        "email": "employee3@technova.com",
        "role": "Employee",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-04",
        "name": "TechNova Employee 4",
        "email": "employee4@technova.com",
        "role": "Employee",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-MGR2",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-TECH-05",
        "name": "TechNova Employee 5",
        "email": "employee5@technova.com",
        "role": "Employee",
        "company_code": "CMP-TECH",
        "manager_code": "EMP-TECH-MGR2",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-CA",
        "name": "GreenGrid Admin",
        "email": "admin@greengrid.in",
        "role": "Company Admin",
        "company_code": "CMP-GREEN",
        "manager_code": None,
        "designation": "CEO",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-MGR1",
        "name": "GreenGrid Manager 1",
        "email": "manager@greengrid.in",
        "role": "Manager",
        "company_code": "CMP-GREEN",
        "manager_code": "EMP-GREEN-CA",
        "designation": "Sales Head",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-MGR2",
        "name": "GreenGrid Manager 2",
        "email": "manager2@greengrid.in",
        "role": "Manager",
        "company_code": "CMP-GREEN",
        "manager_code": "EMP-GREEN-CA",
        "designation": "Regional Manager",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-01",
        "name": "GreenGrid Employee 1",
        "email": "employee@greengrid.in",
        "role": "Employee",
        "company_code": "CMP-GREEN",
        "manager_code": "EMP-GREEN-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-02",
        "name": "GreenGrid Employee 2",
        "email": "employee2@greengrid.in",
        "role": "Employee",
        "company_code": "CMP-GREEN",
        "manager_code": "EMP-GREEN-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-03",
        "name": "GreenGrid Employee 3",
        "email": "employee3@greengrid.in",
        "role": "Employee",
        "company_code": "CMP-GREEN",
        "manager_code": "EMP-GREEN-MGR2",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-GREEN-04",
        "name": "GreenGrid Employee 4",
        "email": "employee4@greengrid.in",
        "role": "Employee",
        "company_code": "CMP-GREEN",
        "manager_code": "EMP-GREEN-MGR2",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-VERTEX-CA",
        "name": "Vertex Admin",
        "email": "admin@vertex.in",
        "role": "Company Admin",
        "company_code": "CMP-VERTEX",
        "manager_code": None,
        "designation": "CEO",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-VERTEX-MGR1",
        "name": "Vertex Manager",
        "email": "manager@vertex.in",
        "role": "Manager",
        "company_code": "CMP-VERTEX",
        "manager_code": "EMP-VERTEX-CA",
        "designation": "Sales Head",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-VERTEX-01",
        "name": "Vertex Employee 1",
        "email": "employee@vertex.in",
        "role": "Employee",
        "company_code": "CMP-VERTEX",
        "manager_code": "EMP-VERTEX-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-VERTEX-02",
        "name": "Vertex Employee 2",
        "email": "employee2@vertex.in",
        "role": "Employee",
        "company_code": "CMP-VERTEX",
        "manager_code": "EMP-VERTEX-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    },
    {
        "emp_code": "EMP-VERTEX-03",
        "name": "Vertex Employee 3",
        "email": "employee3@vertex.in",
        "role": "Employee",
        "company_code": "CMP-VERTEX",
        "manager_code": "EMP-VERTEX-MGR1",
        "designation": "Sales Exec",
        "password": "Password123!"
    }
]

# Provide fake data for generation
FIRST_NAMES = ["Ramesh", "Sita", "Vijay", "Anjali", "Sunil", "Pooja", "Rajesh", "Geeta", "Sanjay", "Anita", "Deepak", "Nisha", "Manoj", "Kiran"]
LAST_NAMES = ["Gupta", "Kumar", "Singh", "Sharma", "Patel", "Reddy", "Rao", "Das", "Bose", "Chawla", "Jain", "Bhatia"]
INDUSTRIES = ["Manufacturing", "IT Services", "Healthcare", "Retail", "Logistics", "Education"]
LEAD_SOURCES = ["Website", "Referral", "Cold Call", "Trade Show", "Partner"]
LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"]
OPP_STAGES = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Won", "Lost"]
TASK_STATUSES = ["Open", "In Progress", "Completed", "Cancelled"]
TASK_PRIORITIES = ["High", "Medium", "Low"]
ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Demo", "Follow-up"]

def random_phone():
    return f"+91-9{random.randint(100000000, 999999999)}"

def generate_leads(count=30):
    leads = []
    revenues = [250000, 580000, 900000, 1250000, 1750000, 2400000, 3500000, 4800000]
    for i in range(count):
        leads.append({
            "lead_name": f"Lead {random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "company_name": f"Enterprise {random.randint(1000, 9999)}",
            "contact_person": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "mobile_number": random_phone(),
            "email_address": f"lead_{random.randint(10000, 99999)}@example.com",
            "lead_source": random.choice(LEAD_SOURCES),
            "industry": random.choice(INDUSTRIES),
            "status": random.choice(LEAD_STATUSES),
            "expected_revenue": random.choice(revenues)
        })
    return leads
