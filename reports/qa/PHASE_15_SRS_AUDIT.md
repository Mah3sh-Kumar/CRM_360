# Phase 15 - Governance, Audit & Security Hardening SRS Traceability

| Requirement | Implementation | File/Module | API Endpoint | Test | Status | Known Limitation |
|---|---|---|---|---|---|---|
| Centralized Audit System | Integrated SQLAlchemy `after_flush` event listener capturing changes | `backend/app/core/audit.py` | Transparent | `tests/test_audit.py` | COMPLETE | None |
| Audit ID | Database primary key on `audit_logs` | `backend/app/models/audit_log.py` | `GET /api/audit/` | `test_audit_create` | COMPLETE | None |
| Module | Auto-resolved via `__class__.__name__` | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_create` | COMPLETE | None |
| Record ID | Auto-captured during `after_flush` | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_update` | COMPLETE | None |
| Action | Inferred via state changes (CREATE, UPDATE, WON, etc.) | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_update` | COMPLETE | None |
| Previous Value | Captured via SQLAlchemy `history` | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_update` | COMPLETE | None |
| New Value | Safely serialized excluding secrets | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_create` | COMPLETE | None |
| User | Extracted from FastAPI ContextVar | `backend/app/api/deps.py` | `GET /api/audit/` | `test_audit_create` | COMPLETE | None |
| Timestamp | `datetime.utcnow` | `backend/app/models/audit_log.py` | `GET /api/audit/` | `test_audit_create` | COMPLETE | None |
| IP Address | Extracted from request headers/host in Middleware | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_api_endpoint` | COMPLETE | Relies on proxy headers if behind LB |
| Company changes | `Company` model tracked | `backend/app/core/audit.py` | `GET /api/audit/` | `test_audit_create` | COMPLETE | None |
| Employee changes | `Employee` model tracked | `backend/app/core/audit.py` | `GET /api/audit/` | Full suite coverage | COMPLETE | None |
| Customer changes | `Customer` model tracked | `backend/app/core/audit.py` | `GET /api/audit/` | Full suite coverage | COMPLETE | None |
| Opportunity lifecycle | `WON` / `LOST` actions implemented | `backend/app/core/audit.py` | `GET /api/audit/` | Full suite coverage | COMPLETE | None |
| Lead lifecycle | `CONVERT` action implemented | `backend/app/core/audit.py` | `GET /api/audit/` | Full suite coverage | COMPLETE | None |
| Activity completion | `COMPLETE` action implemented | `backend/app/core/audit.py` | `GET /api/audit/` | Full suite coverage | COMPLETE | None |
| Check-in / Visit | `CHECK_IN`, `CHECK_OUT`, `START`, `COMPLETE` implemented | `backend/app/core/audit.py` | `GET /api/audit/` | Full suite coverage | COMPLETE | None |
| Transactional sync | Operations share `db.commit()` scope | `backend/app/core/audit.py` | N/A | SQLAlchemy guarantee | COMPLETE | None |
| Company Isolation | Audit API filters by user's `company_id` | `backend/app/routers/audit.py` | `GET /api/audit/` | `test_audit_api_endpoint` | COMPLETE | None |
| 3 Years Retention | Schema supports long-term storage | `backend/app/models/audit_log.py` | N/A | DB constraints | COMPLETE WITH DOCUMENTED LIMITATIONS | Archival script/cron deferred to deployment ops |
| API Exceptions | Centralized error handling via FastAPI standard | `backend/app/main.py` | All | Full suite coverage | COMPLETE | None |
| Database Rollback | Transacted sessions isolated on exceptions | `backend/app/core/database.py` | All | Full suite coverage | COMPLETE | None |
| IDOR / RBAC | Cross-company blocks implemented in previous phases & verified | `backend/app/api/deps.py` | All | `test_auth_rbac.py`, etc | COMPLETE | None |
