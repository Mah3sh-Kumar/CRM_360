from datetime import datetime, timedelta
import random

# Fixed starting point for relative dates
NOW = datetime.utcnow()

COMPANIES = [
    {
        "company_code": "CMP-ACME",
        "name": "ACME Corporation",
        "email": "contact@acme.com",
        "phone": "+91-9876543210",
        "address_line_1": "12, ACME Estate",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "status": "Active"
    },
    {
        "company_code": "CMP-TRID",
        "name": "Trident Components",
        "email": "info@tridentcomp.in",
        "phone": "+91-9876543211",
        "address_line_1": "45, Tech Park",
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "status": "Active"
    },
    {
        "company_code": "CMP-STER",
        "name": "Sterling Pharma",
        "email": "hello@sterlingpharma.in",
        "phone": "+91-9876543212",
        "address_line_1": "88, Pharma Hub",
        "city": "Hyderabad",
        "state": "Telangana",
        "country": "India",
        "status": "Active"
    },
    {
        "company_code": "CMP-KAVE",
        "name": "Kaveri Foods",
        "email": "sales@kaverifoods.in",
        "phone": "+91-9876543213",
        "address_line_1": "101, Food Park",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "status": "Active"
    },
    {
        "company_code": "CMP-ORBI",
        "name": "Orbit Textiles",
        "email": "contact@orbittextiles.in",
        "phone": "+91-9876543214",
        "address_line_1": "22, Textile Zone",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "country": "India",
        "status": "Active"
    }
]

EMPLOYEES = [
    {"emp_code": "EMP-SA-01", "name": "System Administrator", "email": "superadmin@crm360.local", "role": "Super Admin", "company_code": None, "manager_code": None, "designation": "Super Admin", "password": "Super@123"},
    
    {"emp_code": "EMP-CA-01", "name": "Company Administrator", "email": "admin@acme.crm360.local", "role": "Company Admin", "company_code": "CMP-ACME", "manager_code": None, "designation": "CEO", "password": "Admin@123"},
    {"emp_code": "EMP-MGR-01", "name": "Sales Manager", "email": "manager@acme.crm360.local", "role": "Manager", "company_code": "CMP-ACME", "manager_code": "EMP-CA-01", "designation": "Sales Head", "password": "Manager@123"},
    {"emp_code": "EMP-01", "name": "Sales Employee", "email": "employee@acme.crm360.local", "role": "Employee", "company_code": "CMP-ACME", "manager_code": "EMP-MGR-01", "designation": "Sales Exec", "password": "Employee@123"},
    {"emp_code": "EMP-02", "name": "Kavya Shah", "email": "kavya.s@acme.com", "role": "Employee", "company_code": "CMP-ACME", "manager_code": "EMP-MGR-01", "designation": "Sales Exec"},

    {"emp_code": "EMP-CA-02", "name": "Vikram Singh", "email": "vikram.s@trident.com", "role": "Company Admin", "company_code": "CMP-TRID", "manager_code": None, "designation": "Director"},
    {"emp_code": "EMP-MGR-02", "name": "Amit Sharma", "email": "amit.s@trident.com", "role": "Manager", "company_code": "CMP-TRID", "manager_code": "EMP-CA-02", "designation": "Regional Manager"},
    {"emp_code": "EMP-03", "name": "Rahul Deshmukh", "email": "rahul.d@trident.com", "role": "Employee", "company_code": "CMP-TRID", "manager_code": "EMP-MGR-02", "designation": "Field Agent"},
    
    {"emp_code": "EMP-CA-03", "name": "Suresh Reddy", "email": "suresh.r@sterling.com", "role": "Company Admin", "company_code": "CMP-STER", "manager_code": None, "designation": "MD"},
    {"emp_code": "EMP-MGR-03", "name": "Neha Joshi", "email": "neha.j@sterling.com", "role": "Manager", "company_code": "CMP-STER", "manager_code": "EMP-CA-03", "designation": "Sales Manager"},
    {"emp_code": "EMP-04", "name": "Sneha Patil", "email": "sneha.p@sterling.com", "role": "Employee", "company_code": "CMP-STER", "manager_code": "EMP-MGR-03", "designation": "Executive"},
    {"emp_code": "EMP-05", "name": "Karan Patel", "email": "karan.p@sterling.com", "role": "Employee", "company_code": "CMP-STER", "manager_code": "EMP-MGR-03", "designation": "Executive"}
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
    for i in range(count):
        leads.append({
            "lead_name": f"Lead {random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "company_name": f"Enterprise {i}",
            "contact_person": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "mobile_number": random_phone(),
            "email_address": f"lead{i}@example.com",
            "lead_source": random.choice(LEAD_SOURCES),
            "industry": random.choice(INDUSTRIES),
            "status": random.choice(LEAD_STATUSES),
            "expected_revenue": random.randint(10000, 500000)
        })
    return leads
