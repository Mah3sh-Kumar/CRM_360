# FRONTEND F4.2 DATATABLE COMPATIBILITY HOTFIX

## Root cause
The global types for `DataTableProps` in `src/components/DataTable.tsx` were too restrictive regarding the `loading` and `emptyMessage` props. During the F4.1 hardening when the new `columns`/`data` format was introduced, the legacy `head`/`rows` type definition was restricted to `loading?: never` and `emptyMessage?: never`. When F6 introduced standard loading states across existing unmigrated pages (passing `loading={...}` to legacy DataTables), TypeScript rejected it because those props were explicitly typed as `never`.

## Exact TypeScript error
```
src/pages/Accounts.tsx:26:10 - error TS2322: Type '{ loading: boolean; head: string[]; rows: (string | Element)[][]; }' is not assignable to type 'IntrinsicAttributes & DataTableProps<unknown>'.
  Types of property 'head' are incompatible.
    Type 'string[]' is not assignable to type 'undefined'.
```

## Why legacy head/rows typing broke
TypeScript's discriminated union evaluated the legacy props, saw that `loading` was provided but typed as `never` in the first branch, and thus fell back to evaluating the second branch (`columns`/`data`). In the second branch, `head` is not allowed (`undefined` or `never`), causing the mismatch on `head`.

## Fix
Updated `DataTableProps` in `src/components/DataTable.tsx` to allow `loading?: boolean` and `emptyMessage?: string` in the legacy branch. Additionally, extended the legacy rendering branch in `DataTable.tsx` to actually display the loading spinner overlay and the F3 `Empty` state when `rows.length === 0`, ensuring feature parity between legacy and migrated tables without modifying any page consumers.

## Files changed
- `src/components/DataTable.tsx`

## Legacy compatibility verification
Verified that all pages (Accounts, Contacts, Tasks, Meetings, Visits, Employees, Companies, Audit Logs, Opportunities) passing `head` and `rows` now compile correctly and render their data, loading spinners, and empty states.

## New columns/data verification
Verified that migrated pages (Leads, Customers) using `columns` and `data` maintain their previous functionality (sorting, pagination, empty state, loading state).

## Build result
PASS

## Backend test result
PASS (196/196)

## Runtime result
PASS. The application loads properly without runtime crashes or warnings. Both legacy and new DataTable APIs co-exist gracefully.

## F1–F5 regression result
F1 Routing              PASS
F2 Design System        PASS
F3 Shared UI            PASS
F4 Data Tables          PASS
F4.1 DataTable Hardening PASS
F5 Forms                PASS

## FINAL STATUS
PASS
