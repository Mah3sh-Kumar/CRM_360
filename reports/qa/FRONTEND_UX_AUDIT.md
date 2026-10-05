# CRM 360 Frontend UX/UI Audit

## Executive Summary
The CRM 360 frontend is functional and correctly aligns with the backend API and RBAC constraints, passing all fundamental tests. However, the UI/UX suffers from inconsistencies, hardcoded styling, primitive data tables, and a lack of proper routing. A significant portion of the UI uses raw HTML elements and inline styles rather than leveraging the robust design system components present in `src/components/ui/`. 

This audit outlines a phased roadmap to elevate the frontend from a "functional prototype" to a "premium enterprise application" without modifying backend logic.

## Architecture
- **Routing:** The application currently handles routing manually via a massive `switch(page)` statement in `App.tsx` and custom state (`route`). This breaks browser history, URL sharing, and deep linking.
- **State Management:** The `CRMProvider` is a massive monolithic context. Updating a single piece of state triggers unnecessary re-renders across the entire application.
- **Component Usage:** There is a discrepancy between the provided `src/components/ui/` library (shadcn-like) and the actual implementation in pages (which use raw `<select>`, `<input>`, and hardcoded hex colors).

## Design System
- **Colors:** The `tailwind.config.js` and `index.css` define CSS variables (e.g., `--primary`, `--background`), but the application heavily relies on hardcoded hex codes (e.g., `bg-[#007f24]`, `text-[#0c231e]`, `bg-[#f4f6f1]`). This breaks theming capabilities and leads to visual inconsistencies.
- **Typography:** Uses Inter, Space Grotesk, and IBM Plex Mono correctly, but semantic usage is sometimes erratic.
- **Spacing/Radius:** Spacing is generally adequate, but modal paddings and form gaps vary between screens.

## Navigation
- **Deep Linking:** Not possible due to the lack of a real router (e.g., React Router).
- **Sidebar:** Fixed width and hardcoded background colors. It works on desktop but completely lacks responsive behavior for mobile (no hamburger menu or drawer).
- **Breadcrumbs:** Missing. Detail pages use a custom `BackBar` which only allows navigating one step back, providing poor context for nested navigation.

## Dashboard
- **Visuals:** Looks decent with Recharts, but charts use hardcoded colors that don't reference the Tailwind theme. 
- **Responsiveness:** Grid layouts work well on large screens but can cause funnel/pie charts to squash on smaller viewports.

## CRM Modules
- **Detail Pages:** `LeadDetail.tsx` and `CustomerDetail.tsx` are feature-rich but contain inline, un-abstracted modal logic (like the Convert Lead modal) which clutters the component.
- **Tabs:** Custom implementation works but doesn't persist state in the URL.

## Tables
- **`DataTable` Component:** Extremely primitive (`src/components/shared.tsx`).
- **Missing Features:** No native sorting, no client-side or server-side pagination controls, no sticky headers, and no column resizing.
- **UX:** Long tables will push the page infinitely instead of utilizing table-level scrolling or pagination.

## Forms & Modals
- **Inconsistencies:** Forms like `TaskModal.tsx` use raw HTML `<select>` and `<input type="datetime-local">` instead of the accessible UI components in `src/components/ui/`.
- **Validation:** Relies purely on HTML5 `required` attributes. No advanced field validation, regex checks, or proper error messaging below fields.
- **Modals:** Hand-rolled overlays without focus trapping or ARIA roles, causing accessibility issues.

## Authentication
- **Login UI:** Looks professional, but error handling is basic. Unhandled API rejections or 500s will render raw messages to the user.

## RBAC UI
- **Implementation:** Excellent. The `navAllowed` and `crm.can()` utilities properly gate UI elements (e.g., the "Convert Lead" button hides if unauthorized). 
- **Data Scoping:** Employees correctly see "My Leads" vs. global "Leads". No changes needed here, just ensure future UI components use these exact wrappers.

## Loading/Error/Empty States
- **Loading:** Minimal. Forms show a basic "Saving..." text. Initial page loads likely display a blank screen or immediately render empty states before data arrives. Needs skeleton loaders.
- **Errors:** API errors are caught and stuffed into a generic red `div`. Form field-level validation errors (422 Unprocessable Entity) are not parsed or mapped to specific inputs.
- **Empty States:** `<EmptyRow>` is used, but it's a plain text row. Needs illustrative empty states for better UX.

## Responsive Design
- **Desktop (1024px - 1920px):** Works well.
- **Mobile/Tablet (< 1024px):** 
  - Sidebar does not collapse into a hamburger menu.
  - Data tables will overflow horizontally without indicating scrollability.
  - Modals might clip on very small heights (e.g., 390x844).

## Accessibility
- Dialogs (e.g., Convert Lead) are just fixed absolute `div`s. They don't trap keyboard focus.
- Form inputs in hand-rolled forms often lack proper `id` and `htmlFor` linkages.
- Icon buttons (`IconBtn`) lack `aria-label` properties, making screen reader navigation difficult.

## Performance
- **Re-renders:** monolithic `CRMContext` triggers full app renders on any state change.
- **Bundle Size:** Recharts is heavy but necessary. Moving to a true router will allow for code-splitting by route.

---

## Issues Found

