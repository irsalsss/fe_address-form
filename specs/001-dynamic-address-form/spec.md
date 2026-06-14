# Feature Specification: Dynamic Country-Aware Address Form

**Feature Branch**: `001-dynamic-address-form`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "AcmeCorp customer onboarding flow that collects user addresses with a country dropdown, Google Places autocomplete, a Manually Edit mode that renders country-specific fields (USA, AUS, IDN), per-country required-field validation, and a backend that stores and retrieves captured addresses. Bonus: API exposes country-specific field/validation metadata."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture an address via autocomplete (Priority: P1)

A customer onboarding with AcmeCorp picks their country, types their address into a single search box, selects the matching suggestion, and the system captures a structured address ready to save — without the customer filling individual fields.

**Why this priority**: This is the fastest path to the feature's core value — collecting a correct, structured address with minimal effort. It alone delivers a usable onboarding step (a viable MVP) even before manual editing exists.

**Independent Test**: Select a country, type a partial address, pick a suggestion, confirm the captured address is structured into the correct country-specific fields, and save it successfully.

**Acceptance Scenarios**:

1. **Given** the user has selected a supported country, **When** they type into the address search and select a suggestion, **Then** the address is parsed into that country's field set and shown to the user for confirmation.
2. **Given** a captured address passes validation, **When** the user submits it, **Then** the system stores it and confirms success.
3. **Given** the user has not yet selected a country, **When** they attempt to use the address search, **Then** the system prompts them to select a country first.

---

### User Story 2 - Manually edit / enter address with country-specific fields (Priority: P1)

A customer whose address autocomplete can't find (or returns incompletely) clicks "Manually Edit" and is shown the exact fields their country requires — e.g., Suburb + 4-digit Postcode for Australia, Kecamatan + Kelurahan for Indonesia — with required fields enforced.

**Why this priority**: Autocomplete is never 100% — manual entry is the guaranteed fallback so no customer is ever blocked. Equal-priority with US-1 because the onboarding step cannot ship without a reliable manual path.

**Independent Test**: For each supported country, click Manually Edit and confirm the rendered field set, labels, dropdown options, and required markers match that country's defined layout; submit valid and invalid data to confirm validation.

**Acceptance Scenarios**:

1. **Given** a country is selected, **When** the user clicks "Manually Edit", **Then** the form renders exactly the fields defined for that country, in order, with correct labels and dropdown options.
2. **Given** the user is in manual mode, **When** they change the selected country, **Then** the field layout updates to the new country and stale/incompatible field values are cleared.
3. **Given** required fields are empty or a value violates the country's format rule (e.g. a 4-digit US ZIP), **When** the user submits, **Then** submission is blocked and each offending field shows a specific, localized error.
4. **Given** an address was pre-filled by autocomplete, **When** the user clicks "Manually Edit", **Then** the captured values are carried into the editable fields rather than lost.

---

### User Story 3 - Review saved addresses (Priority: P2)

An AcmeCorp operator (or the customer, for demo purposes) views the list of addresses that have been captured and stored, to confirm onboarding data was persisted correctly.

**Why this priority**: Needed to demonstrate and verify persistence end-to-end, but the capture flow delivers value before a retrieval view exists.

**Independent Test**: Save one or more addresses across different countries, then retrieve the list and confirm each address round-trips with its country and all country-specific fields intact.

**Acceptance Scenarios**:

1. **Given** addresses have been saved, **When** the list is requested, **Then** each saved address is returned with its country and complete field set.
2. **Given** addresses from multiple countries are stored, **When** the list is viewed, **Then** each address displays the fields appropriate to its own country without dropped or mismatched fields.

---

### Edge Cases

- **Country switch mid-edit**: changing country after entering data clears fields that don't exist in the new country and preserves only compatible shared fields (the system must not silently submit values for fields the new country doesn't have).
- **Autocomplete unavailable**: if the autocomplete service is unreachable, errors, or returns no match, the manual-entry path remains fully usable and the user can still complete onboarding.
- **Partial autocomplete result**: if a selected suggestion lacks a required field (e.g. missing postcode), the missing required field is flagged for manual completion rather than saved empty.
- **Format-but-not-required mismatch**: an optional field left blank passes; the same field with a malformed value (when a format rule applies) is rejected.
- **Invalid dropdown value**: a state/province/postal value outside the country's allowed set is rejected on both submit and server validation.
- **Duplicate submission**: submitting the same address twice (e.g. double-click) should not create unintended issues for the demo (informed default: each submission is recorded; de-duplication is out of scope).
- **Unsupported country**: only USA, AUS, and IDN are selectable; no other country can be chosen in this version.

## Requirements *(mandatory)*

### Functional Requirements

#### Country selection & form behavior

- **FR-001**: System MUST present a country selector offering exactly the supported countries (USA, Australia, Indonesia) at the top of the address step.
- **FR-002**: System MUST provide a single address search input with autocomplete suggestions to capture an address quickly.
- **FR-003**: On selecting an autocomplete suggestion, System MUST parse the result into the selected country's structured field set and present it for the user to confirm or edit.
- **FR-004**: System MUST provide a "Manually Edit" control that switches the form into manual-entry mode.
- **FR-005**: In manual mode, System MUST render only the fields defined for the currently selected country, with that country's field order, labels, required markers, and dropdown option lists.
- **FR-006**: System MUST update the rendered field layout immediately when the selected country changes, clearing values for fields that do not exist in the newly selected country.
- **FR-007**: System MUST carry any autocomplete-populated values into manual mode rather than discarding them.

