# CRM 360 - Test Credentials

Here are the test accounts seeded into the database for development and testing.

**DEVELOPMENT / UAT TEST CREDENTIALS — NOT FOR PRODUCTION**

### Test Company: ACME Corporation

- **Company Code**: `ACME001`
- **Login Endpoint**: `/api/auth/login`
- **RBAC Hierarchy**:
  - Super Admin (Global scope, no specific company restrictions)
  - Company Admin (Restricted to ACME Corporation)
  - Manager (Restricted to ACME Corporation, team scope)
  - Employee (Restricted to ACME Corporation, personal scope)

### User Accounts

| Role          | Name                  | Email                        | Password       | Company          | Expected Scope        |
| ------------- | --------------------- | ---------------------------- | -------------- | ---------------- | --------------------- |
| Super Admin   | System Administrator  | `superadmin@crm360.local`    | `Super@123`    | Global           | All companies         |
| Company Admin | Company Administrator | `admin@acme.crm360.local`    | `Admin@123`    | ACME Corporation | Company               |
| Manager       | Sales Manager         | `manager@acme.crm360.local`  | `Manager@123`  | ACME Corporation | Team/subordinates     |
| Employee      | Sales Employee        | `employee@acme.crm360.local` | `Employee@123` | ACME Corporation | Permitted own records |
