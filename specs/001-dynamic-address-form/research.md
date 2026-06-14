# Research: Dynamic Country-Aware Address Form (Frontend)

**Feature**: 001-dynamic-address-form | **Date**: 2026-06-14

**Scope**: Frontend decisions only. Backend decisions (storage engine, server validation impl, endpoint framework) are recorded in the `be/` folder's own plan. This document records FE design decisions; the API the FE consumes is in [contracts/openapi.yaml](./contracts/openapi.yaml).

No `NEEDS CLARIFICATION` remained from the spec — the FE stack is locked by `CLAUDE.md`.

## D1 — Metadata-driven country configuration shape

- **Decision**: Represent each country as an ordered array of field descriptors: `{ key, labelKey, type: 'text'|'select', required, format?, options? }`, keyed by `Country`. The form renderer maps over the active country's descriptors and renders a generic field per descriptor. Dropdown `options` carry `{ value, labelKey }`.
- **Rationale**: Constitution I (NON-NEGOTIABLE) — country differences MUST be data, not control flow. An array preserves field order (USA/AUS/IDN differ in order and field set). `labelKey` (not literal label) keeps i18n parity (Constitution V).
- **Alternatives considered**: (a) Per-country React components — rejected, violates Principle I, duplicates layout logic. (b) JSON Schema — rejected, Zod already mandated by Principle II and gives TS inference for free.

## D2 — Per-country validation schema (client)

- **Decision**: One Zod schema per country (`usa`, `aus`, `idn`) defined in `schemas/`. FE uses it via `@hookform/resolvers/zod`. A discriminated union on `country` selects the schema. Formats (`/^\d{5}$/` US ZIP, `/^\d{4}$/` AUS postcode, `/^\d{5}$/` IDN postal) and enum dropdowns live in the schema only.
- **Rationale**: Principle II — schema is the single source of truth for client validation. The schema shapes match the API contract's request body, so the client never submits data the backend would reject for shape reasons.
- **Server parity note**: The backend re-validates independently (its own concern, in `be/`). The FE treats `GET /addresses/metadata` as the runtime reconciliation point and surfaces any server-returned field-level errors (422) in the form.
- **Alternatives considered**: `useState`-based validation — rejected, violates Principle II/IV.

## D3 — Google Places autocomplete integration

- **Decision**: Use Google Maps JavaScript API **Places Autocomplete** loaded lazily (script injected on first focus of the address search, guarded so it loads once). On `place_changed`, map `address_components` → the active country's field set via a country-aware mapping function, then hand values to RHF (`setValue` per mapped field). Key read only from `env.VITE_GOOGLE_PLACES_API_KEY`.
- **Rationale**: Principle VIII — autocomplete is an accelerator. Lazy load keeps initial bundle small. Mapping `address_components` per country handles USA/AUS/IDN structural differences (`postal_code`, `administrative_area_level_1` → state/province, `locality`/`sublocality` → city/suburb/regency).
- **Degradation**: If the script fails to load, the key is missing, or no `place_changed` fires, the "Manually Edit" path is always rendered and fully functional — autocomplete is never a gate. Missing key disables the search box (with a notice) but never blocks manual entry.
- **Alternatives considered**: (a) New `PlaceAutocompleteElement` web component — viable but mapping still per country; classic `Autocomplete` is well-documented and sufficient. (b) Backend-proxied Places — out of FE scope and adds latency.

## D4 — Country switch state reconciliation

- **Decision**: Selected country lives in the Zustand store. On country change: reset RHF form with the new country's defaults, clearing values for fields absent in the new country; preserve only values whose `key` exists in both old and new layouts (e.g. `addressLine1`). `manualEdit` toggle and `googlePlaceId` reset on country change.
- **Rationale**: Spec edge case ("country switch mid-edit") + SC-005 (< 1s, no leftovers). Principle IV — deterministic reconciliation between Zustand UI state and RHF form state.
- **Alternatives considered**: Keep all values and filter at submit — rejected; risks confusing the user and submitting incompatible values.

## D5 — Server communication (TanStack Query)

- **Decision**: Three feature `api/` hooks over the contract — `useCreateAddress` (POST), `useAddresses` (GET list), `useCountryMetadata` (GET metadata). HTTP goes through `shared/api/` wrapper using `env.VITE_API_URL`. Server validation errors (422 problem+json with `errors[]`) are mapped onto RHF field errors.
- **Rationale**: Principle IV — saved addresses + metadata are server state, owned by TanStack Query (cache/retry/invalidation). Principle III — no raw `fetch` outside `shared/api/` + feature `api/`. On successful create, invalidate the addresses list query.
- **Alternatives considered**: Storing fetched addresses in Zustand — rejected, violates Principle IV.

## D6 — Localization

- **Decision**: New i18n namespace `address-form` with `en` (default) + `id`. All field labels (via `labelKey`), dropdown option labels, validation messages, and UI chrome localized. Zod messages mapped to i18n keys at the resolver boundary.
- **Rationale**: Principle V parity; IDN field names (Kecamatan, Kelurahan/Desa) are exactly where localization matters.
- **Alternatives considered**: Hardcoded English first — rejected, violates Principle V; spec requires id locale.