#### Validation (configurable per country)

- **FR-008**: System MUST enforce required fields per country and block submission while any required field is empty, surfacing a specific error per offending field.
- **FR-009**: System MUST enforce country-specific format rules: USA ZIP = 5 digits, AUS postcode = 4 digits, IDN postal code = 5 digits.
- **FR-010**: System MUST restrict dropdown fields (US state, AUS state, IDN province) to their defined allowed values and reject any value outside the set.
- **FR-011**: Per-country field definitions and validation rules MUST be configuration-driven such that adding or amending a country is a data/configuration change, not a rewrite of form-rendering logic.
- **FR-012**: All user-facing labels, field names, and validation messages MUST be localizable (English default, Indonesian secondary) and not hardcoded.

#### Country field layouts

- **FR-013**: USA layout MUST be: Address Line 1 (required), Address Line 2 (optional), City (required), State (dropdown, required), ZIP Code (5-digit, required).
- **FR-014**: AUS layout MUST be: Address Line 1 (required), Address Line 2 (optional), Suburb (required), State (dropdown: NSW, VIC, QLD, WA, SA, TAS, ACT, NT — required), Postcode (4-digit, required).
- **FR-015**: IDN layout MUST be: Province (dropdown, required), City/Regency (required), District/Kecamatan (required), Village/Kelurahan-Desa (optional), Postal Code (5-digit, required), Street Address (required).

#### Persistence & retrieval

- **FR-016**: System MUST accept a completed, valid address and persist it together with its country and all country-specific fields.
- **FR-017**: System MUST re-validate every submitted address against the selected country's rules before storing it and MUST reject invalid submissions with field-level errors, never persisting unvalidated input.
- **FR-018**: System MUST provide a way to retrieve previously saved addresses, each returned with its country and complete field set intact.
- **FR-019**: System MUST expose the per-country field definitions and validation rules (field names, required flags, formats, dropdown options) so the same definition drives both the input experience and server validation. *(Bonus / dynamic-metadata requirement.)*

### Key Entities *(include if feature involves data)*

- **Country Configuration**: The metadata describing one supported country — its ordered list of fields, each field's label key, type (text / dropdown), required flag, format rule, and dropdown options. Source of truth for both rendering and validation. Countries: USA, AUS, IDN.
- **Address**: A captured address record. Always carries `country` plus the fields that country defines (e.g. line1, line2, city/suburb/regency, state/province, district, village, street, and postal/zip code as applicable). Persisted and retrievable.
- **Address Field**: A single element within a country's layout — its identity, label, requiredness, format constraint, and allowed values (for dropdowns).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can select a country, capture an address via autocomplete, and successfully save it in under 60 seconds.
- **SC-002**: For each of the three supported countries, the manually-edited form displays 100% of that country's defined fields with correct required markers and dropdown options, and zero fields belonging to a different country.
- **SC-003**: 100% of submissions that violate a country's required-field or format rule (wrong-length postal code, missing required field, out-of-set dropdown value) are blocked with a specific, localized, field-level message.
- **SC-004**: 100% of saved addresses round-trip on retrieval with their country and every captured field intact — no dropped or mismatched fields across countries.
- **SC-005**: Switching the country selector updates the visible field layout in under 1 second with no leftover values from the previous country.
- **SC-006**: When autocomplete is unavailable, 100% of users can still complete and save an address through manual entry.
- **SC-007**: Adding a new supported country can be accomplished by adding one configuration/schema entry, with no change to form-rendering logic (verified by the renderer containing no per-country conditional branches).
- **SC-008**: The full interface is operable by keyboard and usable across mobile and desktop viewport sizes, with every input labeled and every validation error announced.

## Assumptions

- **Supported set is fixed at three**: Only USA, AUS, and IDN are in scope for this version; the architecture anticipates growth but no fourth country is built now.
- **Demo-grade persistence**: An in-memory or lightweight embedded store is acceptable for the demo; durability/scale guarantees are out of scope.
- **No authentication**: The onboarding/address step does not require sign-in for this demo; addresses are not tied to authenticated user accounts.
- **Single address per submission**: Each submit captures one address; bulk entry and address-book management are out of scope.
- **Localization scope**: English (default) and Indonesian (secondary) are the supported display languages; other locales are out of scope.
- **Dropdown option sets**: US states use the standard 2-letter set; AUS uses the eight listed; IDN provinces use the official Indonesian province list (examples given: Jawa Barat, Bali, Sumatra Utara).
- **Address Line 2 / Village are optional**: blank is valid for these; all other listed fields are required per their country.
- **Autocomplete is an accelerator, not a gate**: it speeds entry but the manual path is always available and authoritative.
- **De-duplication out of scope**: repeated identical submissions are each recorded; no dedupe logic for the demo.
