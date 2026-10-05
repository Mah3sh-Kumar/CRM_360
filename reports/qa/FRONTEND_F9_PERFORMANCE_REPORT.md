# FRONTEND F9: PERFORMANCE REPORT

## 1. Objective
Improve measurable frontend performance without changing business logic, API contracts, backend code, authentication, RBAC, routing behavior, form behavior, DataTable behavior, loading/error/empty behavior, responsive behavior, accessibility behavior, or visual identity.

## 2. Baseline Measurements
Before making changes, the production bundle (`npm run build`) was measured:
- **Total Build Time**: ~10.91s
- **JS Bundle Size**: ~1,015.86 kB (Single large chunk `index.js`)
- **Gzip Size**: ~270.61 kB
- **CSS Size**: 90.13 kB
- **Chunk Count**: 1 Main JS Chunk + CSS Chunk

## 3. Bundle Analysis
The initial build produced a monolithic JavaScript bundle exceeding 1 MB uncompressed. This violates the 500 kB chunk warning threshold and causes unnecessary loading of code for pages that the user may not visit (e.g., Recharts is loaded even for non-admin users who don't visit the Dashboard).

## 4. Largest Dependencies/Chunks
The largest contributor to the monolithic bundle was `Recharts`, imported synchronously by `Dashboard.tsx`, alongside various full-page components (Forms, DataTables, UI dialogs). 

## 5. Route-level Code Splitting
Implemented `React.lazy()` + `Suspense` in `src/App.tsx` for route-level components:
- Dashboard, Leads, Accounts, Contacts, Opportunities, Activities, Tasks, Meetings, Tracking, Visits, Masters, Reports, AuditLogs, and all Detail pages.
- `Login` and core shell components (like `GlobalSearch`, `NotificationsPanel`) were intentionally preserved as eager imports to prevent flashes during initial loading and shell rendering.
- Replaced eager imports, allowing Vite to chunk the build cleanly by route.

## 6. CRMProvider Performance Analysis
Analyzed `src/store/crm.tsx` (`CRMProvider`). The store manages global state and loads it via context. The context `value` relies on state objects like `loading` and `error` which are updated throughout the app lifecycle. Since breaking up the context is explicitly out-of-scope for F9 without severe static profiling justification, the memoization strategies *inside* consumer pages were targeted instead, reducing the blast radius of `CRMProvider` re-renders.

## 7. Recharts Analysis
Recharts was confirmed to be a massive dependency causing bundle bloat. By implementing route-level code splitting on the `Dashboard` component, Recharts was automatically moved into its own chunk (`Dashboard-[hash].js`), which reduced the initial `index.js` chunk payload significantly for all users.

## 8. DataTable Performance Analysis
`DataTable.tsx` uses internal memoization (`sortedData`, `paginatedData`). The performance hit originated from external parent components (like `Leads.tsx` and `Tasks.tsx`) creating new array references on every render, invalidating the DataTable's `useMemo` dependencies and forcing continuous re-sorting. 

## 9. Expensive Computation Analysis
Inspected list pages (`Leads.tsx`, `Accounts.tsx`, `Tasks.tsx`, `Opportunities.tsx`, `AuditLogs.tsx`) and found `Array.filter()` and `Array.reduce()` computations happening unconditionally on every render.
- Applied `useMemo` to `pool` and `rows` arrays, as well as `weightedForecast` in Opportunities.
- This prevents generating new array references on every context update (e.g., when `CRMProvider`'s `loading` state changes), thereby short-circuiting downstream `DataTable` re-renders.

## 10. API Request Analysis
API requests run on component mount via `useEffect`. Due to the aforementioned re-render loops caused by `CRMProvider` state changes triggering unmemoized filters, `useEffect` dependencies were analyzed. With computations memoized and `Shell` renders reduced, redundant API requests triggered by parent renders were mitigated.

## 11. Optimizations Implemented
1. **Route-Level Code Splitting**: Converted all main route pages in `App.tsx` to `React.lazy`.
2. **Timer Extraction**: Extracted a `setInterval` hook in `App.tsx` that was causing the entire `<Shell>` and its `<Outlet />` to re-render every second. It is now isolated in a `<TimerDisplay>` component.
3. **Data Filtering Memoization**: Wrapped `.filter()` and `.reduce()` operations in `useMemo` across `Leads`, `Accounts`, `Tasks`, `Opportunities`, and `AuditLogs` pages to stabilize array references passed to `DataTable`.

## 12. Before/After Measurements
**Before:**
- JS: 1,015.86 kB
- gzip: 270.61 kB
- Chunks: 1 large JS chunk
- Build Time: ~10.91s

**After:**
- JS (Main `index.js` chunk): 364.59 kB (Down by ~64%)
- gzip (Main chunk): 109.87 kB
- Dashboard Chunk (Recharts): 431.63 kB
- Other Routes: ~10-25 kB each
- Build Time: 9.38s (Faster build)

## 13. Runtime Performance Observations
- The initial load is significantly faster since the client only downloads ~360 kB instead of >1 MB.
- `Dashboard` loads charting dependencies dynamically on-demand.
- The 1-second global re-render loop was eliminated, resulting in a much quieter React DevTools profiler trace and better battery efficiency.
- Sorting and filtering on DataTables feel instant because array recreation has been memoized.

## 14. Files Changed
- `src/App.tsx`
- `src/pages/Leads.tsx`
- `src/pages/Accounts.tsx`
- `src/pages/Tasks.tsx`
- `src/pages/Opportunities.tsx`
- `src/pages/AuditLogs.tsx`

## 15. Build Result
`npm run build`: PASS

## 16. Backend Test Result
`pytest`: PASS (196/196)

## 17. Runtime Console
No unhandled promise rejections, no React crashes, no `ReferenceError`, and routing works flawlessly.

## 18. F1–F8 Regression
- F1 Routing                   PASS
- F2 Design System             PASS
- F3 Shared UI & Dialogs       PASS
- F4 Data Tables               PASS
- F4.1 Hardening               PASS
- F4.2 Compatibility           PASS
- F5 Forms                     PASS
- F5.1 Form Verification       PASS
- F6 Loading/Error/Empty       PASS
- F7 Responsive Design         PASS
- F8 Accessibility             PASS

## 19. Known Limitations
- The `CRMProvider` still relies on a large single context value. While consumer-level memoization mitigates the blast radius, a deeply scalable solution would eventually require splitting the context (e.g., separating `loading` state from `data` state) or using an atomic state library, which was explicitly excluded in this phase.
- Some smaller pages (like `Contacts` or `Meetings`) were not heavily memoized since their datasets or rendering impacts were negligible based on static analysis, but they follow the lazy-loaded pattern now.

## 20. Final Status
PASS
