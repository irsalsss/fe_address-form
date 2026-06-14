# Phase 1 Data Model: Metadata-Driven Address Form

Frontend-consumed entities. The backend registry owns these shapes (Block 1); the frontend treats them as read-only inputs. No client-side persistence.

## Entity: CountryListEntry

A selectable country in the dropdown. Sourced from `GET /countries` (FR-001).

| Field | Type | Notes |
|---|---|---|
| `code` | `string` | Country code (e.g. `USA`, `AUS`, `IDN`). Identifier; passed to `GET /countries/:code/fields`. |
| `name` | `string` | English display name; fallback when no local `country.<code>` translation exists. |
| `version` | `string` (optional) | Current metadata version for this country. Used in the metadata query key for cache invalidation (R3). If absent, client uses `staleTime` only. |

**Source of truth**: backend. **Frontend rule**: no country list is hardcoded; `COUNTRIES` const is deleted.

## Entity: MetadataFieldDef

One field descriptor in a country's layout. Sourced from `GET /countries/:code/fields`. (Already typed in `api/useCountryMetadata.ts`.)

| Field | Type | Notes |
|---|---|---|
| `key` | `string` | Stable payload key sent to `POST /addresses`. SOURCE OF TRUTH for the submit key (backend validator is `.strict()`). Never derived from label. |
| `label` | `string` | Plain English label. Reference/fallback for display (FR-012). |
| `required` | `boolean` | Drives `.min(1)` in the built schema + required marker in UI. |
| `type` | `"text" \| "dropdown"` | Renders Input vs Select (FR-007). Unified vocabulary (R7). |
| `options` | `MetadataFieldOption[]?` | Present for `dropdown`. `{ value, label }`. |
| `validation` | `MetadataFieldValidation?` | `{ length?, numeric?, pattern?, maxLength? }` → drives built schema (FR-004). |
| `order` | `number` | Render + confirmation order. Renderer sorts/relies on backend order. |

**Validation rule → Zod mapping** (see research R1):

| Rule | Zod | Message key |
|---|---|---|
| `required: true` | `.min(1)` | `errors.required` |
| `length: n` | `.length(n)` | `errors.length` (`{count:n}`) |
| `numeric: true` | `.regex(/^\d+$/)` | `errors.numeric` |
| `pattern: p` | `.regex(new RegExp(p))` | `errors.pattern` |
| `maxLength: n` | `.max(n)` | `errors.maxLength` |
| `dropdown` value not in options | `.refine(...)` | `errors.invalidOption` |

Optional fields: empty string is valid; non-empty values still validated.

## Entity: CountryFieldsResponse

Payload of `GET /countries/:code/fields`.

| Field | Type | Notes |
|---|---|---|
| `code` | `string` | Country code. |
| `name` | `string` | English country name. |
| `version` | `string` (optional) | Metadata version (R3 cache key). Mirrors `CountryListEntry.version`. |
| `fields` | `MetadataFieldDef[]` | Ordered field descriptors. |

## Entity: AddressFormValues

What React Hook Form manages and what is submitted.

```ts
type AddressFormValues = Record<string, string>; // keys = metadata field keys, unknown at compile time
```

- All values are strings (text and dropdown alike).
- Built schema validates; backend `.strict()` is authoritative (FR-010).
- Submit body: `{ country, fields: values, googlePlaceId? }` — unchanged contract.

## Entity: FieldValidationError

A field-key-scoped error surfaced against a form field.

| Source | Shape | Surfacing |
|---|---|---|
| Client (built schema) | RHF `errors[key].message` = i18n key | `tDynamic` resolves key → message (FR-013) |
| Server (`ApiError.fieldErrors`) | `{ field, message }` | `methods.setError(field, ...)` maps onto field by key (FR-011) |

Edge case: a server error referencing a non-rendered key is surfaced without crashing (collect into a form-level banner if no matching field).

## Removed entities (deleted after migration)

| Removed | Replaced by |
|---|---|
| `FieldDescriptor`, `FieldFormat`, `CountryConfig`, `COUNTRY_CONFIGS`, `COUNTRIES` (`config/country-config.ts`) | `MetadataFieldDef` + metadata queries |
| `FieldOption`, `US_STATES`, `AUS_STATES`, `IDN_PROVINCES` (`config/options.ts`) | `MetadataFieldOption[]` from metadata |
| `usaSchema`, `ausSchema`, `idnSchema`, `countrySchemas`, `getCountrySchema`, `addressResolver`, `createAddressSchema` (`schemas/*`) | `buildSchema` (runtime) |
| `USAAddress`, `AUSAddress`, `IDNAddress`, `Address` union (`types.ts`) | `Record<string,string>` (kept for API response typing only if still needed) |
| `useCountryFields` | metadata query data |

**Note**: `Address`/`AddressResponse` typed shapes may be retained narrowly for `GET /addresses` response display if the saved-list relies on them; otherwise reduce to `Record<string,string>`. Decide during implementation based on `SavedAddresses.tsx` usage.
