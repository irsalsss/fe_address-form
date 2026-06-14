# Feature Specification: Metadata-Driven Address Form

**Feature Branch**: `002-metadata-driven-form`

**Created**: 2026-06-15

**Status**: Draft

**Input**: User description: "Make the address form fully metadata-driven (consume backend country metadata, delete local country config)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add or change a country without a frontend deploy (Priority: P1)

The team supports a new country (or amends an existing one's fields) entirely on the backend. The address onboarding form picks up the new field layout, options, validation rules, and country dropdown entry automatically — no frontend code change and no new frontend deploy required.

**Why this priority**: This is the core reason the feature exists. Today country data is re-declared in three frontend places kept in sync only by a parity test, which is drift-prone and already caused a "400 on unknown key" bug. Eliminating frontend country data removes the entire class of drift defects and makes country changes a backend-only operation.

**Independent Test**: Add a supported country on the backend (or change a field of an existing one), reload the app without deploying frontend code, and confirm the country appears in the dropdown and its form renders with the correct fields, order, options, and validation — using only optional translation strings if a localized label is desired.

**Acceptance Scenarios**:

1. **Given** the backend lists a country in its registry, **When** the user opens the country dropdown, **Then** that country appears as a selectable option without any frontend code change.
2. **Given** a country whose field set changed on the backend, **When** the user selects that country, **Then** the form renders the new fields in the backend-defined order with no stale fields.
3. **Given** a country with no matching frontend translation strings, **When** its form renders, **Then** every field shows the backend-provided English label as a fallback (no missing or raw-key labels).

---

### User Story 2 - Fill, validate, and submit an address for any country (Priority: P1)

An end user selects a country, optionally uses autocomplete, edits fields manually, and submits. Validation rules enforced in the form match what the backend will accept, so a form the user believes valid is accepted by the backend, and invalid input is caught with clear per-field messages.

**Why this priority**: The form must keep working end-to-end after the refactor. Validation built at runtime from backend rules must produce the same protection the hand-written schemas did, and submission must succeed for valid data and fail gracefully for invalid data.

**Independent Test**: For each supported country, fill the form with valid data and confirm successful submission and appearance in the saved list; fill with invalid data (wrong-length postal code, missing required field) and confirm per-field errors surface before submission.

**Acceptance Scenarios**:

1. **Given** a selected country's metadata defines a required 5-digit postal code, **When** the user enters a non-5-digit value and submits, **Then** a field-level error appears and submission is blocked.
2. **Given** all required fields are valid, **When** the user submits, **Then** the address is saved and appears in the saved list.
3. **Given** the backend rejects a payload (e.g. unknown or malformed field), **When** the response returns field-level errors, **Then** those errors are mapped onto the corresponding form fields.
4. **Given** a field defined as a select with options in metadata, **When** the form renders, **Then** that field is a dropdown populated from the metadata options, not a free-text input.

---

### User Story 3 - Resilient loading when metadata is slow or unavailable (Priority: P2)

Because the form now depends on a metadata fetch, the user sees a loading state while metadata loads and a clear error state with a retry action if the fetch fails, rather than a blank or broken form.

**Why this priority**: The form no longer renders synchronously from local data. Without explicit loading/error handling, a slow or failed network call would leave the user with a broken experience. Important for robustness but secondary to the form working on the happy path.

**Independent Test**: Simulate a slow metadata response and confirm a loading indicator shows; simulate a failed response and confirm an error message with a working retry control that recovers when the network succeeds.

**Acceptance Scenarios**:

1. **Given** the country metadata request is in flight, **When** the user has selected a country, **Then** a loading indicator is shown in place of the form fields.
2. **Given** the country metadata request failed, **When** the error state is shown, **Then** a retry control is available and re-attempts the fetch when activated.
3. **Given** a retry succeeds, **When** metadata loads, **Then** the form renders normally with no page reload required.

---

### User Story 4 - Country switch preserves shared input, autocomplete still works (Priority: P2)

When the user switches countries mid-entry, text values for fields shared across countries carry over, while country-specific select values do not. Google Places autocomplete continues to populate the correct fields for the active country.

**Why this priority**: Preserves existing UX behavior the refactor must not regress. Autocomplete-to-field mapping is country-specific logic (not data) and must keep working keyed against the metadata field keys.

**Independent Test**: Enter text fields and a select for country A, switch to country B, and confirm shared text fields retain values while select values are cleared; then use autocomplete and confirm fields populate by their metadata keys.

**Acceptance Scenarios**:

1. **Given** the user typed a value into a shared text field, **When** they switch countries, **Then** that value is preserved in the new country's matching field.
2. **Given** the user selected a value in a country-specific dropdown, **When** they switch countries, **Then** that selection is not carried over.
3. **Given** the user picks a Google Places suggestion, **When** the result is applied, **Then** it populates the active country's fields by their metadata keys.

---

### Edge Cases

- A metadata field references option values but the user-entered/autocompleted value is not in the option list — the field surfaces a validation error rather than silently accepting it.
- The backend metadata version changes while a country's metadata is cached — the cache is invalidated by version so stale layout/rules are not used.
- A field key present in the backend payload has no local translation and no backend label — a humanized version of the key is shown as a last resort (never a raw key).
- A backend field-error references a field key that is not currently rendered — the error is surfaced without crashing the form.
- The country list (dropdown source) loads but a specific country's field metadata fails — the dropdown still works and the failure is scoped to the field-metadata loading/error state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST source the list of selectable countries from the backend country list, with no country list hardcoded in the frontend.
- **FR-002**: The system MUST fetch each country's field layout, options, and validation rules from the backend per-country metadata endpoint when a country is selected.
- **FR-003**: The system MUST cache fetched country metadata and invalidate that cache based on a version indicator in the metadata payload, so changed metadata is picked up without manual cache clearing.
- **FR-004**: The system MUST construct the form's validation rules at runtime from the metadata validation rules (at minimum: required, length, numeric, pattern, maxLength), replacing all hand-written per-country validation.
- **FR-005**: The form renderer MUST render fields generically from metadata — in the backend-defined order — with no per-country conditional branches in rendering logic.
- **FR-006**: The confirmation/review view MUST display submitted fields generically from metadata, with no per-country conditional branches.
- **FR-007**: The system MUST render a field as a dropdown when metadata defines it as a select (with options) and as the appropriate input type otherwise, driven entirely by metadata.
- **FR-008**: The system MUST show a loading state while country metadata is being fetched, in place of the form fields.
- **FR-009**: The system MUST show an error state with a retry control when country metadata fetch fails, and recover without a page reload when retry succeeds.
- **FR-010**: The system MUST treat form values and the submit payload as a string-keyed map whose keys are not known at build time; the backend strict validator remains the authoritative acceptance gate.
- **FR-011**: The system MUST map backend field-level validation errors onto the corresponding form fields by field key.
- **FR-012**: The system MUST resolve field labels by field key against local translations, falling back to the backend-provided English label when no translation exists, and falling back to a humanized version of the key as a last resort.
- **FR-013**: The system MUST apply the same translation/fallback resolution to validation error messages as to field labels.
- **FR-014**: The system MUST preserve Google Places autocomplete-to-field mapping (country-specific logic), keying its output against the metadata field keys for the active country.
- **FR-015**: On country switch, the system MUST carry over values for shared text fields and MUST NOT carry over values for select fields.
- **FR-016**: The system MUST remove all hardcoded frontend country data: the local country config, the local options config, the per-country hand-written schemas and their barrel, the country-fields hook, and the registry-parity test, once the metadata-driven path is in place.
- **FR-017**: Adding or amending a supported country MUST require no frontend code change — only optional translation strings for localized labels.

### Key Entities *(include if feature involves data)*

- **Country list entry**: A selectable country surfaced in the dropdown, identified by a country code and a display name, sourced from the backend.
- **Country field metadata**: The per-country definition consumed by the form — an ordered set of fields, each with a key, an input kind (e.g. text or select), options (when select), validation rules (required, length, numeric, pattern, maxLength), and an English label; plus a version indicator used for cache invalidation.
- **Form values / submit payload**: A string-keyed map of field key to entered value, with keys determined at runtime by the active country's metadata.
- **Field validation error**: A field-key-scoped error message (client-derived from metadata rules or returned by the backend) surfaced against the matching form field.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a new supported country requires zero frontend code changes (optional translation strings only) and zero frontend deploys — verified by adding a country on the backend and seeing it work end-to-end in the running frontend.
- **SC-002**: There are zero pieces of hardcoded country data in the frontend after migration — the local country config, options config, per-country schemas, schema barrel, country-fields hook, and registry-parity test are all removed.
- **SC-003**: There are zero per-country conditional branches (e.g. "if country is X") in the form render and confirmation logic.
- **SC-004**: The existing end-to-end flow (select country → autocomplete → manual edit → submit → appears in saved list) passes for all currently supported countries.
- **SC-005**: For every supported country, valid data submits successfully and invalid data (wrong-length postal code, missing required field) is blocked with a per-field error before submission.
- **SC-006**: Every rendered field shows a human-readable label in all states — localized when available, backend English label otherwise, humanized key as last resort — with no raw field keys ever shown to the user.
- **SC-007**: When metadata is slow, users see a loading state; when it fails, users see an error with a retry that recovers without reloading the page.

## Assumptions

- The backend already exposes a country list endpoint and a per-country field metadata endpoint, and the metadata payload includes a version indicator suitable for cache invalidation. (Backend work is out of scope here — covered separately.)
- The metadata validation vocabulary is limited to required, length, numeric, pattern, and maxLength rules; any country's rules can be expressed with these.
- The backend remains the authoritative validator with a strict (reject-unknown-keys) policy; the client-side validation is a usability layer, not the security gate.
- Currently supported countries (USA, AUS, IDN) are represented in the backend registry and will continue to be the baseline coverage.
- Google Places autocomplete remains available and its field-mapping logic stays in the frontend as country-specific logic (not data).
- Localized translation strings are optional; absence of a translation is an expected, handled case (fallbacks apply), not an error.
- Out of scope: backend changes, database schema changes, and any admin UI for managing country metadata.
