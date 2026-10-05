# Phase 7 Implementation Report: Account & Contact Management

## 1. Features Implemented
- **Account Management**: End-to-end functionality including database persistence, REST API, RBAC, company isolation, and ownership validation.
- **Contact Management**: End-to-end functionality including database persistence, REST API, RBAC, company isolation, ownership validation, and Account relation.
- **Frontend Integration**: Updated `src/store/crm.tsx` to handle API actions for Accounts and Contacts. Connected with React UI components to replace mock sets.

## 2. Account Model
The SQLAlchemy `Account` model was implemented with fields defined in the SRS:
- `name` (String 200, Required)
- `code` (String 50, Unique, Required)
- `industry` (String 100, Optional)
- `website` (String 255, Optional)
- `email_address` (String 255, Optional)
- `phone_number` (String 20, Optional)
- `company_id` (ForeignKey, Required)
- `owner_id` (ForeignKey, Required)
- `status` (String 50, Required)
- `annual_revenue` (Numeric, Optional)
- `address` (Text, Optional)

## 3. Contact Model
The SQLAlchemy `Contact` model was implemented with fields defined in the SRS:
- `first_name` (String 100, Required)
- `last_name` (String 100, Required)
- `designation` (String 100, Optional)
- `mobile_number` (String 20, Required)
- `alternate_number` (String 20, Optional)
- `email_address` (String 255, Optional)
- `account_id` (ForeignKey, Required)
- `customer_id` (ForeignKey, Optional)
- `company_id` (ForeignKey, Required, to enforce strict company isolation)
- `owner_id` (ForeignKey, Required, inferred from Contact Edit permissions)
- `status` (String 50, Required)
- `notes` (Text, Optional)

## 4. Files Added
- `backend/app/models/account.py`
- `backend/app/models/contact.py`
- `backend/app/schemas/account.py`
- `backend/app/schemas/contact.py`
- `backend/app/routers/accounts.py`
- `backend/app/routers/contacts.py`
- `backend/tests/test_accounts.py`
- `backend/tests/test_contacts.py`

## 5. Files Modified
- `backend/app/models/__init__.py` (Registered Account and Contact models)
- `backend/app/main.py` (Registered accounts and contacts routers)
- `src/store/crm.tsx` (Added `fetchAccounts`, `createAccount`, `updateAccount`, `fetchContacts`, `createContact`, `updateContact`)

## 6. Database / Alembic Changes
- Generated an Alembic migration (`3a9006972b6c_add_accounts_and_contacts_tables.py`) to create `accounts` and `contacts` tables.
- Ran `alembic upgrade head` to apply changes to the underlying MySQL database.

## 7. API Endpoints
### Accounts
- `POST /api/accounts/` (Create Account)
- `GET /api/accounts/` (List Accounts with filters/search)
- `GET /api/accounts/{id}` (View Account)
- `PUT /api/accounts/{id}` (Update Account)
- `DELETE /api/accounts/{id}` (Delete Account)

### Contacts
- `POST /api/contacts/` (Create Contact)
- `GET /api/contacts/` (List Contacts with filters/search)
- `GET /api/contacts/{id}` (View Contact)
- `PUT /api/contacts/{id}` (Update Contact)
- `DELETE /api/contacts/{id}` (Delete Contact)

## 8. RBAC Behavior
- **Super Admin**: Has full access. Can view, edit, and delete all Accounts and Contacts across all companies.
- **Company Admin**: Has access only to their own company's Accounts and Contacts. Cannot delete accounts/contacts.
- **Manager**: Can view and edit Accounts and Contacts owned by themselves or anyone within their team hierarchy. Cannot delete.
- **Employee**: Can view and edit only their own Accounts and Contacts. Cannot delete. Cannot create accounts (as per Account Access Matrix).

