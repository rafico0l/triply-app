# Triply — Codebase Audit

This document summarizes a read-only audit of the current Triply frontend codebase (Figma-generated React + TypeScript). It focuses on architecture, responsibilities, data model, financial logic, hardcoded/mock data, and risks prior to adding any backend (Supabase) or refactors.

## Current Architecture
- Build: Vite + TypeScript, entry `index.html` -> `src/main.tsx` -> `src/app/App.tsx`.
- UI: React functional components, Tailwind CSS (styles in `src/styles/index.css`).
- No routing library; screen switching is controlled by local React state in `App.tsx`.
- No global state library; application state lives in component-level `useState` hooks (primarily in `AuthenticatedApp` inside `App.tsx`).

## Existing Features
- Authentication screens and flow: `src/features/auth/Auth.tsx` (local demo auth flow).
- Tour management: `src/features/tours/*` (tour list, create, invite accept, invite members).
- Expenses: entry/edit UI in `src/features/expenses/AddExpense.tsx` and sheet components for category/paid-by/split/date.
- Main app shell, navigation, and all primary UI lives in `src/app/App.tsx` (mobile and desktop layouts, bottom nav, sidebar).

## Current Data Model (in code)
- Tour: `TOUR` (in `App.tsx`) sample metadata (name, dates, start/end).
- Member: inline `Member` interface in `App.tsx` (id, name, initials, color, balance, paid, isMe, role).
- Expense: inline `Expense` interface in `App.tsx` (id, title, amount, category, paidBy, splitIds, date, dateIso, note, addedBy, addedAt, syncStatus).
- RecordedSettlement: inline `RecordedSettlement` in `App.tsx` (id, from, to, amount, date, dateIso, recordedBy, syncStatus).
- Category definitions: `BUILTIN_CATEGORIES` in `CategorySheet.tsx` and `CATEGORY_META` mapping in `App.tsx`.

## Navigation
- No URL-based routing. `App.tsx` controls high-level screen state via local `screen` and `activeTourId` variables and returns different top-level JSX (invite flow, auth, create tour, invite members, tour list, or `AuthenticatedApp`).
- Inside `AuthenticatedApp`, navigation between `home`, `expenses`, `members`, and `settlement` is a local `tab` state. Sub-screens (expense detail, member detail, settlement history) are managed with `subScreen` union state.

## Financial Logic
- computeMembers(members, expenses, recordedSettlements): computes each member's `paid` (sum of expenses paid), `share` (sum of expense.amount / splitIds.length for expenses where member is included), `settledOut` and `settledIn` from recorded settlements, and sets `balance = paid - share + settledOut - settledIn`. Implemented in `App.tsx`.
- Total spent: sum of `expenses.reduce((s,e)=>s+e.amount,0)` (used in many places, e.g., `StatRow`).
- Member share: per-expense split computed as `expense.amount / expense.splitIds.length` (floating division), rounded in some UI places with `Math.round` for presentation.
- Member balance: derived from `computeMembers` as above. Small thresholds used for display (e.g., <=2 considered settled).
- Settlements: `recordedSettlements` array with `syncStatus` flags; functions `handleRecordSettlement` and `handleDeleteSettlement` add/remove settlements and recompute members.
- Settlement suggestions: `computeSuggestedPayments(members)` — greedy matching algorithm that pairs creditors with debtors by walking sorted lists and creating suggested transfers (returns array of {from,to,amount}).

Notes: The financial calculations are implemented inline in `App.tsx` (not centralized). They use JavaScript numbers and floating division for splits (presentation rounds values), which may cause rounding/precision issues for persisted money.

## Mock / Hardcoded Data
- `src/app/App.tsx`: `MEMBERS_INIT`, `EXPENSES_INIT`, `RECORDED_SETTLEMENTS_INIT`, `TOUR`, and `BUDGET` — used as sample/demo data and initial state.
- `src/features/tours/TourList.tsx`: `TOURS` sample list.
- `src/features/tours/InviteAccept.tsx`: `INVITE_TOUR`, `INVITE_GUESTS`, and `JOINER_NAME` demo invite data.
- Many components render demo avatars and hardcoded strings for the current user (`RI`/`Rafi`) — visible throughout the UI.

