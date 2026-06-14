# Phase 0 Research: Metadata-Driven Address Form

All unknowns from Technical Context resolved below. Stack is locked (CLAUDE.md), so research focuses on the runtime patterns this refactor introduces.

## R1. Runtime Zod schema construction from metadata rules

**Decision**: A pure builder `buildSchema(fields: MetadataFieldDef[]): z.ZodObject<Record<string, z.ZodString>>` that maps each field to a `z.string()` chain derived from its `required` flag + `validation` rules (`length`, `numeric`, `pattern`, `maxLength`), with the error message set to an i18n key so `DynamicFieldRenderer` can resolve it via `tDynamic`.

- Every field is a `z.string()` (form values are all strings — selects included).
- `required: true` → `.min(1, { message: "errors.required" })`; `required: false` → keep, but treat empty string as valid (skip other checks when empty via `.optional()`-style refinement or `.or(z.literal(""))`).
- `length: n` → `.length(n, { message: "errors.lengthN" })` style; emit a generic `errors.length` key with interpolation `{ count: n }`.
- `numeric: true` → `.regex(/^\d+$/, { message: "errors.numeric" })`.
- `pattern: "..."` → `.regex(new RegExp(pattern), { message: "errors.pattern" })`.
- `maxLength: n` → `.max(n, { message: "errors.maxLength" })`.
- `type: "dropdown"` with `options` → required ones get `.min(1)`; optionally refine that the value is one of `options[].value` (message `errors.invalidOption`) to match the old behavior.
- Wrap as `z.object(shape).strict()`? **No** — keep client schema non-strict; the backend `.strict()` is the authoritative unknown-key gate (FR-010). Client strictness would fight the `Record` shape.

