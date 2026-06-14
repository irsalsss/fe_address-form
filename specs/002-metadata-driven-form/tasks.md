---
description: "Task list for Metadata-Driven Address Form"
---

# Tasks: Metadata-Driven Address Form

**Input**: Design documents from `/specs/002-metadata-driven-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/metadata-endpoints.md, quickstart.md

**Tests**: INCLUDED — Constitution VI (Test Discipline) is non-negotiable and spec acceptance requires schema-builder unit tests, integration tests, and the existing E2E flow passing.

**Organization**: Grouped by user story (US1–US4 from spec.md) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4
- All paths relative to repo root `/Users/irsal/Desktop/frankieone/fe/`

## ⚠️ Same-file ordering note

`src/features/address-form/components/AddressForm.tsx` is touched by US1, US2, US3, and US4. Those AddressForm edits are **sequential** (cannot be [P] with each other) even though the stories are otherwise independent. All other story work is parallelizable.

**Deletion gate**: `config/country-config.ts` (T032) can only be deleted after every importer is migrated — `AddressForm` (T017), `CountrySelect` (T014), `DynamicFieldRenderer` (T015), `AddressConfirmation` (T016), `SavedAddresses` (T017a), `useCountryFields` (deleted T034), `usePlaceMapping` (T031). T032 is gated on all of these.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare for metadata-driven work without breaking the current build.

- [x] T001 Confirm work is on branch `002-metadata-driven-form` and `.specify/feature.json` points to `specs/002-metadata-driven-form` (already set)
- [x] T002 Create feature-local helper folder `src/features/address-form/lib/` for the i18n fallback utilities

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data layer + utilities every user story consumes. Each is a leaf module with its own unit test; none import the old local config.

**⚠️ CRITICAL**: No user story phase can complete until this phase is done.

- [x] T003 [P] Add `src/features/address-form/api/useCountries.ts` — TanStack Query hook for `GET /countries` returning `CountryListEntry[]` (`{code,name,version?}`), per contracts/metadata-endpoints.md; query key `["countries"]`, long `staleTime`
- [x] T004 [P] Add `src/features/address-form/__tests__/api/useCountries.test.ts` — mock http, assert list shape + query key
- [x] T005 Update `src/features/address-form/api/useCountryMetadata.ts` — accept optional `version` into query key `["country-metadata", code, version]`, set finite `staleTime` (≥5min) as fallback, drop the registry-parity reconciliation comment; keep `MetadataFieldDef`/`CountryFieldsResponse` types exported (add optional `version` to `CountryFieldsResponse`)
- [x] T006 [P] Add `src/features/address-form/lib/humanizeKey.ts` — pure `humanizeKey(key: string): string` splitting camelCase/snake/kebab and title-casing (e.g. `postalCode` → "Postal Code")
- [x] T007 [P] Add `src/features/address-form/__tests__/lib/humanizeKey.test.ts` — camelCase, snake_case, kebab-case, single word cases
- [x] T008 [P] Add `src/features/address-form/lib/tDynamic.ts` — `tDynamic(t, key, backendLabel?)` resolving `fields.<key>` local translation → `backendLabel` → `humanizeKey(key)` using i18next `defaultValue`; same helper usable for `errors.*` message keys (research R4)
- [x] T009 [P] Add `src/features/address-form/__tests__/lib/tDynamic.test.ts` — local hit, backend-label fallback, humanize last-resort, error-message-key path
- [x] T010 [P] Add `src/features/address-form/schemas/buildSchema.ts` — pure `buildSchema(fields: MetadataFieldDef[])` mapping `required`/`length`/`numeric`/`pattern`/`maxLength`/dropdown-option rules to a non-strict `z.object` of `z.string()`, messages as i18n keys (`errors.required`, `errors.length`, `errors.numeric`, `errors.pattern`, `errors.maxLength`, `errors.invalidOption`); export `buildResolver(fields)` returning `Resolver<AddressFormValues>` with the single contained cast (research R1/R2)
- [x] T011 [P] Add `src/features/address-form/__tests__/schemas/buildSchema.test.ts` — valid data passes; each rule's violation fails (non-5-digit numeric, missing required, bad pattern, over-maxLength, dropdown value not in options); optional empty field passes
- [x] T011a [P] Add `src/features/address-form/__tests__/api/useCountryMetadata.test.ts` — assert query key includes `version` and that a changed `version` produces a new key (refetch / cache invalidation, FR-003 / finding C1)

**Checkpoint**: Data layer + utils exist and are unit-tested. User stories can begin.

---

## Phase 3: User Story 1 — Add/change a country without a frontend deploy (Priority: P1) 🎯 MVP

**Goal**: Country dropdown + form render entirely from backend metadata, with label fallback. Adding a country becomes a backend-only change.

**Independent Test**: Point the app at a backend whose registry includes a new/changed country; reload without rebuilding; the country appears in the dropdown and its fields render in backend order with correct labels (local translation → backend label → humanized key).

### Tests for User Story 1

- [x] T012 [P] [US1] Add `src/features/address-form/__tests__/AddressForm.metadata-render.test.tsx` — mock `useCountries` + `useCountryMetadata`; select a country, assert fields render in `order` with dropdown vs text per metadata `type`, and labels use translation/backend-label/humanize fallback
- [x] T013 [P] [US1] Update `src/features/address-form/__tests__/no-country-branches.test.ts` — scope assertion to render/confirmation components (`AddressForm`, `DynamicFieldRenderer`, `AddressConfirmation`, `CountrySelect`); explicitly exempt `usePlaceMapping`

### Implementation for User Story 1

- [x] T014 [P] [US1] Rewrite `src/features/address-form/components/CountrySelect.tsx` — source options from `useCountries` (loading/empty handled minimally); label each via `t(\`country.${code}\`, { defaultValue: name })`; remove `COUNTRIES` import
- [x] T015 [P] [US1] Rewrite `src/features/address-form/components/DynamicFieldRenderer.tsx` — accept `fields: MetadataFieldDef[]`; switch `type === "select"` → `"dropdown"`; resolve labels + error messages via `tDynamic` (pass `field.label`); keep aria associations
- [x] T016 [P] [US1] Rewrite `src/features/address-form/components/AddressConfirmation.tsx` — accept `fields: MetadataFieldDef[]`; resolve labels via `tDynamic`; same generic loop
- [x] T017 [US1] Edit `src/features/address-form/components/AddressForm.tsx` — replace `useCountryFields(country)` + `COUNTRY_CONFIGS` field list with metadata from `useCountryMetadata`; pass `metadata.fields` to renderer/confirmation; sort by `order` (or trust backend order)
- [x] T017a [US1] Migrate `src/features/address-form/components/SavedAddresses.tsx` off `COUNTRY_CONFIGS` — render saved rows generically. The list spans multiple countries, so resolve each row's field labels via `tDynamic`/`humanizeKey`; if per-country metadata is needed for ordering/labels, read it via `useCountryMetadata(address.country)` (cache already warm) or display `Object.entries(address.fields)` with `humanizeKey` fallback. This unblocks deleting `country-config.ts` (T032) without breaking the saved list / SC-004 (finding G1)
- [x] T017b [P] [US1] Update `src/features/address-form/__tests__/SavedAddresses.test.ts` — assert generic/fallback rendering without `COUNTRY_CONFIGS`
- [x] T018 [US1] Add i18n keys to `src/shared/i18n/locales/en/address-form.json` and `id/address-form.json` — generic validation messages `errors.length`/`errors.maxLength`/`errors.pattern` with interpolation; keep existing `fields.*` (now OPTIONAL overrides)

**Checkpoint**: Form renders fully from metadata; new countries appear with no code change. MVP demoable.

---

## Phase 4: User Story 2 — Fill, validate, submit for any country (Priority: P1)

**Goal**: Runtime-built validation matches the backend; valid data submits and saves, invalid data blocks with per-field errors; server field errors map back.

**Independent Test**: For each supported country, valid data submits and appears in the saved list; invalid (wrong-length postal, missing required) blocks with per-field errors; a forced backend rejection surfaces on the matching field.

### Tests for User Story 2

- [x] T019 [P] [US2] Update `src/features/address-form/__tests__/AddressForm.validation.test.tsx` — mock metadata; assert required + format errors from the built schema surface per field, and submit is blocked
- [x] T020 [P] [US2] Update `src/features/address-form/__tests__/AddressForm.manual.test.tsx` — fill valid manual values, submit succeeds with `Record`-shaped payload; assert server `fieldErrors` map onto fields

### Implementation for User Story 2

- [x] T021 [US2] Edit `src/features/address-form/components/AddressForm.tsx` — build resolver via `buildResolver(metadata.fields)` (`useMemo` on fields) replacing `addressResolver(country)`; keep `defaultValues` controlled (`""` per field); submit `{ country, fields: values, googlePlaceId }`; retain `ApiError.fieldErrors` → `setError` mapping (FR-011)
- [x] T022 [US2] Handle server errors referencing non-rendered keys in `AddressForm.tsx` — collect unmatched `fieldErrors`/`formErrors` into the existing banner instead of dropping/crashing (edge case)

**Checkpoint**: End-to-end submit + validation works for all countries via metadata-built schema.

---

## Phase 5: User Story 3 — Resilient loading / error / retry (Priority: P2)

**Goal**: Metadata fetch has explicit loading and error+retry states; form no longer assumes synchronous data.

**Independent Test**: Slow metadata → loading indicator; failed metadata → error + Retry that recovers without reload; countries-list failure scoped to the dropdown.

### Tests for User Story 3

- [x] T023 [P] [US3] Add `src/features/address-form/__tests__/AddressForm.loading.test.tsx` — mock `useCountryMetadata` in `isPending` (loading shown), `isError` + `refetch` (error + Retry recovers); assert no crash and no page reload

### Implementation for User Story 3

- [x] T024 [P] [US3] Add `src/features/address-form/components/MetadataState.tsx` — presentational loading + error/retry wrapper (accessible: `role="status"` / `role="alert"` + Retry button), i18n strings
- [x] T025 [US3] Edit `src/features/address-form/components/AddressForm.tsx` — branch on metadata `isPending`/`isError` via `MetadataState` (Retry → `refetch`); render form only on success
- [x] T026 [US3] Scope countries-list failure in `CountrySelect.tsx` — disable dropdown + show error without blocking an already-loaded country form (edge case)
- [x] T027 [P] [US3] Add i18n keys for loading/error/retry to `en/address-form.json` + `id/address-form.json` (`state.loading`, `state.error`, `state.retry`)

**Checkpoint**: Form degrades gracefully on slow/failed metadata.

---

## Phase 6: User Story 4 — Country switch carry-over + autocomplete (Priority: P2)

**Goal**: Switching country carries shared text fields, not selects; Google Places keeps populating by metadata keys.

**Independent Test**: Enter text + a dropdown for country A, switch to B → text carries, dropdown cleared; autocomplete populates active country's fields by metadata key; partial results flag missing required.

### Tests for User Story 4

- [x] T028 [P] [US4] Update `src/features/address-form/__tests__/AddressForm.carryover.test.tsx` — mock metadata for two countries; assert shared text carries over, dropdown value does not
- [x] T029 [P] [US4] Update `src/features/address-form/__tests__/AddressForm.autocomplete.test.tsx` — assert mapped place populates fields by metadata key and `missingRequired` derives from metadata

### Implementation for User Story 4

- [x] T030 [US4] Edit `src/features/address-form/components/AddressForm.tsx` — `seedFromDraft` + `emptyValues` iterate `metadata.fields` (skip `type === "dropdown"` for carry-over), removing `COUNTRY_CONFIGS` (FR-015 / research R8)
- [x] T031 [P] [US4] Edit `src/features/address-form/hooks/usePlaceMapping.ts` — compute `missingRequired` from metadata fields (passed in / read from cache) instead of `COUNTRY_CONFIGS`; keep the country-specific component-type mapping (exempt from no-branch rule)

**Checkpoint**: Carry-over + autocomplete behavior preserved on metadata keys.

---

## Phase 7: Polish & Cleanup (Delete hardcoded country data)

**Purpose**: Remove now-dead local country data + tests (SC-002) and run all gates. Do these only after Phases 3–6 compile against metadata.

- [x] T032 [P] Delete `src/features/address-form/config/country-config.ts` and `src/features/address-form/config/options.ts`
- [x] T033 [P] Delete `src/features/address-form/schemas/usa.ts`, `aus.ts`, `idn.ts`, and `schemas/index.ts`
- [x] T034 [P] Delete `src/features/address-form/hooks/useCountryFields.ts`
- [x] T035 [P] Delete tests `__tests__/schemas/usa.test.ts`, `aus.test.ts`, `idn.test.ts`, `__tests__/hooks/useCountryFields.test.ts`, `__tests__/registry-parity.test.ts`
- [x] T036 Update `src/features/address-form/types.ts` — delete `USAAddress`/`AUSAddress`/`IDNAddress`/`Address` union; set `CreateAddressRequest.fields` and `AddressResponse.fields` to `Record<string,string>`; keep `AddressFormValues = Record<string,string>` and `Country` (now `string`, since the country list is dynamic — verify no remaining literal-union dependency)
- [x] T036a Update `src/features/address-form/api/useCreateAddress.ts` (and confirm `api/useAddresses.ts`) for the `Record`-typed `CreateAddressRequest`/`AddressResponse`; remove the `as unknown as Address` cast in `AddressForm.tsx` submit (T021) now that `fields` is `Record<string,string>` (finding C3)
- [x] T037 Update `src/features/address-form/index.ts` — refresh public surface (remove deleted exports, add `buildSchema`/`useCountries` if exposed)
- [x] T038 Update `src/features/address-form/__tests__/i18n-parity.test.ts` — assert parity for static keys only; treat `fields.*` as optional overrides (dynamic labels resolved via fallback)
- [x] T039 Run gates: `pnpm lint` (0 errors), `pnpm type-check` (clean), `pnpm test:ci` (53/53), `pnpm test:e2e` (chromium 3/3; firefox/webkit binaries not installed in this env)
- [ ] T040 Execute quickstart.md V1–V8 validation against a running backend (NOT RUN: requires live backend — Block 1)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no deps
- **Foundational (Phase 2)**: after Setup — BLOCKS all stories
- **US1 (Phase 3)**: after Foundational — MVP
- **US2 (Phase 4)**: after Foundational; shares `AddressForm.tsx` with US1 (T017 before T021)
- **US3 (Phase 5)**: after Foundational; `AddressForm.tsx` edit (T025) after T017/T021
- **US4 (Phase 6)**: after Foundational; `AddressForm.tsx` edit (T030) after T017/T021/T025
- **Polish (Phase 7)**: after US1–US4 (components must no longer import the deleted config). T032 specifically gated on T014/T015/T016/T017/T017a/T031 + T034 (deletion gate above). T036a after T036.

### Critical same-file chain (AddressForm.tsx)

T017 (US1) → T021/T022 (US2) → T025 (US3) → T030 (US4). Sequential.

### Within each story

- Tests written first and expected to fail, then implementation (Constitution VI).
- Foundational utils (Phase 2) before any component wiring.

### Parallel Opportunities

- Phase 2: T003/T004, T006/T007, T008/T009, T010/T011 are independent leaf modules — run in parallel (T005 also parallel; it only edits the metadata hook).
- US1: T012/T013 (tests), then T014/T015/T016 (different files) in parallel; T017 last.
- US2: T019/T020 parallel; T021 then T022.
- US3: T023 + T024 + T027 parallel; T025/T026 after.
- US4: T028/T029 parallel; T031 parallel with T030 (different files).
- Phase 7: T032–T035 deletions all parallel; then T036–T038; then gates.

---

## Parallel Example: Foundational (Phase 2)

```bash
Task: "Add useCountries.ts + test (T003, T004)"
Task: "Add humanizeKey.ts + test (T006, T007)"
Task: "Add tDynamic.ts + test (T008, T009)"
Task: "Add buildSchema.ts + test (T010, T011)"
Task: "Update useCountryMetadata.ts version cache (T005)"
```

## Parallel Example: User Story 1

```bash
# Tests first:
Task: "AddressForm.metadata-render.test.tsx (T012)"
Task: "Rescope no-country-branches.test.ts (T013)"
# Then components (different files):
Task: "Rewrite CountrySelect.tsx (T014)"
Task: "Rewrite DynamicFieldRenderer.tsx (T015)"
Task: "Rewrite AddressConfirmation.tsx (T016)"
# Finally the container + saved list:
Task: "Edit AddressForm.tsx field source (T017)"
Task: "Migrate SavedAddresses.tsx off COUNTRY_CONFIGS (T017a)"   # [P] with T017 — different file
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE** (country renders from metadata, new country needs no code change) → demo.

### Incremental Delivery

Foundation → US1 (metadata render, MVP) → US2 (validation/submit) → US3 (loading/retry) → US4 (carry-over/autocomplete) → Phase 7 cleanup + gates. Each story independently testable; cleanup deletes dead config only after migration compiles.

---

## Notes

- [P] = different files, no incomplete dependency.
- `AddressForm.tsx` is the serialization point across stories — keep its edits ordered.
- Deletions (Phase 7) are deferred deliberately: removing config before components migrate breaks the build.
- `usePlaceMapping` country branches are intentional mapping logic, exempt from the no-render-branch rule (research R6).
- Backend `version` field (cache invalidation) is a Block 1 dependency; client degrades to `staleTime` if absent.
- Commit after each task or logical group; verify tests fail before implementing.
