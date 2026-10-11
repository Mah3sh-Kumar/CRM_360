import requests

emails = [
    "admin@crm360.com",
    "admin@technova.com",
    "manager@technova.com",
    "manager2@technova.com",
    "employee@technova.com",
    "employee2@technova.com",
    "employee3@technova.com",
    "employee4@technova.com",
    "employee5@technova.com",
    "admin@greengrid.in",
    "manager@greengrid.in",
    "manager2@greengrid.in",
    "employee@greengrid.in",
    "employee2@greengrid.in",
    "employee3@greengrid.in",
    "employee4@greengrid.in",
    "admin@vertex.in",
    "manager@vertex.in",
    "employee@vertex.in",
    "employee2@vertex.in",
    "employee3@vertex.in"
]

for email in emails:
    res = requests.post("http://localhost:8000/api/auth/login", json={"email": email, "password": "Password123!"})
    print(f"{email}: {res.status_code} {res.text}")