**Rationale**: One small pure function replaces three hand-written schemas and is trivially unit-testable (valid passes, each rule's violation fails). Messages-as-i18n-keys preserve the existing renderer contract (`tr(message)`), now routed through `tDynamic` for fallback.

**Alternatives considered**:
- *Keep hand-written schemas, generate from metadata at build time* — rejected: still requires a frontend change/deploy per country, defeating the goal.
- *JSON-schema → zod via a library* — rejected: adds a dependency for a 5-rule vocabulary; over-engineered.

## R2. Resolver wiring with `Record<string, string>` form values

**Decision**: `useForm<AddressFormValues>({ resolver: zodResolver(builtSchema) as unknown as Resolver<AddressFormValues> })`. The single cast already exists in `schemas/index.ts#addressResolver`; move it next to the builder so callers stay cast-free. The schema is `useMemo`'d on `metadata.fields` (and rebuilt when metadata changes).

**Rationale**: `Address` union `keyof` is `never`, so RHF cannot be typed on it (documented in `types.ts`). `Record<string,string>` is the honest runtime type; backend stays authoritative. One contained cast, consistent with current code.

**Alternatives considered**: Per-country generated TS types — rejected: requires compile-time knowledge of keys, which contradicts FR-010.

## R3. Cache + version-based invalidation

**Decision**: Query key `["country-metadata", code]` with a long `staleTime`. Invalidation keyed on a `version` string in the `CountryFieldsResponse` payload. Approach: include `version` is NOT possible in the queryKey before fetch, so use a two-step pattern — keep `staleTime` moderate (e.g. 5 min) so a changed `version` is naturally re-fetched, OR (preferred) a tiny `GET /countries` response carries each country's current `version`, and the metadata query key becomes `["country-metadata", code, version]` sourced from the countries list. When the backend bumps `version`, the key changes and React Query fetches fresh metadata; the old entry is GC'd.

**Rationale**: Putting `version` in the query key makes invalidation automatic and cache-correct without manual `invalidateQueries`. Falls back gracefully: if the countries list lacks a version, use `staleTime` only.

**Alternatives considered**:
- *Manual `queryClient.invalidateQueries` on a timer* — rejected: imperative, racy.
- *`staleTime: Infinity` (current)* — rejected: never picks up backend changes, defeating FR-003.

**Dependency note**: `version` must be present in the backend response (`GET /countries` per-entry, or `GET /countries/:code/fields`). Backend work is out of scope (Block 1); the contract documents the expected shape and the client degrades to `staleTime` if absent.

## R4. i18n label/message fallback (`tDynamic` + `humanizeKey`)

**Decision**: `tDynamic(t, key, backendLabel?)` resolves in order:
1. `t(\`fields.${key}\`, { defaultValue: SENTINEL })` — local translation if the key exists.
2. else `backendLabel` (the metadata field's English `label`) if provided.
3. else `humanizeKey(key)` — split camelCase/snake/kebab, capitalize words (e.g. `postalCode` → "Postal Code").

Same resolution for validation messages: the message is an i18n key (`errors.required`, `errors.lengthN`); `tDynamic` resolves it with `defaultValue` falling back to a humanized form. Use i18next's native `t(key, { defaultValue })` rather than a try/catch.

**Rationale**: Meets FR-012/013 exactly. Keeps localized labels when present, never shows a raw key. Centralizing in one helper keeps renderer/confirmation identical and testable.

**Alternatives considered**: Returning the key on miss (current `tr` cast) — rejected: shows raw keys for untranslated backend fields, violating SC-006.

## R5. Loading / error / retry states

**Decision**: In `AddressForm`, once a country is selected, branch on the metadata query state: `isPending` → loading skeleton/spinner in place of fields; `isError` → error message + Retry button calling `refetch()`; success → render the form. The `GET /countries` query gets the same treatment for the dropdown but failure there is scoped (dropdown disabled with error) without blocking an already-loaded country form (edge case).

**Rationale**: TanStack Query exposes `isPending/isError/refetch` directly; no extra state needed (Principle IV). Retry recovers without page reload (FR-009).

**Alternatives considered**: Suspense boundaries — viable but heavier; explicit states give clearer retry UX and are easier to test. Defer Suspense.

## R6. `usePlaceMapping` — keep but rekey

**Decision**: Keep the country-specific component-type → field mapping (it is logic, not data, and is explicitly in scope to retain — FR-014). The only change: compute `missingRequired` from the fetched metadata fields (passed in or read from cache) instead of `COUNTRY_CONFIGS`. The `if (country === ...)` blocks here are mapping logic, NOT render logic, so they are permitted; update `no-country-branches.test.ts` to scope its assertion to render/confirmation components.

**Rationale**: Google's `address_components` taxonomy genuinely differs per country; expressing it as data would itself be a hardcoded country table. Keeping it as mapping logic is correct. Acceptance explicitly says "No `if (country === ...)` branches in render logic" — mapping is exempt.

**Alternatives considered**: Driving mapping from metadata — rejected: metadata describes fields, not Google component taxonomy; would require backend to encode Google specifics. Out of scope.

## R7. Field `type` vocabulary unification

**Decision**: Adopt the backend metadata vocabulary `type: "text" | "dropdown"` everywhere (the metadata already uses `"dropdown"`). The renderer's current `"select"` branch becomes `"dropdown"`. Drop the local `FieldDescriptor`/`FieldFormat` types entirely.

**Rationale**: Eliminates a translation layer between local config naming and backend naming — a former drift point.

## R8. Country switch carry-over from metadata

**Decision**: `seedFromDraft` reads the active country's metadata fields (from the query cache via `queryClient.getQueryData` or the already-fetched data passed down) instead of `COUNTRY_CONFIGS`. Rule unchanged: carry over `type: "text"` field values present in the draft; skip `type: "dropdown"` (FR-015). Empty-value seeding (`""` for controlled inputs) also iterates metadata fields.

**Rationale**: Preserves existing UX (D4) with metadata as the field source. Select-skip rule keyed on metadata `type`.

## Summary of resolved unknowns

| Unknown | Resolution |
|---|---|
| Build Zod at runtime | R1 — pure `buildSchema` over 5-rule vocabulary, messages as i18n keys |
| Type the form with unknown keys | R2 — `Record<string,string>` + one contained resolver cast |
| Version-based cache invalidation | R3 — `version` in query key sourced from `GET /countries`; `staleTime` fallback |
| Label/message fallback | R4 — `tDynamic` (local → backend label → humanizeKey) |
| Loading/error/retry | R5 — TanStack Query `isPending/isError/refetch` branches |
| Keep autocomplete mapping | R6 — retain country logic, rekey `missingRequired` to metadata |
| `select` vs `dropdown` | R7 — adopt backend `"dropdown"` vocabulary |
| Carry-over source | R8 — seed from metadata fields, skip dropdowns |
