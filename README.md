# 🚀 CRM 360 - Comprehensive CRM System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![MSSQL](https://img.shields.io/badge/mssql-CC292B.svg?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## 📖 1. Project Overview

CRM 360 is a full-featured Customer Relationship Management (CRM) platform
designed to streamline sales, marketing, and support processes. It provides
advanced tools for managing leads, accounts, contacts, opportunities,
activities, and tasks, alongside robust features like field force tracking,
attendance management, role-based access control, and comprehensive reporting.

## 🗂️ 2. Project Structure

```text
CRM_KIMI/
├── backend/          # FastAPI backend, tests, migrations
├── src/              # React frontend source code
├── public/           # Frontend static assets
├── docs/             # Architecture and testing documentation
├── reports/          # QA, UAT, security, and implementation reports
└── scripts/          # Setup and database seeding utilities
```

## 🛠️ 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React,
  Recharts, React Router, Leaflet
- **Backend:** FastAPI, Uvicorn, SQLAlchemy, Alembic, Pytest, Pydantic, Passlib,
  JWT
- **Database:** MSSQL (Production), SQLite (Testing/Fallback)

## ✨ 4. Features

- 🔐 **Authentication & RBAC:** Secure JWT login with 4 roles (Super Admin,
  Company Admin, Manager, Employee).
- 🏢 **Company Isolation:** Multi-tenant architecture ensuring data privacy
  across organizations.
- 🤝 **CRM Modules:** Full lifecycle management for Leads, Customers, Accounts,
  Contacts, Opportunities, and Activities.
- 📅 **Tasks & Meetings:** Advanced scheduling, assignment, and status tracking
  for tasks and meetings.
- 📍 **Geo & Attendance:** Field force tracking, check-in/out logging, and
  geolocation capture.
- 📊 **Reporting:** Real-time dashboards and detailed reports (CSV, XLSX, PDF
  formats).
- 📝 **Audit Logging:** System-wide action tracking for compliance and security.

## ⚙️ 5. Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- MSSQL Server with ODBC Driver (optional, SQLite can be used for fallback)

## 🚀 6. Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac
pip install -r requirements.txt
```

## 🛢️ 7. Database Setup & Environment Variables

Copy `.env.example` to `.env` in the `backend` directory:

```bash
cp backend/.env.example backend/.env
```

Ensure the `DATABASE_URL` in `.env` is set properly. For MSSQL:
`DATABASE_URL="mssql+pyodbc://@localhost/CRM360?driver=ODBC+Driver+18+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes"`

## 🔄 8. Migration Instructions

With the virtual environment activated, apply database migrations to setup the
schema:

```bash
cd backend
.\venv\Scripts\activate
alembic upgrade head
```

## 💻 9. Running the Application

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

## 🧪 10. Running Tests

Run the comprehensive backend test suite:

```bash
cd backend
.\venv\Scripts\activate
pytest tests/ -v -p no:warnings
```

## 🏗️ 11. Build Instructions

To build the frontend for production:

```bash
npm run build
```

## 🔑 12. Default/Demo Accounts

See [`TestLoginCredentials.md`](TestLoginCredentials.md) for full UAT and seeded
credentials.

| Role                 | Email                 | Password     |
| -------------------- | --------------------- | ------------ |
| System Administrator | admin@crm360.com      | Password123! |
| Company Admin        | admin@technova.com    | Password123! |
| Manager              | manager@technova.com  | Password123! |
| Employee             | employee@technova.com | Password123! |