## Reusable Components
- Feature-level sheets: `PaidBySheet`, `SplitBetweenSheet`, `CategorySheet`, `DateSheet` (good separation for sheet UI and logic).
- Auth flow components in `Auth.tsx` (reusable `AuthFlow`).
- App-level primitives are embedded inside `App.tsx`: `Avatar`, `Badge`, `SyncBanner`, `AppHeader`, `BottomNavBar`, `SidebarNav`, `EmptyState`, `Sheet` scaffold. Many of these are defined inline rather than in a shared component folder.

## State Management Approach
- Local component state via `useState`, `useRef`, `useEffect`.
- `AuthenticatedApp` holds main app state: `members`, `expenses`, `recordedSettlements`, `tab`, `syncStatus`, and several UI flags.
- No context, Redux, MobX, or other global state libraries present.

### Stateful handlers & where they live
- Main application state and imperative handlers are implemented inside `AuthenticatedApp` in `src/app/App.tsx`.
- Important handlers: `handleExpenseSave` (adds/updates expenses), `handleDeleteExpense` (removes an expense), `handleRecordSettlement` (records settlements), and functions that recompute members such as `computeMembers` and `computeSuggestedPayments`.
- Many UI-level state flags (sheet visibility, toast/snackbar, `syncStatus`) are also held in `AuthenticatedApp` and toggled by the handlers above.


## Offline / Sync UI
- Visual sync indicators exist: `SyncBanner` and expense/settlement `syncStatus` flags (`pending`, `failed`).
- UI shows pending sync and failed states but no actual persistence or network sync implementation is present (no Dexie, no service worker plugin, no offline queue implemented yet).

## Safe-area and Responsive Handling
- Uses CSS `safe-top` / `safe-bottom` spacer elements and `env(safe-area-inset-*)` in inline style calculations (e.g., fab positions and toast offsets).
- Layout adapts with CSS breakpoints (`lg:hidden` / `hidden lg:flex`) to switch between mobile and desktop shell implementations.

## Dependencies and Purpose
- runtime: `react`, `react-dom`.
- build: `vite`, `@vitejs/plugin-react`.
- styling: `tailwindcss`, `@tailwindcss/vite`.
- tooling: `typescript`, `oxfmt` (formatter).

## TypeScript / Build Issues
- I ran `npm run build` (Vite) — build succeeded.
  - Command: `npm run build` -> `vite build` completed with a runtime warning from Vite about `vite.config.ts` usage of `__dirname` and JSON import attributes. Build artifacts produced in `dist/`.
  - No TypeScript compile errors surfaced during build.

## Technical Debt / Risks
- Large monolithic `src/app/App.tsx` (2.5k+ lines): mixes presentation, many inline primitive components, business logic, and data. This central file will be hard to maintain and is high-risk when introducing real data/sync logic.
- Financial logic duplicated across UI and components (e.g., per-expense share calculations are repeated in computeMembers, ExpenseDetails, SplitBetweenSheet). No single tested financial engine.
- computeMembers is sometimes recomputed using `MEMBERS_INIT` instead of the current `members` state in places where state is updated (this appears in `AuthenticatedApp` when recomputing after edits — indicates an easy-to-miss bug where original sample data is used instead of live members). This is a real correctness risk when switching to backend data.
- Money handling uses JavaScript numbers and floating division for splits; there is no centralized minor-unit integer representation or library to guarantee precision for persisted amounts (AGENTS.md explicitly warns against floating-point for persisted money).
- Sync model is UI-only at this point: `syncStatus` flags exist but no persistent offline queue, no idempotency for client-generated records, and no local store (IndexedDB/Dexie) or queued retry logic.
- Hardcoded demo values and user identity are scattered through components; these must be centralized before real auth is introduced.
- Repeated UI primitives across App and features (avatars, badges, header) create duplication and friction for consistency.

## Proposed Target Architecture (gradual)
Goals: preserve Figma-derived UI, centralize business logic, prepare for offline sync and Supabase, keep incremental changes small.

