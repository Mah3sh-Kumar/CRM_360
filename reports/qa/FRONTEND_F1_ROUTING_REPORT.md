# FRONTEND_F1_ROUTING_REPORT

## Phase 1: Routing & Application Shell Migration

### Packages Installed
- `react-router-dom` v7.x (via `npm install react-router-dom`)

### Files Changed
1. `src/App.tsx` - Completely refactored to use standard `react-router-dom` `BrowserRouter`, `Routes`, and `Route` paradigm instead of state-based page switching.
2. `src/pages/NotFound.tsx` - Created a new 404 Not Found page for invalid routes.

### Routes Created
- `/login` (Auth Entry)
- `/dashboard`
- `/leads` & `/leads/:id`
- `/accounts` & `/accounts/:id`
- `/contacts`
- `/opportunities` & `/opportunities/:id`
- `/activities`
- `/tasks`
- `/meetings`
- `/tracking`
- `/visits`
- `/companies`
- `/employees`
- `/customers` & `/customers/:id`
- `/reports`
- `/audit-logs`
- `*` (Catch-all 404 Route)

### Authentication Guard Behavior
Created a generic `<ProtectedRoute />` component wrapped around all internal routes. It uses the existing `useCRM()` store logic. If `crm.user` is null/undefined, it uses `<Navigate to="/login" replace />` to redirect the user gracefully. Valid users are allowed to render the matched child components.

### RBAC Guard Behavior
The `<ProtectedRoute />` was also expanded to accept a `module` prop. It uses the existing `navAllowed(crm.user.role, module)` logic to authorize route access. 
If a user attempts to manually type in an unauthorized URL (e.g., an Employee navigating to `/audit-logs`), they are immediately presented with a `403 Forbidden` screen ("Access Denied"), without sending restricted data requests to the backend. The backend ultimately remains the source of truth for all data-level actions.

### Detail Route Migration
State-based navigation for details pages (like `selectedLeadId` or `route.id` in `App.tsx`) was eliminated.
Instead of modifying the actual detail modules (`LeadDetail.tsx`, `AccountDetail.tsx`, etc.) to use `useParams()`, which would violate the constraint "DO NOT rewrite the CRM modules themselves," simple Wrapper components were implemented inside `App.tsx` (`LeadDetailWrapper`, `CustomerDetailWrapper`, etc.).
These wrappers extract the `:id` parameter using `useParams()` and pass it to the existing components as props. Navigation callbacks were updated to use `useNavigate()` to route back to lists or external pages properly. This ensures 100% component reusability while migrating strictly to URL parameters.

### Navigation Changes
The `<aside>` sidebar navigation was refactored from `button` elements modifying state to `<NavLink>` elements. This provides proper deep-linking capabilities, accessibility improvements, native active-state highlighting via React Router, and enables middle-click to open in new tab.
A centralized `go(page, id)` wrapper logic was preserved inside `Shell` specifically for components passing `go()` explicitly (like Dashboard widgets and global search) so that they automatically adapt to absolute paths (e.g. `go('leads', '123')` navigates to `/leads/123`).

### 404 Handling
A new `<NotFound />` page handles wildcard `*` routing, providing a standard "404 - The page you are looking for does not exist" message along with a direct "Go to Dashboard" button.

### Build Result
**PASS**
- Vite production build successful (`dist/` created in 19.39s)
- No type errors or chunking failure.

### Backend Regression Result
**PASS** (196/196 passed)
- Zero failed backend tests, validating that frontend changes did not interfere with the FastAPI layer or the underlying business logic.

### Manual UAT Result
**PASS**
- **Browser Back/Forward:** Functional. URL maps strictly to views.
- **Deep Linking:** Direct navigation to `/leads/LD-2` correctly opens the detail view on mount without clicking through lists.
- **Roles:** Role-based navigation filtering hides unavailable routes (e.g., Audit for Employees), preventing unauthorized UI mapping.

### Bugs Discovered & Fixed
1. **Lost Active States:** The previous sidebar navigation calculated active states based purely on a manual string. Updating it to use `NavLink` correctly restored and enhanced active highlighting based on absolute URL paths.

### Remaining Risks
- The CRM modules themselves (components like `<Dashboard />` and `<GlobalSearch />`) currently still rely on a passed-in `go(page)` prop rather than native hooks like `useNavigate()`. While perfectly functional through the implemented `go()` mapping, a future Phase 2 should clean these up to directly implement React Router hooks for better separation of concerns.
