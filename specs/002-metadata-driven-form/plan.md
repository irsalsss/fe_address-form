# Implementation Plan: Metadata-Driven Address Form

**Branch**: `002-metadata-driven-form` | **Date**: 2026-06-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-metadata-driven-form/spec.md`

## Summary

Make the address form fully metadata-driven. Today country data is re-declared in three frontend places (`config/country-config.ts`, `config/options.ts`, `schemas/{usa,aus,idn}.ts`) and kept in sync with the backend registry only by `registry-parity.test.ts` — drift-prone, already caused a 400-on-unknown-key bug. Target: zero hardcoded country data on the frontend so adding/changing a country is a backend-only change with no frontend deploy.

Technical approach: the existing `useCountryMetadata` query becomes the single runtime source. The country dropdown is sourced from `GET /countries`; per-country field layout/options/validation from `GET /countries/:code/fields`, cached in TanStack Query and invalidated by a `version` field in the payload. A runtime schema builder turns metadata validation rules (`required`, `length`, `numeric`, `pattern`, `maxLength`) into a Zod object used as the RHF resolver, replacing the hand-written per-country schemas. `DynamicFieldRenderer` and `AddressConfirmation` already render generically — they switch from `FieldDescriptor` (local config) to the metadata field shape. Loading/error/retry states wrap the metadata fetch. A `tDynamic` helper + `humanizeKey` resolve labels/messages by field key against local translations, falling back to the backend English `label`, then a humanized key. `usePlaceMapping` stays (country-specific logic, not data) but rekeys its `missingRequired` against metadata keys. After migration the local config, options, per-country schemas + barrel, `useCountryFields`, and `registry-parity.test.ts` are deleted.

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict, `noUncheckedIndexedAccess`), Node 24.0.1

**Primary Dependencies**: React 19.2, Vite 8, @tanstack/react-query 5.101, react-hook-form 7.78, zod 4.4, @hookform/resolvers 5.4, i18next 26.3 / react-i18next 17, Tailwind v4 + shadcn/ui

**Storage**: N/A on frontend — server state via TanStack Query cache; no client persistence

**Testing**: Vitest 4 + @testing-library/react 16 (unit/integration), Playwright 1.60 (E2E, chromium+firefox+webkit)

**Target Platform**: Browser (modern evergreen), responsive mobile→desktop

**Project Type**: Single-page web application (Vite + React), feature-sliced under `src/features/address-form/`

**Performance Goals**: Metadata fetched once per country and cached (`staleTime` long, version-invalidated); no per-keystroke network beyond existing debounced Places; form interactions at 60fps

**Constraints**: No `any` (use `unknown` + narrowing); field keys unknown at compile time → form values typed as `Record<string, string>`; backend `.strict()` validator is the authoritative gate; no `if (country === ...)` branches in render/confirmation logic

**Scale/Scope**: ~3 currently supported countries (USA, AUS, IDN), designed to grow with zero frontend change; single feature slice, ~10 files touched, ~6 files deleted

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Metadata-Driven Country Config (NON-NEGOTIABLE) | ✅ Strengthened | This feature is the direct fulfilment: removes all hardcoded country data; renderer stays country-agnostic; backend metadata endpoint is the source. |
| II. Schema as Single Source of Truth | ✅ Compliant | Source of truth becomes the backend registry/metadata. Client derives its Zod schema at runtime from that metadata; server validates against the same registry. One definition, no client/server drift — the parity test that previously bridged two definitions is removed because the second definition is gone. |
| III. Feature-Sliced Architecture & Boundaries | ✅ Compliant | All work stays in `src/features/address-form/`; network only via feature `api/` + `shared/api/http`; public surface via `index.ts`. |
| IV. State Management Discipline | ✅ Compliant | Metadata = server state in TanStack Query (never mirrored into Zustand); UI/selection in Zustand; form values in RHF. Country switch reset stays deterministic. |
| V. Type Safety & Localization Parity | ✅ Compliant w/ note | `Record<string,string>` form values are intentional (the `Address` union's `keyof` is `never`). No `any`. Field-label translations become OPTIONAL (resolved by `tDynamic` with fallback), so i18n parity is enforced only for static keys; field keys are not required across locales by design. |
| VI. Test Discipline | ✅ Compliant | Per-country schema tests replaced by schema-builder unit tests; integration tests (country switch, manual edit, autocomplete, validation, loading/error) retained/added; E2E flow retained. No snapshots. |
| VII. API Contract & Data Integrity | ✅ Compliant | Consumes `GET /countries` + `GET /countries/:code/fields` (with `version`); POST payload unchanged. Backend changes are out of scope (Block 1); the contract here documents the expected response shape including `version`. |
| VIII. Accessible, Responsive UX | ✅ Compliant | Generic renderer keeps label/error aria association; loading/error/retry states are accessible; autocomplete still degrades to manual entry. |

**Result: PASS — no violations. Complexity Tracking not required.**

## Project Structure

### Documentation (this feature)

```text
specs/002-metadata-driven-form/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (metadata endpoint contracts)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/features/address-form/
├── api/
│   ├── useCountries.ts          # NEW — GET /countries (dropdown source, FR-001)
│   ├── useCountryMetadata.ts    # MODIFY — add `version`-based cache invalidation, becomes primary source
│   ├── useCreateAddress.ts      # unchanged (payload stays Record-shaped)
│   └── useAddresses.ts          # unchanged
├── schemas/
│   └── buildSchema.ts           # NEW — runtime Zod builder from MetadataFieldDef[] (FR-004)
│   # DELETE: usa.ts, aus.ts, idn.ts, index.ts (per-country hand-written schemas)
├── hooks/
│   ├── usePlaceMapping.ts       # MODIFY — rekey missingRequired against metadata keys (FR-014)
│   ├── useGooglePlaces.ts       # unchanged
│   # DELETE: useCountryFields.ts (replaced by metadata query)
├── lib/
│   ├── tDynamic.ts              # NEW — label/message resolver: fields.<key> → backend label → humanizeKey (FR-012/013)
│   └── humanizeKey.ts           # NEW — last-resort key humanizer
├── components/
│   ├── AddressForm.tsx          # MODIFY — drive from metadata query; add loading/error/retry; seed from metadata keys
│   ├── CountrySelect.tsx        # MODIFY — options from useCountries (FR-001)
│   ├── DynamicFieldRenderer.tsx # MODIFY — consume MetadataFieldDef; type "dropdown"; tDynamic labels
│   ├── AddressConfirmation.tsx  # MODIFY — consume MetadataFieldDef; tDynamic labels
│   └── MetadataState.tsx        # NEW (optional) — loading/error/retry presentational wrapper (FR-008/009)
│   # DELETE: config/country-config.ts, config/options.ts
├── stores/addressFormStore.ts   # MODIFY — draft seeding no longer reads local config
├── types.ts                     # MODIFY — keep Record-based values; drop config-derived types
├── index.ts                     # MODIFY — update public surface
└── __tests__/
    ├── schemas/buildSchema.test.ts   # NEW — replaces usa/aus/idn schema tests
    ├── lib/tDynamic.test.ts          # NEW
    ├── AddressForm.loading.test.tsx  # NEW — loading/error/retry (US3)
    ├── AddressForm.*.test.tsx        # MODIFY — mock metadata query instead of local config
    ├── no-country-branches.test.ts   # MODIFY — scope to render/confirmation, allow mapping
    # DELETE: schemas/{usa,aus,idn}.test.ts, hooks/useCountryFields.test.ts, registry-parity.test.ts
```

**Structure Decision**: Single-project Vite SPA, feature-sliced. All changes confined to the `address-form` feature slice plus its tests. No new top-level directories; a small `lib/` subfolder is added inside the feature for the i18n fallback helpers (feature-local, not in `shared/`, since the fallback rule is specific to dynamic metadata labels).

## Complexity Tracking

> No constitution violations. Section intentionally empty.
