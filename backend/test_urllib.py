import urllib.request
import json

data = json.dumps({"email": "admin@technova.com", "password": "Password123!"}).encode('utf-8')
req = urllib.request.Request("http://localhost:8000/api/auth/login", data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as f:
        print(f.status, f.read().decode('utf-8'))
except Exception as e:
    print(e)
