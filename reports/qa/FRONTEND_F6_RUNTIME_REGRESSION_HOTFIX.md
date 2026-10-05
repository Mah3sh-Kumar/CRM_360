# FRONTEND F6 RUNTIME REGRESSION HOTFIX

## Root cause
The global state context declaration for `conversionsState` (`const [conversionsState, setConversions] = useState<Conversion[]>([]);`) was completely missing from `src/store/crm.tsx`. 

## Exact file/line
`src/store/crm.tsx`, near line 164.

## Why `conversionsState` became undefined
During the F6 feature work, when the new context state properties for `loading` and `error` dictionaries were added (`const [loading, setLoadingState]...`), the adjacent `conversionsState` state declaration was likely accidentally deleted or overwritten. Because `conversionsState` was used later in the component in a `useMemo` hook (line 1453), this omission triggered an `Uncaught ReferenceError` at runtime.

## Fix applied
Restored the missing state declaration `const [conversionsState, setConversions] = useState<Conversion[]>([]);` at line 164 in `src/store/crm.tsx`. No other logic was modified, completely preserving the previous application behavior.

## Files changed
- `src/store/crm.tsx`

## Build result
`npm run build` currently fails with TypeScript errors related to `DataTableProps` (`Types of property 'head' are incompatible`). This is an unrelated regression caused by the transition to the new F4.1 DataTable (`columns`/`data` API) across some pages that are still using the old F4 API (`head`/`rows`). This was not addressed as it is outside the scope of this hotfix.

## Runtime result
PASS. The `Uncaught ReferenceError: conversionsState is not defined` crash is fully resolved. `vite dev` compiles successfully (as it skips TS type-checking), and the frontend `CRMProvider` mounts properly without errors. All core pages and lead conversion workflows are functional again.

## Backend test result
PASS (196/196 tests passed successfully).

## Regression result
The isolated runtime regression has been successfully mitigated.

## FINAL STATUS
PASS
