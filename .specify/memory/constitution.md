<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification. First concrete constitution replacing the
  placeholder template. 1.0.0 baseline per semantic-versioning policy for the first
  adopted set of governing principles.

Modified principles: N/A (initial adoption)
Added principles:
  - I. Metadata-Driven Country Configuration (NON-NEGOTIABLE)
  - II. Schema as the Single Source of Truth
  - III. Feature-Sliced Architecture & Import Boundaries
  - IV. State Management Discipline
  - V. Type Safety & Localization Parity
  - VI. Test Discipline
  - VII. API Contract & Data Integrity
  - VIII. Accessible, Responsive UX
Added sections:
  - Additional Constraints (Stack, Security & Configuration)
  - Development Workflow & Quality Gates
  - Governance

Removed sections: None (template placeholders fully replaced)

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — generic "Constitution Check" gate; no edits needed
  ✅ .specify/templates/spec-template.md — generic; no principle-specific edits needed
  ✅ .specify/templates/tasks-template.md — generic; test/observability task types already covered
  ✅ .specify/templates/commands/*.md — directory absent; nothing to reconcile

Follow-up TODOs: None. RATIFICATION_DATE set to today (2026-06-13) as first adoption.
-->

# AcmeCorp Address Onboarding Constitution

The product is a country-aware customer-onboarding address capture flow: a country
selector, Google Places autocomplete for fast entry, a manual-edit mode that renders
country-specific fields, validation configurable per country, and a backend that
persists and retrieves captured addresses. These principles govern how that system is
designed, built, and changed.

## Core Principles

### I. Metadata-Driven Country Configuration (NON-NEGOTIABLE)

Country-specific behavior — field set, field order, labels, dropdown options, required
flags, and validation rules — MUST be expressed as data (a per-country configuration
object/schema), never as branching control flow scattered across components.

- Adding or amending a supported country (USA, AUS, IDN, and any future country) MUST be
  achievable by adding/editing a configuration entry plus its schema — not by editing
  rendering logic.
- The form renderer MUST be country-agnostic: it consumes the active country's metadata
  and renders fields generically. No `if (country === 'USA')` rendering branches.
- The backend MUST be able to expose this country metadata (field names + validation
  rules) via an API so client and server share one definition of "what a country needs".

**Rationale**: Addresses vary structurally by country and the country list will grow.
Encoding differences as data keeps the renderer and API stable while the catalog expands,
and prevents per-country logic from rotting into untestable conditionals.

### II. Schema as the Single Source of Truth

Each country's address shape and validation MUST be defined once as a Zod schema and
reused for client-side form validation and server-side input parsing.

- Required-field rules, field formats (USA 5-digit ZIP, AUS 4-digit postcode, IDN 5-digit
  postal code), and enumerated dropdowns (US states, AUS states, IDN provinces) live in
  the schema, not duplicated in ad-hoc checks.
- React Hook Form MUST validate through the Zod resolver. No `useState`-based validation.
- The server MUST reject any payload that fails the same schema before persistence.

**Rationale**: One definition eliminates client/server drift, guarantees the database
never stores data the client believed valid (or vice versa), and makes per-country rules
auditable in a single place.

### III. Feature-Sliced Architecture & Import Boundaries

Code MUST follow the feature-sliced structure: feature logic lives under
`src/features/<feature>/` with `api/`, `hooks/`, `stores/`, `schemas/`, `__tests__/`, and
a single `index.ts` public surface.

- A feature MUST NOT import another feature's internals — only its `index.ts`.
- `shared/` and `components/` MUST NOT import from `features/`.
- Network calls MUST originate only from `shared/api/` or a feature's `api/` layer; no
  raw `fetch` elsewhere.
- Absolute imports use the `@/` alias; barrels exist only at feature roots.

**Rationale**: Enforced boundaries keep the dynamic-form feature self-contained and
swappable, protect tree-shaking, and stop the codebase from collapsing into implicit
cross-feature coupling as scope grows.

### IV. State Management Discipline

Each kind of state MUST use its designated tool and no other.

- Server state (saved addresses, retrieved country/metadata lists) → TanStack Query.
- Client UI state (manual-edit toggle, draft form UI) → Zustand, one store per feature max.
- Form values + validation → React Hook Form + Zod.
- Server data MUST NOT be mirrored into Zustand; pure UI toggles MUST NOT live in
  TanStack Query. Switching country MUST reset/reconcile dependent form and UI state
  deterministically.

**Rationale**: Mixing state lifecycles produces stale caches, lost cache/retry/invalidation
behavior, and re-render bugs. Clear ownership makes country switching and autocomplete →
manual-edit transitions predictable.

### V. Type Safety & Localization Parity

The codebase MUST be strictly typed and fully localizable.

- TypeScript runs with `strict: true` and `noUncheckedIndexedAccess: true`. `any` is
  banned; use `unknown` plus narrowing.
- User-facing strings (labels, validation messages, country/field names) MUST come from
  i18n resources (`en` default, `id` secondary), never hardcoded in components.
- Locale files MUST stay at key parity across all locales; missing keys MUST fail
  type-check / CI.

**Rationale**: Static typing catches country-shape mismatches before runtime, and an
onboarding flow used across markets must localize cleanly — including the Indonesian
field set — without code changes.

### VI. Test Discipline

Behavior MUST be covered by automated tests at the appropriate layer using the locked
toolchain (Vitest + Testing Library for unit/integration, Playwright for E2E).

- Every country schema MUST have unit tests proving valid data passes and invalid data
  (wrong-length postal codes, missing required fields) fails.
- Dynamic-form behavior MUST have integration tests: country switch re-renders fields,
  manual-edit toggle, autocomplete-populates-then-edit, and validation surfacing.
- At least one E2E flow MUST cover country → autocomplete → manual edit → submit, plus
  validation errors and locale switch.
- No snapshot tests as a substitute for explicit assertions. Tests are co-located
  (`foo.ts` → `foo.test.ts`) or in `tests/` / `e2e/` per layer.

**Rationale**: Per-country validation is the highest-risk surface; explicit tests at each
layer are the only way to keep dynamic, configuration-driven behavior trustworthy as
countries are added.

### VII. API Contract & Data Integrity

The backend MUST provide a stable, validated contract for storing and retrieving
addresses, and persist data without loss of country context.

- Endpoints MUST at minimum support: create an address, list/retrieve saved addresses,
  and expose country metadata (field definitions + validation rules) for dynamic clients.
- The stored schema MUST capture `country` plus the address fields (line1, line2, city/
  suburb/regency, state/province, postal/zip, district, village, street as applicable) so
  any supported country's address round-trips faithfully.
- The server MUST validate every write against the country's schema (Principle II) and
  reject invalid payloads with clear, field-level errors. It MUST NOT persist unvalidated
  input.
- Persistence MAY use an in-memory/SQLite store for the demo, but the data model MUST
  represent country-varying fields without silently dropping any.

**Rationale**: The captured address is the product's output of record. A validated,
country-aware contract guarantees what the UI collected is what the database holds, and
the metadata endpoint lets clients stay in sync with server-defined rules.

### VIII. Accessible, Responsive UX

The interface MUST be clean, responsive, and accessible.

- Forms MUST be usable across viewport sizes (mobile through desktop).
- All inputs MUST have associated labels; validation errors MUST be programmatically
  associated and announced, and the flow MUST be operable by keyboard.
- Autocomplete MUST degrade gracefully to manual entry; the "Manually Edit" path is
  always available and never a dead end.

**Rationale**: Onboarding is a first impression and a conversion gate. An inaccessible or
broken-on-mobile form loses customers and excludes users; manual fallback guarantees no
one is blocked when autocomplete is unavailable.

## Additional Constraints (Stack, Security & Configuration)

- **Frontend stack** is locked per `CLAUDE.md`: React 19 + Vite, react-router-dom,
  TanStack Query, Zustand, React Hook Form, Zod, i18next, Tailwind v4 (CSS-first) +
  shadcn/ui. Version bumps are deliberate, not opportunistic.
- **Backend stack** MUST be a lightweight framework (Express, Hono, or Fastify) with an
  in-memory or SQLite store for the demo scope.
- **Configuration & secrets**: environment values (e.g. `VITE_API_URL`,
  `VITE_GOOGLE_PLACES_API_KEY`) MUST be read only through the zod-validated
  `src/shared/config/env.ts` — never `import.meta.env` elsewhere. API keys MUST NOT be
  committed to source control.
- **shadcn-owned files** (`src/components/ui/`) are generated by the CLI and not
  hand-edited; theming decisions belong to the design layer.

## Development Workflow & Quality Gates

- Every change MUST pass `pnpm lint`, `pnpm type-check`, and `pnpm test:ci` before merge;
  E2E (`pnpm test:e2e`) gates flows touching the address journey.
- New features follow the "Adding a new feature" checklist in `CLAUDE.md` (folder
  scaffold → `types.ts`/`index.ts` → `api/` hooks → store → schemas → route → tests →
  locale strings).
- ESLint import-boundary rules enforce Principle III; violations block merge.
- When code and `CLAUDE.md` or this constitution disagree, the same PR MUST fix both. A
  drifted governing document is a defect.

## Governance

- This constitution supersedes ad-hoc practice. Where it conflicts with a convenience
  shortcut, the constitution wins.
- **Amendments** require a PR that updates this file, states the rationale, bumps the
  version per the policy below, and updates any dependent templates/docs in the same PR.
- **Versioning policy** (semantic):
  - MAJOR — backward-incompatible governance change: a principle removed or redefined.
  - MINOR — a new principle/section added or materially expanded guidance.
  - PATCH — clarifications, wording, or non-semantic refinements.
- **Compliance review**: every PR/review MUST verify adherence to these principles; the
  plan template's "Constitution Check" gate is the enforcement point. Any deviation MUST
  be justified in the plan's Complexity Tracking with the simpler alternative considered.

**Version**: 1.0.0 | **Ratified**: 2026-06-13 | **Last Amended**: 2026-06-13
