# Implementation Plan: Dynamic Country-Aware Address Form (Frontend)

**Branch**: `001-dynamic-address-form` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-dynamic-address-form/spec.md`

**Scope**: This plan covers the **frontend** only. The backend (address persistence, server-side validation, metadata endpoint) is planned and built in the separate `be/` folder. The frontend integrates against the API described in [contracts/openapi.yaml](./contracts/openapi.yaml).

## Summary

Country-aware onboarding address capture (frontend): a country selector (USA/AUS/IDN), Google Places autocomplete for fast entry, a "Manually Edit" mode that renders country-specific fields, and per-country validation. Core technical approach: a **single per-country metadata/schema registry** drives the form. The renderer is country-agnostic — it consumes the active country's metadata and renders generically, no per-country branches. One Zod schema per country validates the form via the React Hook Form resolver; the same shapes match the API contract so what the user enters is what the backend accepts.

## Technical Context

**Language/Version**: TypeScript 6.0.3; Node 24.0.1

**Primary Dependencies**: React 19.2, Vite 8, react-router-dom 7, @tanstack/react-query 5, zustand 5, react-hook-form 7, zod 4, @hookform/resolvers 5, i18next 26 + react-i18next 17, Tailwind v4 (CSS-first) + shadcn/ui, lucide-react. Google Places (Maps JavaScript API / Places Autocomplete) for address suggestions.

**Storage**: None client-side beyond TanStack Query cache. Persistence is the backend's responsibility (see `be/`). FE reads/writes via the API contract.

**Testing**: Vitest 4 + Testing Library 16 (unit/integration), Playwright 1.60 (E2E, chromium/firefox/webkit, dev server port 3001).

**Target Platform**: Modern evergreen browsers; responsive mobile→desktop.

**Project Type**: Web application frontend (this repo). Talks to a separate backend service.

**Performance Goals**: Country-switch field re-render < 1s (SC-005); autocomplete suggestions feel instant (< ~500ms perceived); save round-trip feedback < 1s on demo scale.

**Constraints**: TS `strict: true` + `noUncheckedIndexedAccess: true`, no `any`. All user-facing strings via i18n (en/id parity). Env only via zod-validated `src/shared/config/env.ts` (`VITE_API_URL`, `VITE_GOOGLE_PLACES_API_KEY`). Google Places key never committed. Autocomplete must degrade gracefully to manual entry.

**Scale/Scope**: Demo scope — 3 countries, 1 `address-form` feature, 1 onboarding route. Single address per submission, no auth.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | FE plan compliance |
|---|-----------|-----------------|
| I | Metadata-Driven Country Config (NON-NEGOTIABLE) | ✅ Per-country config registry drives FE rendering. Renderer is generic — no `if (country===...)` branches. Adding a country = add one config + schema entry. |
| II | Schema as Single Source of Truth | ✅ One Zod schema per country drives the RHF resolver. Formats (US 5-digit ZIP, AUS 4-digit, IDN 5-digit) + enums (states/provinces) live in the schema. Shapes match the API contract so client and server agree. |
| III | Feature-Sliced Architecture & Boundaries | ✅ All work confined to `src/features/address-form/{api,hooks,stores,schemas,components,config,__tests__}` + `index.ts`; network only via feature `api/` + `shared/api/`. |
| IV | State Management Discipline | ✅ Server state (saved addresses, country metadata) → TanStack Query. UI state (manualEdit toggle, draft) → one Zustand store. Form values+validation → RHF + Zod. No server data in Zustand. |
| V | Type Safety & Localization Parity | ✅ strict TS, no `any`. All labels/messages/field names via i18n `address-form` namespace, en + id parity. |
| VI | Test Discipline | ✅ Per-country schema unit tests (valid/invalid), integration tests (country switch, manual toggle, autocomplete→edit, validation surfacing), ≥1 Playwright E2E (country→autocomplete→manual→submit + validation + locale switch). No snapshots-as-assertions. |
| VII | API Contract & Data Integrity | ➡️ Backend-owned (planned in `be/`). FE consumes the contract in [contracts/openapi.yaml](./contracts/openapi.yaml): create address, list addresses, get country metadata. FE surfaces server field-level validation errors; FE does not own persistence/server validation. |
| VIII | Accessible, Responsive UX | ✅ Labeled inputs, programmatically-associated/announced errors, keyboard operable, responsive. Autocomplete degrades to always-available manual entry. |

**Result**: PASS. No FE violations → Complexity Tracking empty. Principle VII is satisfied by the backend plan; this FE plan only consumes its contract.

## Project Structure

### Documentation (this feature)

```text
specs/001-dynamic-address-form/
├── plan.md              # This file (frontend)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (FE config + API shapes)
├── quickstart.md        # Phase 1 output (FE validation guide)
├── contracts/
│   └── openapi.yaml     # API the FE consumes (backend-owned; FE reference)
├── checklists/
│   └── requirements.md  # spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root — frontend)

```text
fe/  (this repo)
  src/
    features/address-form/
      api/                 # useCreateAddress, useAddresses, useCountryMetadata (TanStack Query)
      hooks/               # useGooglePlaces, useCountryFields
      stores/              # addressFormStore (Zustand: manualEdit, draft, selected country UI)
      schemas/             # usa.ts, aus.ts, idn.ts, index.ts (per-country Zod + registry)
      components/          # AddressForm, CountrySelect, PlacesAutocomplete, DynamicFieldRenderer, SavedAddresses
      config/              # country-config (field metadata: order, label keys, type, options, required)
      __tests__/           # co-located unit + integration tests
      types.ts             # (exists) Country + Address union + AddressFormData
      index.ts             # (exists) public surface
    shared/
      api/                 # query client + HTTP wrapper (calls VITE_API_URL)
      config/env.ts        # (exists) VITE_API_URL, VITE_GOOGLE_PLACES_API_KEY
      i18n/locales/<l>/address-form.json   # feature namespace, en + id
    components/ui/          # shadcn (button, select, input, form, card, label) — added via CLI
    app/router.tsx          # mount /onboarding/address route
  e2e/address-flow.spec.ts
```

**Structure Decision**: Single frontend package, feature-sliced under `src/features/address-form/` per `CLAUDE.md`. The per-country metadata registry lives in `config/`; the form renderer consumes it generically. The FE mirrors the country metadata for offline rendering and can reconcile against `GET /addresses/metadata` (backend) at runtime. No backend code in this repo — the backend is a separate package planned in `be/`.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
