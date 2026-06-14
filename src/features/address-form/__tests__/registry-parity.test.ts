import { describe, expect, it } from "vitest";
// Cross-package import: the backend registry is the SINGLE SOURCE OF TRUTH for
// field keys + validation (its .strict() submit validator is derived from it).
// Importing it here means the FE config cannot silently drift from the server —
// any mismatch fails CI. This is the guard against the bug class that produced
// the 400 "Unrecognized keys" (cityRegency vs city, streetAddress vs street, …).
import { listCountryEntries } from "../../../../../be/src/features/countries/registry";
import { COUNTRY_CONFIGS, COUNTRIES } from "../config/country-config";

/** BE field `type` → FE descriptor `type`. */
const TYPE_MAP: Record<"text" | "dropdown", "text" | "select"> = {
  text: "text",
  dropdown: "select",
};

const beByCode = new Map(listCountryEntries().map((c) => [c.code, c]));

describe("FE country config ↔ BE registry parity", () => {
  it("covers exactly the backend's supported countries", () => {
    expect([...COUNTRIES].sort()).toEqual([...beByCode.keys()].sort());
  });

  it.each(COUNTRIES)("%s: field keys match in order", (code) => {
    const be = beByCode.get(code);
    expect(be, `BE registry missing ${code}`).toBeDefined();
    const beKeys = be!.fields.map((f) => f.key);
    const feKeys = COUNTRY_CONFIGS[code].fields.map((f) => f.key);
    // Order is significant (drives render + confirmation order).
    expect(feKeys).toEqual(beKeys);
  });

  it.each(COUNTRIES)("%s: required flags, types and options match", (code) => {
    const be = beByCode.get(code)!;
    const feByKey = new Map(COUNTRY_CONFIGS[code].fields.map((f) => [f.key, f]));

    for (const beField of be.fields) {
      const fe = feByKey.get(beField.key);
      expect(fe, `${code}.${beField.key} absent from FE config`).toBeDefined();

      expect(fe!.required, `${code}.${beField.key} required mismatch`).toBe(
        beField.required,
      );
      expect(fe!.type, `${code}.${beField.key} type mismatch`).toBe(
        TYPE_MAP[beField.type],
      );

      // Dropdown option values must match exactly (the submit validator enums on them).
      if (beField.type === "dropdown") {
        const beValues = (beField.options ?? []).map((o) => o.value);
        const feValues = (fe!.options ?? []).map((o) => o.value);
        expect(feValues, `${code}.${beField.key} options mismatch`).toEqual(beValues);
      }

      // A constrained BE field (length/numeric/pattern) must carry a FE `format`
      // so client-side validation exists before submit.
      const constrained =
        beField.validation?.length != null ||
        beField.validation?.numeric === true ||
        beField.validation?.pattern != null;
      if (constrained) {
        expect(fe!.format, `${code}.${beField.key} missing FE format`).toBeDefined();
      }
    }
  });
});