High-level target layers:
- src/ui/ — Presentational components (Figma-derived) kept or lightly wrapped; should remain visually identical.
- src/features/ — Feature entry points (Auth, Tours, Expenses, Members, Settlement) that compose UI and call services.
- src/lib/finance.ts — Pure, testable financial engine (compute totals, per-expense shares using integer minor units, balance calculations, suggested settlement algorithm).
- src/types/ — Central domain TypeScript types and interfaces (Member, Expense, Settlement, Tour, Category).
- src/services/storage.ts — Local persistence and sync queue abstraction (Dexie-based) to support offline-first behavior.
- src/services/api.ts — Backend adapter (abstracted) to be implemented later when Supabase is introduced.

Rationale: moving business logic into `src/lib` and `src/services` allows UI components to remain unchanged visually while gaining testability, correct money semantics, and a single source of truth for calculations and persistence.

## Recommended Refactor Sequence (small, verifiable steps)
1. Add `src/types/*` to centralize domain interfaces (Member, Expense, Settlement, Tour, Category). Why: avoids interface duplication and subtle mismatches across files.
2. Extract a pure financial engine (`src/lib/finance.ts`) containing `computeMembers`, `computeSuggestedPayments`, and helper utilities that operate on integer minor units. Why: centralizes financial rules, simplifies tests, and addresses precision/rounding issues.
3. Move mock data to a single `src/mocks/*` or `src/fixtures/*` file. Why: prevents duplicate sample data and makes it easy to swap real data later.
4. Replace inline calls in `App.tsx` to the new `finance` module (read-only at first — swap internal function calls). Why: reduce duplication while preserving UI.
5. Introduce a lightweight local persistence abstraction (`src/services/storage.ts`) using Dexie for offline support and idempotency (client-generated ids). Why: prepares for offline-first sync and avoids data loss/duplicates.
6. Add an API adapter (`src/services/api.ts`) that is initially a no-op/mock and later wired to Supabase. Why: keeps network logic separate and injectable.
7. Incrementally extract small presentational primitives from `App.tsx` into `src/ui/` (Avatar, Badge, AppHeader, Sheet) and update imports. Why: improves clarity and reuse while keeping visual parity.

Each step should include automated tests (unit tests for finance functions) and a smoke check of the app UI.

## Recommended First Refactor (non-disruptive)
- Create a pure `src/lib/finance.ts` module that implements the financial functions found in `App.tsx` (`computeMembers`, `computeSuggestedPayments`, share calculations). Do NOT change `App.tsx` in the same commit — only add the new module and unit tests. Why:
  - Centralizes and documents the critical business logic without touching UI files.
  - Enables focused unit tests to validate rules (no UI required).
  - Provides a drop-in replacement for the inline functions when ready, reducing risk during later refactors.

## Recommended First Engineering Task (single next step)
- Extract financial calculations into `src/lib/finance.ts` and add unit tests verifying sample scenarios (equal split, single payer, settlements affecting balances, suggested payments). This yields immediate value (test coverage on core rules) and isolates the most critical logic before backend integration.

## Files That Should Not Be Modified Yet
- `src/app/App.tsx` (monolithic shell and many UI details). Preserve this file until the financial engine and types are in place.
- `src/features/*` presentational screens generated from Figma (Auth, Tours, AddExpense sheets). Preserve visual fidelity.

---

## Commands executed during this audit
- `npm run build` (ran in workspace root). Result: build succeeded; Vite emitted a warning about `vite.config.ts` usage of `__dirname` and JSON import attributes, but produced `dist/` artifacts.

Build output summary:
- Vite built production bundle successfully. No TypeScript errors surfaced during the build step.

## Single recommended next engineering task
- Implement `src/lib/finance.ts` with unit tests and migrate the inline financial functions there (create-only, no App.tsx edits yet). This reduces risk and enables correct server integration.

---

Audit performed by GitHub Copilot (read-only pass). I inspected `AGENTS.md` first and then the files referenced above. Contact me if you want me to implement the recommended first refactor (finance module) and accompanying tests.
