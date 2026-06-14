---
description: "Task list for Dynamic Country-Aware Address Form (Frontend)"
---

# Tasks: Dynamic Country-Aware Address Form (Frontend)

**Input**: Design documents from `/specs/001-dynamic-address-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Scope**: Frontend only (this repo). Backend (persistence, server validation, metadata endpoint) is built in the separate `be/` folder. FE integrates against [contracts/openapi.yaml](./contracts/openapi.yaml) via `VITE_API_URL`.

**Tests**: INCLUDED — Constitution VI (Test Discipline) is NON-NEGOTIABLE. Per-country schema unit tests, dynamic-form integration tests, and ≥1 Playwright E2E are mandatory.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 (maps to spec user stories)
- All paths relative to repo root (`fe/`)

## Path Conventions

Feature-sliced under `src/features/address-form/{api,hooks,stores,schemas,components,config,__tests__}`; shared in `src/shared/`; route in `src/app/router.tsx`; E2E in `e2e/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding and tooling for the feature

- [ ] T001 Create feature subfolders `api/`, `hooks/`, `stores/`, `schemas/`, `components/`, `config/`, `__tests__/` under `src/features/address-form/` and run `pnpm install`
- [ ] T002 [P] Add shadcn/ui components via `npx shadcn@latest add button select input form card label` (outputs to `src/components/ui/`)
- [ ] T003 [P] Verify `src/shared/config/env.ts` exposes `VITE_API_URL` and `VITE_GOOGLE_PLACES_API_KEY`; add `.env.example` with both keys at repo root
- [ ] T004 [P] Create empty i18n namespace files `src/shared/i18n/locales/en/address-form.json` and `src/shared/i18n/locales/id/address-form.json`, and register the `address-form` namespace in `src/shared/i18n/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The metadata registry, schemas, store, API client, and form shell that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [P] Add API DTO types `CreateAddressRequest`, `AddressResponse` (matching contracts/openapi.yaml) to `src/features/address-form/types.ts`
- [ ] T006 [P] Create dropdown option lists (50 US states, 8 AUS states, IDN provinces) with `{value, labelKey}` in `src/features/address-form/config/options.ts`
- [ ] T007 Create metadata registry — `FieldDescriptor`, `CountryConfig`, and ordered USA/AUS/IDN field arrays per data-model.md — in `src/features/address-form/config/country-config.ts` (depends on T006; NO per-country conditional logic — pure data)
- [ ] T008 [P] Create per-country Zod schemas with format rules (`zip5` `^\d{5}$`, `postcode4` `^\d{4}$`, `postal5` `^\d{5}$`) and enum dropdowns in `src/features/address-form/schemas/usa.ts`, `aus.ts`, `idn.ts`
- [ ] T009 Create discriminated-union schema registry + RHF resolver helper (keyed by `country`) in `src/features/address-form/schemas/index.ts` (depends on T008)
- [ ] T010 [P] Schema unit tests (valid passes; wrong-length postal, missing required, out-of-set dropdown fail) in `src/features/address-form/__tests__/schemas/usa.test.ts`, `aus.test.ts`, `idn.test.ts`
- [ ] T011 Populate i18n `address-form.json` (en + id) with field labels, dropdown option labels, and validation messages; add strict typing in `src/shared/i18n/resources.d.ts` (en/id key parity)
- [ ] T012 [P] Implement HTTP wrapper (fetch via `env.VITE_API_URL`, JSON, problem+json error parsing) in `src/shared/api/http.ts`
- [ ] T013 [P] Configure + export QueryClient and ensure provider is mounted in `src/app/` providers
- [ ] T014 Create Zustand `addressFormStore` (`selectedCountry`, `manualEdit`, `draft`; `setCountry` resets `manualEdit`/`googlePlaceId` and clears incompatible draft) in `src/features/address-form/stores/addressFormStore.ts`
- [ ] T015 [P] Store unit test (toggle manualEdit; setCountry resets dependent state) in `src/features/address-form/__tests__/stores/addressFormStore.test.ts`
- [ ] T016 [P] Implement `useCountryFields` hook (returns ordered FieldDescriptor[] for a country from config) in `src/features/address-form/hooks/useCountryFields.ts`
- [ ] T017 [P] `useCountryFields` unit test (correct field list per country) in `src/features/address-form/__tests__/hooks/useCountryFields.test.ts`
- [ ] T018 Implement `useCreateAddress` mutation (`POST /addresses`, invalidate addresses list, map 422 field errors to RHF) in `src/features/address-form/api/useCreateAddress.ts`
- [ ] T019 Build `CountrySelect` component (USA/AUS/IDN, writes to store) in `src/features/address-form/components/CountrySelect.tsx`
- [ ] T020 Build `AddressForm` container shell — RHF + zod resolver wiring, hosts CountrySelect, submit handler calling useCreateAddress — in `src/features/address-form/components/AddressForm.tsx` (no dynamic fields yet)
- [ ] T021 Mount lazy `/onboarding/address` route in `src/app/router.tsx` and export public surface from `src/features/address-form/index.ts`

**Checkpoint**: Country selectable, schemas/store/api/form shell ready — user stories can begin

---

## Phase 3: User Story 1 - Capture address via autocomplete (Priority: P1) 🎯 MVP

**Goal**: User selects a country, types into one search box, picks a suggestion, sees the captured structured address, and saves it.

**Independent Test**: Select USA, type partial address, pick a suggestion → fields parse into USA layout shown for confirmation → submit succeeds (201). Search blocked until a country is selected.

### Tests for User Story 1 ⚠️

- [ ] T022 [P] [US1] Integration test: country selected → autocomplete select (mocked Places) populates structured fields → submit calls API; and "select country first" guard, in `src/features/address-form/__tests__/AddressForm.autocomplete.test.tsx`

### Implementation for User Story 1

- [ ] T023 [P] [US1] Implement `address_components` → per-country field mapping (postal_code, administrative_area_level_1→state/province, locality/sublocality→city/suburb/regency) in `src/features/address-form/hooks/usePlaceMapping.ts`
- [ ] T024 [US1] Implement `useGooglePlaces` hook — lazy-load Maps JS script once (guarded), bind Autocomplete, emit mapped values on `place_changed`; no-op + flag when key missing — in `src/features/address-form/hooks/useGooglePlaces.ts` (depends on T023)
- [ ] T025 [US1] Build `PlacesAutocomplete` component (search input, suggestions, disabled-with-notice when key absent) in `src/features/address-form/components/PlacesAutocomplete.tsx` (depends on T024)
- [ ] T026 [US1] Build `AddressConfirmation` read-only view rendering captured values in the active country's field order in `src/features/address-form/components/AddressConfirmation.tsx`
- [ ] T027 [US1] Wire into `AddressForm`: gate autocomplete on country selected; on select `setValue` mapped fields + store `googlePlaceId` + show confirmation; submit via useCreateAddress in `src/features/address-form/components/AddressForm.tsx`

**Checkpoint**: Autocomplete capture → confirm → save works independently (MVP)

---

## Phase 4: User Story 2 - Manual edit with country-specific fields (Priority: P1)

**Goal**: "Manually Edit" renders exactly the active country's fields (order, labels, dropdowns, required); validation enforced; country switch re-renders and clears incompatible values; autocomplete values carry into editable fields.

**Independent Test**: For each country, click Manually Edit → field set/labels/options/required match data-model.md; submit empty/invalid → per-field localized errors; switch country → layout swaps, stale values cleared.

### Tests for User Story 2 ⚠️

- [ ] T028 [P] [US2] Integration test: manual mode renders correct field set per country (USA/AUS/IDN) with required markers + dropdown options, in `src/features/address-form/__tests__/AddressForm.manual.test.tsx`
- [ ] T029 [P] [US2] Integration test: country switch re-renders fields and clears incompatible values; invalid submit (4-digit ZIP, empty required) surfaces per-field localized errors; autocomplete-populated values persist into manual edit, in `src/features/address-form/__tests__/AddressForm.validation.test.tsx`

### Implementation for User Story 2

- [ ] T030 [US2] Build `DynamicFieldRenderer` — maps `useCountryFields` descriptors to generic text/select inputs bound to RHF, with labels via i18n and required markers (NO per-country branches) — in `src/features/address-form/components/DynamicFieldRenderer.tsx`
- [ ] T031 [US2] Add "Manually Edit" toggle (reads/writes `manualEdit` in store) switching AddressForm between confirmation and DynamicFieldRenderer in `src/features/address-form/components/AddressForm.tsx`
- [ ] T032 [US2] Implement country-switch reconciliation: on `setCountry`, RHF `reset` to new country defaults, preserving only keys present in both layouts (e.g. `addressLine1`) in `src/features/address-form/components/AddressForm.tsx` (uses store from T014)
- [ ] T033 [US2] Wire validation surfacing: zod resolver errors + server 422 field errors rendered per field with i18n messages and `aria` association in `src/features/address-form/components/DynamicFieldRenderer.tsx`
- [ ] T034 [P] [US2] (Optional, FR-019 reconciliation) Implement `useCountryMetadata` query hook (`GET /addresses/metadata`) to verify local config parity in `src/features/address-form/api/useCountryMetadata.ts`

**Checkpoint**: Manual entry + validation + country switching work; combined with US1, both P1 flows functional

---

## Phase 5: User Story 3 - Review saved addresses (Priority: P2)

**Goal**: View the list of persisted addresses, each rendered with its own country's field set.

**Independent Test**: Save addresses across countries → open list → each shows correct country + complete field set, no dropped/mismatched fields.

### Tests for User Story 3 ⚠️

- [ ] T035 [P] [US3] Integration test: saved list (mocked API) renders each record with its own country field set in `src/features/address-form/__tests__/SavedAddresses.test.tsx`

### Implementation for User Story 3

- [ ] T036 [P] [US3] Implement `useAddresses` query hook (`GET /addresses`) in `src/features/address-form/api/useAddresses.ts`
- [ ] T037 [US3] Build `SavedAddresses` component (renders each address via its country config field order) in `src/features/address-form/components/SavedAddresses.tsx` (depends on T036)
- [ ] T038 [US3] Display SavedAddresses on the `/onboarding/address` route and invalidate its query after a successful create in `src/app/router.tsx` / `src/features/address-form/components/AddressForm.tsx`

**Checkpoint**: All three stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E, accessibility, responsiveness, i18n, and final gates across all stories

- [ ] T039 [P] Playwright E2E `e2e/address-flow.spec.ts`: full flow (country → autocomplete → manual edit → fill → submit), validation errors on empty submit, and locale toggle to Bahasa Indonesian (chromium/firefox/webkit)
- [ ] T040 [P] Accessibility pass: all inputs labeled, errors programmatically associated + announced, keyboard operable across CountrySelect/PlacesAutocomplete/DynamicFieldRenderer (SC-008)
- [ ] T041 [P] Responsive pass: form usable mobile→desktop (SC-008)
- [ ] T042 [P] Verify i18n en/id key parity and that no user-facing string is hardcoded (Constitution V)
- [ ] T043 Run `pnpm lint && pnpm type-check && pnpm test:ci && pnpm test:e2e` — all green
- [ ] T044 Execute quickstart.md scenarios S1–S7 against a running backend and confirm expected outcomes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational
  - US1 (P1) and US2 (P1) share the `AddressForm` shell (T020); if worked in parallel, coordinate edits to `AddressForm.tsx` (T027/T031/T032 touch it)
  - US3 (P2) is independent of US1/US2 internals
- **Polish (Phase 6)**: Depends on all targeted stories complete

### User Story Dependencies

- **US1 (P1)**: After Foundational. Independently testable (autocomplete → confirmation → submit)
- **US2 (P1)**: After Foundational. Independently testable (manual fields + validation + country switch). Shares `AddressForm.tsx` with US1
- **US3 (P2)**: After Foundational. Fully independent (read-only list)

### Within Each User Story

- Tests written first and FAIL before implementation (Constitution VI)
- Config/schemas (foundational) before components; hooks before components that use them
- `AddressForm.tsx` edits are sequential (not [P]) across T027/T031/T032

### Parallel Opportunities

- Setup: T002, T003, T004 in parallel
- Foundational: T005, T006, T008, T010, T012, T013, T015, T016, T017 in parallel (distinct files); T007 after T006; T009 after T008
- US1 tests (T022) parallel with US2 tests (T028, T029) and US3 test (T035)
- Polish: T039–T042 in parallel; T043/T044 last

---

## Parallel Example: Foundational Phase

```bash
# Distinct-file foundational tasks together:
Task: "API DTO types in src/features/address-form/types.ts"               # T005
Task: "Option lists in src/features/address-form/config/options.ts"        # T006
Task: "Zod schemas usa/aus/idn in src/features/address-form/schemas/"      # T008
Task: "Schema unit tests in __tests__/schemas/"                            # T010
Task: "HTTP wrapper in src/shared/api/http.ts"                             # T012
Task: "Store test in __tests__/stores/addressFormStore.test.ts"           # T015
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup
2. Phase 2 Foundational (CRITICAL — blocks all)
3. Phase 3 US1 (autocomplete capture → confirm → save)
4. **STOP & VALIDATE**: quickstart S1 + T022
5. Demo MVP

> Note: spec marks US1 and US2 both P1 ("cannot ship without a reliable manual path"). Production-ready demo = Foundational + US1 + US2. US1 alone is the thinnest demonstrable slice.

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. + US1 → autocomplete capture (MVP)
3. + US2 → manual entry + validation + country switch (production-ready P1 set)
4. + US3 → saved-address review
5. Polish → E2E, a11y, responsive, i18n, gates

### Parallel Team Strategy

After Foundational: Dev A → US1, Dev B → US2 (coordinate `AddressForm.tsx`), Dev C → US3.

---

## Notes

- [P] = different files, no incomplete-task dependency
- `AddressForm.tsx` is a shared hotspot (T020 → T027 → T031 → T032 → T038): keep these sequential
- Renderer/config must contain NO `if (country === ...)` branches (Constitution I, verified by SC-007)
- Verify tests fail before implementing; commit per task or logical group
- Backend must be running for submit/list scenarios; autocomplete degrades gracefully without a Places key
