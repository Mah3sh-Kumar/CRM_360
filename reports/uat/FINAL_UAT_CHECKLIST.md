# Final UAT Checklist

| Test | Expected | Result | Status |
|---|---|---|---|
| Authentication Login | Returns valid JWT token upon success | Successful token generation | Pass |
| Authentication Protect | Requests without tokens fail with 401 | 401 Unauthorized returned | Pass |
| RBAC Admin Access | Super Admins see all companies | Access allowed across data | Pass |
| RBAC Employee Scope | Employees only see their/manager data | Access denied to unauthorized records | Pass |
| Company Isolation | Data strictly scoped to company_id | Cross-company access blocked (403/404) | Pass |
| Lead Creation | Lead stored in database correctly | DB confirms Lead row inserted | Pass |
| Customer Creation | Customers persist and link to Contacts | Customer and Contact created | Pass |
| Account Creation | Account links to Opportunities | Account persists properly | Pass |
| Contact Linking | Contacts bind to Accounts | Relational mapping accurate | Pass |
| Opportunity Pipeline | Stage transitions execute correctly | OppStage updates | Pass |
| Activity Logging | Interactions stored correctly | Activity appears in list | Pass |
| Task Assignment | Task assigned to employee | Task created and assignee linked | Pass |
| Task Completion | Task status updates | Status marked 'Completed' | Pass |
| Meeting Scheduling | Conflict prevention applied | Meeting persists safely | Pass |
| Check-in Tracking | Geo coordinates stored on check-in | Location logged in database | Pass |
| Check-out Capture | Work hours computed | Duration and checkout logged | Pass |
| Visit Lifecycle | Planned -> Started -> Completed | Visit states transition correctly | Pass |
| Reports Generation | Summaries compile data correctly | Aggregation queries succeed | Pass |
| CSV / XLSX / PDF Export | Endpoints return valid file streams | Files generated and downloadable | Pass |
| Audit Logging API | Actions trigger audit row insert | System captures events in `audit_logs` | Pass |
| Error Handling | Meaningful messages, no stack traces | Standard 400/404/500 shapes returned | Pass |
| Database Persistence | Migrations apply and relations hold | `alembic current` confirms head | Pass |
| Frontend Build | React/Vite builds optimized static bundle | `npm run build` exits with code 0 | Pass |
| Backend Startup | FastAPI app listens to port | `uvicorn app.main:app` runs cleanly | Pass |
| Full Regression Suite | Pytest returns 100% success rate | 196/196 tests passing | Pass |
