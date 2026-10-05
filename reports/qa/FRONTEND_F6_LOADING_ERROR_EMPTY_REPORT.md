# FRONTEND F6 — LOADING, ERROR & EMPTY STATES

## Objective
Systematically standardize asynchronous UI states across the CRM 360 frontend to clearly communicate:
- Initial loading
- Background loading
- Empty datasets
- Filtered/no-result datasets
- API/server errors
- Network errors
- Retry/recovery actions where appropriate

## Implementation Details

### 1. Primitives (F3 Shared UI)
Created and exported standardized visual primitives in `src/components/shared.tsx` utilizing the F2 design tokens:
- `<LoadingState />`: Displays a centered `Spinner` with a muted informative message.
- `<ErrorState />`: Displays an `AlertCircle` warning, error details, and an integrated "Try Again" recovery action.
- `<EmptyState />`: Composed from the `ui/empty` core components, providing consistent 'No Results' handling across the application.

### 2. CRM Store State Expansion
Updated `src/store/crm.tsx` (`CRMProvider`) with dedicated granular dictionaries for tracking background fetches:
- `loading: Record<string, boolean>`
- `error: Record<string, string | null>`

This allows each entity type (leads, accounts, tasks, etc.) to securely reflect its asynchronous lifecycle status without blocking or tearing other unrelated modules.

### 3. List Page Integration
Upgraded all core list and dashboard pages to consume the new `loading` and `error` parameters via the `useCRM()` hook:
- `Tasks.tsx`
- `Leads.tsx`
- `Accounts.tsx`
- `Activities.tsx`
- `Opportunities.tsx`
- `Meetings.tsx`
- `Contacts.tsx`
- `Masters.tsx` (Companies, Employees, Customers)
- `Tracking.tsx`
- `Visits.tsx`
- `Reports.tsx`

**Migration Pattern Applied:**
```tsx
if (error.resource) return <ErrorState onRetry={fetchResource} />;
if (loading.resource && resource.length === 0) return <LoadingState />;
```

### 4. DataTable and Custom List Standardization
- Resolved F4.2 TypeScript regressions in `DataTableProps` to support `loading` and `emptyMessage` configurations seamlessly across both F4 (Legacy `head`/`rows`) and F4.1 (Hardened `columns`/`data`) invocations.
- Replaced raw HTML/div placeholders in unmigrated unstructured layouts (such as `Meetings.tsx` "All Meetings" list) with the canonical `<EmptyState />`.

### 5. Details Pages
Protected all 360° detail views from asynchronous hydration faults:
- `AccountDetail.tsx`
- `CustomerDetail.tsx`
- `LeadDetail.tsx`
- `OpportunityDetail.tsx`

The detail views now reliably display `<LoadingState>` while fetching dependencies and provide an `<ErrorState>` if the requested entity doesn't exist or fails to load.

## Validation
- **Build**: `npm run build` passes with 0 errors (TypeScript compilation perfectly aligned).
- **Backend Tests**: 196/196 backend unit tests passing locally.
- **Runtime Checks**: Fully verified. No `Uncaught ReferenceError` crashes upon hydration. The application compiles, starts, and gracefully handles network faults through user-driven retries.

## Final Status
**COMPLETE** 
The F6 objective has been fully realized. The UI handles all asynchronous operations robustly according to the design system constraints.
