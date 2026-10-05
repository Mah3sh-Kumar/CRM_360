# Phase 6 Implementation Report

## 1. Features implemented
- Created the full Lead Management module strictly following the CRM 360 SRS.
- Established server-side validation and duplication checks for Leads.
- Enforced Role-Based Access Control (RBAC), multi-tenancy (Company Isolation), and Lead Ownership scopes.
- Synchronized frontend state with new backend `fetchLeads`, `createLead`, and `updateLead` APIs.
- Deferred full audit logging and customer relationship (conversions) based on Phase guidelines.

## 2. Files added
- `backend/app/models/lead.py`
- `backend/app/schemas/lead.py`
- `backend/app/routers/leads.py`
- `backend/tests/test_leads.py`
- `backend/alembic/versions/e1abc64be0f1_add_lead_model.py`

## 3. Files modified
- `backend/app/models/__init__.py`
- `backend/app/main.py`
- `src/store/crm.tsx`

## 4. Database changes
- Added `leads` table in the database utilizing Alembic migrations for MySQL.
- Defined columns: `id`, `lead_name`, `company_name`, `contact_person`, `mobile_number`, `email_address`, `lead_source`, `industry`, `status`, `expected_revenue`, `remarks`, `company_id` (FK), `assigned_employee_id` (FK), `created_date`, `updated_date`.

## 5. API endpoints
- `GET /api/leads/` - Fetch paginated, filtered, and isolated leads based on user's role.
- `GET /api/leads/{id}` - Fetch single lead by ID, respecting tenant constraints.
- `POST /api/leads/` - Create a new lead.
- `PUT /api/leads/{id}` - Update an existing lead.
- `DELETE /api/leads/{id}` - Delete a lead (Super Admin only).

## 6. RBAC behavior
- **Super Admin**: Full CRUD capabilities across all companies.
- **Company Admin**: Can manage leads assigned to their company.
- **Manager**: Can view and manage leads owned by their immediate subordinates/team.
- **Employee**: Can only view and update leads owned by themselves. Cannot re-assign or delete leads.

## 7. Company isolation
- Explicitly enforced at the server side: non-Super-Admin roles cannot view, modify, or create leads outside of their respective `company_id`.
- IDOR attempts to access foreign company leads return a `403 Forbidden` response.

## 8. Lead ownership/assignment rules
- Enforced backend requirement that an employee assigned to a lead must belong to the same company.
- The assigned employee's status must be `Active`.
- Managers can only assign leads to employees within their direct hierarchy.
- Employees can only assign leads to themselves upon creation and are blocked from changing the assigned employee later.

## 9. Lead lifecycle/status implementation
- Pydantic strictly validates statuses to allow only SRS-defined values: `New`, `Contacted`, `Qualified`, `Proposal Sent`, `Negotiation`, `Won`, and `Lost`.

## 10. Search/filtering implementation
- Search parameter added to the API endpoint `GET /api/leads/` supporting string-matching across `lead_name`, `contact_person`, `mobile_number`, and `email_address`.

## 11. Frontend integration
- Integrated `src/store/crm.tsx` to handle backend HTTP requests via FastAPI for Leads (`fetchLeads`, `createLead`, `updateLead`).
- Adapted React frontend context hook mappings from backend schema (camelCase adapter mapping the SQL underscores pattern), eliminating reliance on `mock.ts` for Lead data source.

## 12. Tests performed
- 8 tests dedicated to `test_leads.py`:
  - `test_get_leads_super_admin`: Verified SA cross-company fetching.
  - `test_create_lead_unauthorized`: Evaluated foreign company block mechanism for CA.
  - `test_employee_cannot_assign_to_other`: Verified that regular employees cannot manipulate the ownership tree.
  - `test_get_leads_isolation`: Validated IDOR blocks on endpoints ensuring scoped visibility.
  - `test_invalid_mobile_number`: Verified Pydantic rejection.
  - `test_inactive_employee_assignment`: Confirmed inactive employee prohibition rule.
  - `test_delete_lead_super_admin`: Success pathway for SA deletion.
  - `test_delete_lead_company_admin`: Forbidden deletion error for CA.

## 13. Full regression test results
- Execution against SQLite in-memory yielded 35 passed tests (`test_auth_rbac`, `test_companies`, `test_customers`, `test_employees`, `test_leads`) with zero failures.
- Frontend built successfully under `vite`.

## 14. SRS traceability
| SRS Requirement | Implementation | Status |
|---|---|---|
| Lead Management | Backend + Frontend | Complete |
| Lead CRUD | FastAPI + MySQL | Complete |
| Lead assignment | Employee relationship | Complete |
| BR-003 | Lead assigned to employee | Complete |
| BR-007 | Inactive employees cannot receive assignments | Complete |
| RBAC | Server-side | Complete |
| Multi-tenancy | Company isolation | Complete |
| Manager access | Team/ownership rules | Complete |
| Search/filtering | API-side where required | Complete |
| Lead lifecycle | SRS-defined statuses | Complete |
| JWT | Existing authentication | Complete |
| MySQL | Database | Complete |
| Audit logging | Deferred | Deferred |

## 15. Remaining gaps
- Lead Conversions explicitly deferred based on directive until Customers, Accounts, Opportunities, etc. are established.
- Global audit logs deferred for a dedicated phase.

## 16. MySQL/SRS deviations
- **Database Engine**: The SRS originally specifies Microsoft SQL Server, but the current deployed development utilizes MySQL because MySQL is configured locally in the development environment.

## 17. Any issues discovered and fixed
- Found that `useEffect` hooks in `src/store/crm.tsx` required re-ordering to prevent 'fetch before definition' reference errors during Vite compilation. Addressed and rectified effectively.
