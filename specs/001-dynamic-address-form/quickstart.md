# Quickstart: Dynamic Country-Aware Address Form (Frontend)

**Feature**: 001-dynamic-address-form | **Date**: 2026-06-14

Validation guide proving the **frontend** works end-to-end. Implementation lives in the source tree (see [plan.md](./plan.md)); FE data shapes in [data-model.md](./data-model.md); the API the FE consumes is in [contracts/openapi.yaml](./contracts/openapi.yaml).

The backend is a separate package (`be/`) with its own setup. The FE only needs the API reachable at `VITE_API_URL`.

## Prerequisites

- Node 24.x, pnpm
- Backend API running and reachable (see `be/` quickstart) — provides `POST /addresses`, `GET /addresses`, `GET /addresses/metadata`.
- Google Places API key (optional — manual entry works without it).

## Setup (frontend)

```bash
pnpm install
# .env: VITE_API_URL=http://localhost:4000  VITE_GOOGLE_PLACES_API_KEY=<key>
npx shadcn@latest add button select input form card label
pnpm dev                                                # Vite on :3001
```

## Validation scenarios

Each maps to a spec user story / success criterion.

### S1 — Autocomplete capture (US-1, SC-001)
1. Open `http://localhost:3001/onboarding/address`.
2. Select country **USA**. Type into the address search; pick a suggestion.
3. **Expect**: fields populate into the USA layout (line1, city, state, ZIP), shown for confirmation.
4. Submit. **Expect**: success confirmation (API returns 201).

### S2 — Manual edit, per-country fields (US-2, SC-002)
1. Select **AUS** → click **Manually Edit**.
2. **Expect**: fields = Address Line 1, Address Line 2 (optional), Suburb, State (NSW…NT dropdown), Postcode. No US/IDN-only fields present.
3. Switch country to **IDN**. **Expect**: layout swaps to Province (dropdown), City/Regency, District (Kecamatan), Village (optional), Postal Code, Street Address; incompatible values cleared (SC-005, < 1s).

### S3 — Validation (US-2, SC-003)
1. Country **USA**, manual mode, leave required fields empty → submit.
2. **Expect**: submission blocked; each required field shows a localized error.
3. Enter a 4-digit ZIP → submit. **Expect**: `zipCode` rejected ("must be 5 digits") client-side; any server 422 field errors also surface on the field.

### S4 — Persistence round-trip (US-3, SC-004)
1. Save one address each for USA, AUS, IDN.
2. Open the Saved Addresses view (FE lists via `GET /addresses`).
3. **Expect**: 3 records, each with its own country + complete field set, no dropped/mismatched fields.

### S5 — Dynamic metadata (FR-019, bonus)
1. FE loads country layouts; confirm it can render from `GET /addresses/metadata` (or the mirrored local config).
2. **Expect**: rendered descriptors match [data-model.md](./data-model.md) layouts for each country.

### S6 — Autocomplete degradation (SC-006)
1. Unset `VITE_GOOGLE_PLACES_API_KEY` (or block the Maps script), reload.
2. **Expect**: search box disabled with notice; **Manually Edit** still fully works; address saves.

### S7 — Localization (spec US-2, i18n)
1. Toggle locale to **id (Bahasa Indonesia)**.
2. **Expect**: labels/validation messages render in Indonesian; IDN field names (Kecamatan, Kelurahan/Desa) localized.

## Automated test commands (frontend)

```bash
pnpm test:ci          # vitest: schema unit + AddressForm integration tests
pnpm test:e2e         # playwright: e2e/address-flow.spec.ts (chromium/firefox/webkit)
pnpm lint && pnpm type-check
```

**Definition of done (frontend)**: S1–S7 pass manually against a running backend, `pnpm test:ci` + `pnpm test:e2e` green, lint + type-check clean.
