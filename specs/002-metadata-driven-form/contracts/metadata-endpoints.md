# Contract: Country Metadata Endpoints (frontend-consumed)

The frontend consumes these read-only endpoints. **Backend implementation is out of scope** (Block 1); this documents the shape the frontend depends on. Base URL from `VITE_API_URL` via `shared/config/env.ts`; calls go through `shared/api/http`.

## GET /countries

Sources the country dropdown (FR-001).

**Response 200** — `application/json`

```jsonc
[
  { "code": "USA", "name": "United States", "version": "2026-06-01" },
  { "code": "AUS", "name": "Australia",     "version": "2026-06-01" },
  { "code": "IDN", "name": "Indonesia",     "version": "2026-06-10" }
]
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string | yes | Identifier used in the fields endpoint path. |
| `name` | string | yes | English display name; dropdown fallback label. |
| `version` | string | no | Current metadata version; used in metadata query key (cache invalidation, R3). If omitted, client uses `staleTime` only. |

## GET /countries/:code/fields

Sources the field layout, options, and validation for one country (FR-002).

**Path params**: `code` — country code from `GET /countries`.

**Response 200** — `application/json`

```jsonc
{
  "code": "USA",
  "name": "United States",
  "version": "2026-06-01",
  "fields": [
    { "key": "line1", "label": "Address Line 1", "required": true,  "type": "text",     "order": 1 },
    { "key": "line2", "label": "Address Line 2", "required": false, "type": "text",     "order": 2 },
    { "key": "city",  "label": "City",           "required": true,  "type": "text",     "order": 3 },
    { "key": "state", "label": "State",          "required": true,  "type": "dropdown", "order": 4,
      "options": [ { "value": "CA", "label": "California" }, { "value": "NY", "label": "New York" } ] },
    { "key": "zip",   "label": "ZIP Code",       "required": true,  "type": "text",     "order": 5,
      "validation": { "length": 5, "numeric": true } }
  ]
}
```

**Field object**

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | yes | Submit payload key; authoritative (backend `.strict()`). |
| `label` | string | yes | English label; display fallback (FR-012). |
| `required` | boolean | yes | → `.min(1)` + UI required marker. |
| `type` | `"text"` \| `"dropdown"` | yes | Input vs Select. |
| `options` | `{value,label}[]` | when `dropdown` | Select options. |
| `validation` | object | no | `{ length?, numeric?, pattern?, maxLength? }`. |
| `order` | number | yes | Render/confirmation order. |

**Error responses** (handled by `shared/api/http` → `ApiError`)

| Status | Meaning | Frontend behavior |
|---|---|---|
| 404 | Unknown country code | Error state + Retry (FR-009). |
| 5xx / network | Fetch failed | Error state + Retry (FR-009). |

## POST /addresses (unchanged — reference only)

Request body stays `{ country, fields: Record<string,string>, googlePlaceId? }`. Backend `.strict()` validator rejects unknown/invalid keys; field-level errors return as RFC7807 `details.fieldErrors` and map onto form fields by key (FR-011). No change required by this feature.

## Cache & invalidation contract

- Metadata query key: `["country-metadata", code, version]` (version from `GET /countries`). Bumping `version` server-side changes the key → automatic refetch (R3).
- `staleTime`: long (e.g. ≥5 min) as a fallback when `version` is absent.
- Metadata is server state — held only in TanStack Query, never mirrored into Zustand (Principle IV).
