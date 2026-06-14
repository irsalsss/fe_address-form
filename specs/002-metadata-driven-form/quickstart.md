# Quickstart / Validation Guide: Metadata-Driven Address Form

How to verify the feature end-to-end. References [contracts](./contracts/metadata-endpoints.md) and [data-model](./data-model.md); no implementation code here.

## Prerequisites

- Node 24.0.1, pnpm installed
- Backend exposing `GET /countries` and `GET /countries/:code/fields` (Block 1) reachable at `VITE_API_URL`
- `.env` with `VITE_API_URL` (and optionally `VITE_GOOGLE_PLACES_API_KEY`) — read only via `shared/config/env.ts`

## Setup

```bash
pnpm install
pnpm dev            # http://localhost:3001
```

## Automated checks (gates)

```bash
pnpm lint           # ESLint incl. import boundaries
pnpm type-check     # tsc --noEmit (strict, noUncheckedIndexedAccess)
pnpm test:ci        # Vitest single run (unit + integration)
pnpm test:e2e       # Playwright (chromium + firefox + webkit)
```

All four MUST pass before merge (Constitution: Development Workflow & Quality Gates).

## Validation scenarios

### V1 — Metadata drives the form (US1, FR-001/002/005/007)
1. Open the app; open the country dropdown. **Expect**: options come from `GET /countries` (not a hardcoded list).
2. Select USA. **Expect**: fields render in backend `order`; `zip` is a text input, `state` is a dropdown populated from metadata options; no stale/extra fields.

### V2 — Add a country with zero frontend change (US1, SC-001/002)
1. On the backend, add a new country to the registry (and bump/version it).
2. Reload the running frontend (no rebuild/deploy). **Expect**: the new country appears in the dropdown and its form renders correctly from metadata, using the backend English labels where no local translation exists.

### V3 — Runtime validation matches backend (US2, FR-004/010, SC-005)
1. Select USA, open Manually Edit, enter a 4-digit ZIP, submit. **Expect**: per-field "5-digit" error, submission blocked.
2. Fill all required fields validly, submit. **Expect**: success; address appears in the saved list.
3. Force a backend rejection (e.g. malformed field). **Expect**: server `fieldErrors` map onto the matching fields (FR-011).

### V4 — Loading / error / retry (US3, FR-008/009, SC-007)
1. Throttle network; select a country. **Expect**: loading indicator in place of fields.
2. Make the metadata request fail (offline / 5xx). **Expect**: error message + Retry control.
3. Restore network, click Retry. **Expect**: form renders; no page reload.

### V5 — Country switch carry-over + autocomplete (US4, FR-014/015)
1. Enter text fields + select a dropdown for country A; switch to country B. **Expect**: shared text values carry over; dropdown selection does not.
2. Use Google Places autocomplete (if key configured). **Expect**: fields populate by metadata keys for the active country; partial results flag missing required fields.

### V6 — Label fallback, never raw keys (FR-012/013, SC-006)
1. Render a country/field with no local `fields.<key>` translation. **Expect**: backend English `label` shown.
2. Remove the backend label (or test `humanizeKey` directly). **Expect**: humanized key (e.g. `postalCode` → "Postal Code") — never a raw key.

### V7 — No hardcoded country data / no render branches (SC-002/003)
1. Confirm deleted: `config/country-config.ts`, `config/options.ts`, `schemas/{usa,aus,idn}.ts`, `schemas/index.ts`, `hooks/useCountryFields.ts`, `__tests__/registry-parity.test.ts`.
2. `no-country-branches.test.ts` passes — no `if (country === ...)` in render/confirmation components (mapping logic in `usePlaceMapping` exempt).

### V8 — Existing E2E flow intact (SC-004)
`pnpm test:e2e` — select country → autocomplete → manual edit → submit → appears in saved list, across all supported countries.

## Done when

- V1–V8 pass and all four automated gates are green.
