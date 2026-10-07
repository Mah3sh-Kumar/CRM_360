import re
import urllib.request
import json

with open(r'm:\CRM_KIMI\TestLoginCredentials.md', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract all emails and passwords
# Example: | System Administrator | `admin@crm360.com` | Super Admin | *System* | `Password123!` |
# or | TechNova Employee 1 | `employee@technova.com` | Employee | `Password123!` |

emails_passwords = []
for line in text.splitlines():
    if '|' in line and '@' in line:
        parts = [p.strip() for p in line.split('|')]
        # Parts are usually ['', 'Name', 'Email', 'Role', 'Password', '']
        email_part = parts[2] if '@' in parts[2] else parts[1] # Sometimes email is at index 2
        
        email_match = re.search(r'`([^`]+)`', email_part)
        email = email_match.group(1) if email_match else email_part

        pwd_part = parts[4] if len(parts) > 5 and '!' in parts[4] else (parts[5] if len(parts) > 6 and '!' in parts[5] else 'Password123!')
        pwd_match = re.search(r'`([^`]+)`', pwd_part)
        password = pwd_match.group(1) if pwd_match else pwd_part.strip('`')

        emails_passwords.append((email, password))

print(f"Found {len(emails_passwords)} credentials.")
for email, password in emails_passwords:
    data = json.dumps({"email": email, "password": password}).encode('utf-8')
    req = urllib.request.Request("http://localhost:8000/api/auth/login", data=data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as f:
            print(f"{email}: OK")
    except Exception as e:
        print(f"{email}: ERROR - {e}")
