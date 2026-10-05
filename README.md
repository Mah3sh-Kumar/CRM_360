# CRM 360 - Comprehensive CRM System

## 1. Project Overview
CRM 360 is a full-featured Customer Relationship Management (CRM) platform designed to streamline sales, marketing, and support processes. It provides advanced tools for managing leads, accounts, contacts, opportunities, activities, and tasks, alongside robust features like field force tracking, attendance management, role-based access control, and comprehensive reporting.

## 2. Project Structure
```
CRM_KIMI/
├── backend/          # FastAPI backend, tests, migrations
├── frontend/         # React/Vite frontend (src/, public/)
├── docs/             # Architecture and testing documentation
├── reports/          # QA, UAT, security, and implementation reports
└── scripts/          # Setup and database seeding utilities
```

## 3. Technology Stack
**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, React Router
**Backend:** FastAPI, Uvicorn, SQLAlchemy, Alembic, Pytest, Pydantic, Passlib, JWT
**Database:** MySQL (Production/Development), SQLite (Testing/Fallback)

## 4. Features
- **Authentication & RBAC:** Secure JWT login with 4 roles (Super Admin, Company Admin, Manager, Employee).
- **Company Isolation:** Multi-tenant architecture ensuring data privacy across organizations.
- **CRM Modules:** Full lifecycle management for Leads, Customers, Accounts, Contacts, Opportunities, and Activities.
- **Tasks & Meetings:** Advanced scheduling, assignment, and status tracking for tasks and meetings.
- **Geo & Attendance:** Field force tracking, check-in/out logging, and geolocation capture.
- **Reporting:** Real-time dashboards and detailed reports (CSV, XLSX, PDF formats).
- **Audit Logging:** System-wide action tracking for compliance and security.

## 5. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MySQL Server (optional, SQLite can be used)

## 6. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
```

## 7. Database Setup & Environment Variables
Copy `.env.example` to `.env` in the `backend` directory:
```bash
cp backend/.env.example backend/.env
```
Ensure the `DATABASE_URL` in `.env` is set properly. For MySQL:
`DATABASE_URL="mysql+pymysql://user:password@localhost:3306/crm360"`

## 8. Migration Instructions
With the virtual environment activated, apply database migrations to setup the schema:
```bash
cd backend
.\venv\Scripts\activate
alembic upgrade head
```

## 9. Running the Application
**Backend:**
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```
**Frontend:**
```bash
npm install
npm run dev
```

## 10. Running Tests
Run the comprehensive backend test suite:
```bash
cd backend
.\venv\Scripts\activate
pytest tests/ -v -p no:warnings
```

## 11. Build Instructions
To build the frontend for production:
```bash
npm run build
```

## 12. Default/Demo Accounts
See [`docs/testing/test_credentials.md`](docs/testing/test_credentials.md) for full UAT credentials.

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@crm360.local | Super@123 |
| Company Admin | admin@acme.crm360.local | Admin@123 |
| Manager | manager@acme.crm360.local | Manager@123 |
| Employee | employee@acme.crm360.local | Employee@123 |

## 13. Reports
All QA, UAT, and implementation reports are stored in the `reports/` directory. For final system verification, see `reports/qa/FINAL_QA_SECURITY_UAT_REPORT.md`.

## 14. Known Limitations & SRS Deviations
1. **MySQL instead of MSSQL** — Database uses MySQL (with SQLite for testing) instead of MSSQL as specified in SRS.
2. **Complex password policy enforcement absent** — No server-side enforcement of uppercase/lowercase/special character requirements.
3. **Refresh tokens absent** — JWT tokens are single-use access tokens; no refresh token flow is implemented.
4. **Forced session revocation absent** — No mechanism to revoke active sessions/tokens.
5. **Offline tracking queue absent** — No offline data queueing for geo tracking.
6. **Google Maps integration is placeholder** — Map view in tracking UI is a placeholder; requires a Google Maps API key.
7. **Audit frontend disconnected** — AuditLogs.tsx is a UI placeholder not connected to the backend `/api/audit` endpoint.
8. **Audit log retention policy** — 3-year archival relies on external schedulers (e.g., cron jobs).
9. **GPS anti-spoofing** — Relies on browser APIs; strong anti-spoofing is not implemented.