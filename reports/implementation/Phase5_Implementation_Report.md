# Phase 5 Implementation Report — Customer Master

## 1. Features Implemented
- **Customer Master CRUD**: Created, read, updated, and deactivated Customer records using FastAPI and MySQL.
- **Company Isolation**: Strict server-side isolation enforcing users can only access and create customers within their assigned company.
- **Ownership Management**: Enforced assignment of customers to valid, active employees within the same company.
- **Role-Based Access Control (RBAC)**: Enforced Super Admin, Company Admin, Manager, and Employee visibility logic.
- **Business Rule Validations**: 
  - **BR-001**: Customers must belong to a company.
  - **BR-008**: Inactive companies cannot create customers.
  - **BR-009**: Customers must have a designated owner (employee).

## 2. Files Added
- `backend/app/models/customer.py`
- `backend/app/schemas/customer.py`
- `backend/app/routers/customers.py`
- `backend/tests/test_customers.py`
- `backend/alembic/versions/..._add_customer_table.py`

## 3. Files Modified
- `backend/app/main.py` (wired customers router)
- `backend/app/models/__init__.py` (added Customer)
- `src/store/crm.tsx` (implemented fetchCustomers, createCustomer, updateCustomer to call the API instead of relying on mock data)
- `src/pages/Masters.tsx` (added Create Customer modal, form handling, and status toggle logic)
- `backend/tests/test_auth_rbac.py` (fixed SQLite testing bug)
- `backend/tests/test_companies.py` (fixed SQLite testing bug)
- `backend/tests/test_employees.py` (fixed SQLite testing bug)

## 4. Database Changes
- Alembic migration generated and applied to the existing **MySQL** database.
- Created `customers` table with:
  - `id` (PK), `customer_code` (unique, indexed)
  - `name`, `contact_person`, `email`, `phone`, `address`
  - `company_id` (FK to companies.id)
  - `owner_id` (FK to employees.id)
  - `status` (Active/Inactive)
  - `created_date`, `updated_date`

## 5. API Endpoints
- `GET /api/customers/` (List with skip, limit, search filters)
- `GET /api/customers/{id}` (Read single record)
- `POST /api/customers/` (Create a new customer)
- `PUT /api/customers/{id}` (Update an existing customer / change status)
- `DELETE /api/customers/{id}` (Deactivate a customer)

## 6. RBAC Behavior
- **Super Admin**: Has unrestricted cross-company access to list, view, create, and update customers anywhere.
- **Company Admin**: Restricted to their own company's customers. Can create and assign any active employee in their company.
- **Manager**: Restricted to viewing customers owned by themselves or their team members (direct reports). Can only assign customers to their team members.
- **Employee**: Can only view and update customers directly owned by themselves. Cannot reassign ownership.

## 7. Company Isolation
- Explicitly enforced at the server level on all endpoints. A `403 Forbidden` is returned immediately if a Company Admin, Manager, or Employee attempts to interact with a `customer_id` belonging to a different company, preventing IDOR (Insecure Direct Object Reference) vulnerabilities.

## 8. Customer Ownership Rules
- Enforced assignment mapping. A customer record cannot exist without an `owner_id` mapped to an `Employee`.
- Validations ensure ownership cannot be manipulated by employees directly.

## 9. Employee Assignment Rules
- When a customer is created or reassigned, the assigned owner must:
  - Exist in the `employees` table.
  - Have a status of `"Active"`.
  - Belong to the *exact same company* as the customer record.

## 10. Inactive Company Handling
- Implemented **BR-008**. A customer cannot be created if the associated company has `status == "Inactive"`. The backend explicitly rejects the request with a `400 Bad Request`.

## 11. Frontend Integration
- `src/store/crm.tsx` was updated to manage the `customers` state through API calls instead of `seedCustomers`.
- `Masters.tsx` now uses the actual backend responses.
- Added a functional "Create Customer" modal form that dynamically filters the "Company" and "Owner" dropdowns based on the logged-in user's role and RBAC limits.
- Status toggle added to the UI, securely communicating with the FastAPI backend.
- A production build (`npm run build`) succeeded without any TypeScript compiler errors.

## 12. Tests Performed
- Unit tests written targeting standard workflows for each RBAC role.
- Tested missing and invalid JWTs for auth enforcement.
- Tested cross-company leakage prevention.
- Tested manager hierarchical visibility over team-owned customers.
- Tested BR-001, BR-008, and BR-009 boundary cases.
- Validated employee assignments against inactive and cross-company employees.

## 13. Full Regression Test Results
- **test_auth_rbac.py**: 5 passed
- **test_companies.py**: 8 passed
- **test_employees.py**: 4 passed
- **test_customers.py**: 10 passed
- **Total**: 27 passed, 0 failures.

## 14. SRS Traceability
| SRS Requirement | Implementation | Status |
|---|---|---|
| Customer Master | Backend + Frontend | Complete |
| Customer CRUD | FastAPI + MySQL | Complete |
| Company association | Foreign key | Complete |
| Customer ownership | Employee relationship | Complete |
| Active employee assignment | Backend validation | Complete |
| Inactive company restriction | BR-008 | Complete |
| RBAC | Server-side | Complete |
| Multi-tenancy | Company isolation | Complete |
| JWT Authentication | Existing auth system | Complete |
| MySQL | Database | Complete |
| Audit logging | Deferred | Pending |

## 15. Remaining Gaps
- True Audit Logging is not fully persisted server-side. Basic placeholders remain on the frontend/store for Phase 3/4 parity until the dedicated Audit module is implemented.

## 16. MySQL/SRS Deviations
> The SRS specifies Microsoft SQL Server. The current development implementation continues to use MySQL because MySQL is installed and configured in the development environment.

## 17. Test-Infrastructure Issue Discovered/Fixed
- The Phase 4 report mentioned an intermittent lock issue with SQLite (`test_auth_rbac.py`).
- **Diagnosis**: The existing tests were using file-based SQLite (`sqlite:///./test.db`) with `check_same_thread: False`, but lacked `StaticPool`. In addition, FastAPI `app.dependency_overrides` was being mutated globally across test modules, causing the last-loaded test module's session override to bleed into earlier tests.
- **Fix**: Replaced file-based SQLite test databases with isolated `sqlite:///:memory:` configured with `StaticPool` in each test module. Shifted `app.dependency_overrides` injection directly into the `setup_db` yield loop to ensure tear-down cleans up the dependency mapping properly. This entirely eliminated the concurrency locks and missing table errors, making the suite deterministic and reliable.
