# Data Model: Dynamic Country-Aware Address Form (Frontend)

**Feature**: 001-dynamic-address-form | **Date**: 2026-06-14

**Scope**: Frontend data shapes — the country metadata registry that drives rendering, and the request/response shapes the FE exchanges with the API. Backend persistence (table columns, storage engine) is defined in the `be/` folder. API shapes here mirror [contracts/openapi.yaml](./contracts/openapi.yaml).

Derived from spec Key Entities + FRs (FR-013/14/15 layouts). Validation rules trace to Principle II.

## Entity: Country

`Country = 'USA' | 'AUS' | 'IDN'` (matches existing `src/features/address-form/types.ts`).

## Entity: Country Configuration (metadata)

The per-country field registry. Source of truth for FE rendering. Defined as code in `features/address-form/config/`; can be reconciled at runtime against `GET /addresses/metadata`.

**FieldDescriptor**:

| Attribute | Type | Notes |
|-----------|------|-------|
| `key` | string | stable field id (e.g. `addressLine1`, `zipCode`, `district`) |
| `labelKey` | string | i18n key in `address-form` namespace |
| `type` | `'text' \| 'select'` | render kind |
| `required` | boolean | drives required validation + `*` marker |
| `format` | optional rule id | e.g. `zip5`, `postcode4`, `postal5` |
| `options` | optional `{value, labelKey}[]` | for `type: 'select'` |

**CountryConfig**: `{ country: Country, fields: FieldDescriptor[] }` — `fields` is **ordered**; order is significant.

### Country layouts (FR-013/14/15)

**USA** (in order):
| key | type | required | format | options |
|-----|------|----------|--------|---------|
| `addressLine1` | text | ✅ | — | — |
| `addressLine2` | text | ❌ | — | — |
| `city` | text | ✅ | — | — |
| `state` | select | ✅ | — | 50 US states (2-letter) |
| `zipCode` | text | ✅ | `zip5` (`^\d{5}$`) | — |

**AUS** (in order):
| key | type | required | format | options |
|-----|------|----------|--------|---------|
| `addressLine1` | text | ✅ | — | — |
| `addressLine2` | text | ❌ | — | — |
| `suburb` | text | ✅ | — | — |
| `state` | select | ✅ | — | NSW, VIC, QLD, WA, SA, TAS, ACT, NT |
| `postcode` | text | ✅ | `postcode4` (`^\d{4}$`) | — |

**IDN** (in order):
| key | type | required | format | options |
|-----|------|----------|--------|---------|
| `province` | select | ✅ | — | Indonesian provinces (e.g. Jawa Barat, Bali, Sumatra Utara) |
| `cityRegency` | text | ✅ | — | — |
| `district` | text | ✅ | — | — (Kecamatan) |
| `village` | text | ❌ | — | — (Kelurahan/Desa) |
| `postalCode` | text | ✅ | `postal5` (`^\d{5}$`) | — |
| `streetAddress` | text | ✅ | — | — |

## Address payload (FE form values + API shapes)

The form values and API request/response use a discriminated union on `country`, matching the existing FE union (`USAAddress | AUSAddress | IDNAddress` in `types.ts`):

- `USA` → `{ addressLine1, addressLine2?, city, state, zipCode }`
- `AUS` → `{ addressLine1, addressLine2?, suburb, state, postcode }`
- `IDN` → `{ province, cityRegency, district, village?, postalCode, streetAddress }`

**Create request** (FE → API): `{ country, fields, googlePlaceId? }`.
**Response / list item** (API → FE): `{ id, country, fields, createdAt }`.

**Client validation rules** (Zod, enforced before submit — FR-008/009/010):
- All `required` fields present and non-empty.
- `zipCode` matches `^\d{5}$` (USA); `postcode` matches `^\d{4}$` (AUS); `postalCode` matches `^\d{5}$` (IDN).
- `state`/`province` ∈ that country's allowed option set.
- Values for keys absent from the active country's layout are not submitted.

Server-side validation, persistence, and the stored record's columns are the backend's responsibility (`be/`). The FE surfaces any 422 field-level errors returned by the API onto the corresponding form fields.