## 9. Company Isolation
Server-side tenant isolation logic enforces that a user (unless a Super Admin) can only access Accounts and Contacts where `record.company_id == current_user.company_id`. Strict multi-tenancy validation blocks creating Contacts linked to foreign Accounts. Tests verified IDOR attacks are mitigated (`403 Forbidden`).

## 10. Ownership Rules
- Owners must be active Employees.
- A record's owner must belong to the same company as the record (and the Account/Contact).
- Reassigning an owner triggers a validation step rejecting inactive or cross-tenant users.

## 11. Account / Contact Relationship
- Contacts hold a foreign key `account_id` referencing Accounts.
- When creating or updating a Contact, the API strictly enforces that the Account belongs to the same company as the User and the resulting Contact, blocking cross-company relational exploits.

## 12. Search / Filtering
Server-side search and filtering implemented on index routes using query parameters:
- **Accounts**: Search by `name`, `code`. Filter by `owner_id`, `account_status`, `company_id`.
- **Contacts**: Search by `first_name`, `last_name`, `mobile_number`, `email_address`. Filter by `account_id`, `owner_id`, `contact_status`, `company_id`.

## 13. Frontend Integration
- Replaced mock array updates with live API calls.
- `useEffect` hook now performs data synchronization via `fetchAccounts` and `fetchContacts`.
- All operations apply the proper authorization token from `localStorage`.
- Context scope guarantees UI matches tenant logic.

## 14. Tests Performed
- **Authentication**: Missing/invalid JWT returning `401`. Inactive users returning `403`.
- **Accounts CRUD**: Full end-to-end functionality, strict RBAC enforcement (Employees blocked from creating), Owner activity checks, Duplicate code checks.
- **Contacts CRUD**: Contact-Account relation rules, cross-tenant isolation enforcement.
- **IDOR**: Direct GET, PUT, DELETE to foreign Account and Contact IDs strictly rejected (`403`).
- All Account and Contact tests were fully automated with Pytest.

## 15. Full Regression Results
- `test_auth_rbac.py`, `test_companies.py`, `test_customers.py`, `test_employees.py`, `test_leads.py`, `test_accounts.py`, `test_contacts.py`
- Passed successfully.
- **49 passed, 0 failures, 161 warnings (Pydantic V1/V2 deprecation logs).**

## 16. SRS Traceability
| SRS Requirement | Implementation | Status |
|---|---|---|
| Account Management | Backend + Frontend | Complete |
| Account CRUD | FastAPI + MySQL | Complete |
| Account ownership | Employee relationship | Complete |
| Account company isolation | Server-side | Complete |
| Account RBAC | Server-side | Complete |
| Contact Management | Backend + Frontend | Complete |
| Contact CRUD | FastAPI + MySQL | Complete |
| Contact ↔ Account relationship | Foreign key where required | Complete |
| Contact ownership | Server-side | Complete |
| Contact company isolation | Server-side | Complete |
| Contact RBAC | Server-side | Complete |
| JWT | Existing authentication | Complete |
| MySQL | Database | Complete |
| Audit logging | Deferred | Pending |
| Lead Conversion | Deferred | Pending |

## 17. Remaining Gaps
- Opportunities, Activities, Tasks, Meetings, and Visits modules.

## 18. Lead Conversion Status
Lead Conversion is strictly deferred until Opportunities and other modules require establishing full dependencies. Only the baseline entities exist.

## 19. Audit Status
Audit logging remains deferred. The frontend log mock exists, but server-side persistent audit tables and logging are not yet implemented.

## 20. MySQL / SRS Deviation
> The SRS specifies Microsoft SQL Server. The current development implementation uses MySQL because MySQL is installed and configured in the development environment.

## 21. Issues Discovered and Fixed
- **Account Schema Issue**: An issue was spotted where `code` wasn't mapped within `AccountCreate` pydantic schemas correctly, leading to failed test assignments. Found during automated pytest suite execution, addressed via schema adjustment and test re-run.