| ID | Severity | Area | Problem | Recommendation |
|----|----------|------|---------|----------------|
| UX-01 | CRITICAL | Architecture | No real routing system; breaks URLs. | Implement `react-router-dom` to handle navigation and deep linking. |
| UX-02 | CRITICAL | Design System | Hardcoded hex colors everywhere. | Refactor components to use Tailwind theme variables (`bg-primary`, `bg-card`). |
| UX-03 | HIGH | Tables | `DataTable` is primitive (no sort/pagination). | Integrate `@tanstack/react-table` or enhance the custom table component. |
| UX-04 | HIGH | Forms | Forms use raw HTML instead of UI library. | Refactor forms to use `react-hook-form` + `zod` and `src/components/ui/`. |
| UX-05 | HIGH | Responsive | No mobile sidebar/navigation drawer. | Add a collapsible sidebar and hamburger menu for `< 1024px` viewports. |
| UX-06 | MEDIUM | Loading | Lack of Skeleton states during data fetch. | Implement generic skeleton components for tables, charts, and details. |
| UX-07 | MEDIUM | Errors | API errors aren't mapped to form fields. | Parse 422 errors and display them under specific inputs. |
| UX-08 | MEDIUM | Accessibility| Modals do not trap focus; missing ARIA. | Replace custom modals with `Dialog` from `src/components/ui/dialog.tsx`. |
| UX-09 | LOW | Navigation | No breadcrumbs for nested pages. | Add a breadcrumb component above the `PageHeader`. |
| UX-10 | LOW | Components | Inline modals bloat page components. | Extract "Convert Lead" and similar dialogs into their own reusable components. |

---

## Recommended Improvement Roadmap

### Phase 1 — High impact / low risk
- Implement `react-router-dom` to replace the custom `switch` routing in `App.tsx`.
- Replace hardcoded hex colors with semantic Tailwind classes across `App.tsx`, `Dashboard.tsx`, and `shared.tsx`.
- Refactor existing custom modals to use the accessible `src/components/ui/dialog.tsx`.

### Phase 2 — UX improvements
- Upgrade `DataTable` to support sorting and pagination (using `@tanstack/react-table`).
- Introduce `react-hook-form` and `zod` for all forms (e.g., `TaskModal.tsx`).
- Map 422 API errors to individual form fields.

### Phase 3 — Visual polish
- Add proper Skeleton loading states for the Dashboard and data tables.
- Add illustrative Empty States instead of basic text rows.
- Implement responsive Sidebar behavior (hamburger menu for mobile viewports).

### Phase 4 — Performance/accessibility
- Break down the monolithic `CRMProvider` into smaller contexts or use a state manager like Zustand/Redux Toolkit.
- Add ARIA labels to icon buttons and ensure full keyboard navigation support.

---

## Files Recommended for Modification

1. `src/App.tsx` (Routing, responsive sidebar, color variables)
2. `src/pages/Dashboard.tsx` (Colors, responsiveness, skeletons)
3. `src/components/shared.tsx` (Refactoring `DataTable`, replacing hardcoded colors, adding `aria-labels`)
4. `src/components/TaskModal.tsx` (Refactoring to `react-hook-form` and UI components)
5. `src/pages/details/LeadDetail.tsx` (Extract inline modal, update colors)
6. `src/pages/details/CustomerDetail.tsx` (Update colors, empty states)
7. `src/pages/Leads.tsx` (Integrate upgraded table)
8. `src/store/crm.tsx` (Improve error handling/parsing for forms)

---

## Final Audit Summary Answers

**1. Top 10 frontend problems**
1. No actual routing system (URLs don't change).
2. Hardcoded hex colors breaking the design system and theming.
3. Primitive data tables lacking sorting and pagination.
4. Raw HTML forms instead of using the provided UI component library.
5. No mobile navigation (sidebar is desktop-only).
6. Lack of skeleton loading states.
7. Unhandled/unmapped field-level validation errors.
8. Accessibility issues with hand-rolled modals (no focus trapping).
9. Monolithic state provider causing excessive re-renders.
10. Bloated components with inline dialog logic.

**2. Top 10 recommended improvements**
1. Install and integrate `react-router-dom`.
2. Find and replace all hardcoded hex values with Tailwind CSS variables.
3. Implement `@tanstack/react-table` for `DataTable`.
4. Refactor forms using `react-hook-form`, `zod`, and `src/components/ui`.
5. Build a responsive drawer for mobile navigation.
6. Create and implement Skeleton components for data loading phases.
7. Centralize API error parsing to map to form fields.
8. Refactor all modals to use `src/components/ui/dialog.tsx`.
9. Add breadcrumb navigation for detail views.
10. Extract inline modals into separate component files.

**3. Exact files to modify**
- `src/App.tsx`
- `src/components/shared.tsx`
- `src/components/TaskModal.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Leads.tsx`
- `src/pages/details/LeadDetail.tsx`
- `src/pages/details/CustomerDetail.tsx`

**4. Recommended implementation order**
1. Routing setup (`App.tsx`).
2. Design system enforcement (Replacing hex codes globally).
3. Accessible components refactor (Modals, Forms).
4. Data Table upgrade.
5. Polish (Loading states, mobile responsiveness, breadcrumbs).

**5. Estimated risk of each change**
- Routing implementation: **High** (requires widespread changes to how components receive props and navigate).
- Hex color replacement: **Low** (purely cosmetic).
- Form/Modal refactor: **Medium** (requires careful state wiring to maintain current functionality).
- Data Table upgrade: **Medium** (requires updating all pages that pass data to the table).
- Loading states: **Low**.

**6. Any frontend issue that could affect existing backend/RBAC behavior**
- **None currently identified.** The RBAC gates (`crm.can()`) are correctly abstracting the backend rules. 
- *Warning:* When implementing `react-router-dom`, we must ensure that Route Guards are correctly implemented using the existing `navAllowed` logic so users cannot manually URL-hack their way into restricted views.
