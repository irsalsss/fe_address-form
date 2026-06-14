import { describe, expect, it } from "vitest";
import type { MetadataFieldDef } from "../../api/useCountryMetadata";
import { buildSchema } from "../../schemas/buildSchema";

const usaFields: MetadataFieldDef[] = [
  { key: "line1", label: "Address Line 1", required: true, type: "text", order: 1 },
  { key: "line2", label: "Address Line 2", required: false, type: "text", order: 2 },
  { key: "city", label: "City", required: true, type: "text", order: 3 },
  {
    key: "state",
    label: "State",
    required: true,
    type: "dropdown",
    order: 4,
    options: [
      { value: "CA", label: "California" },
      { value: "NY", label: "New York" },
    ],
  },
  {
    key: "zip",
    label: "ZIP Code",
    required: true,
    type: "text",
    order: 5,
    validation: { length: 5, numeric: true },
  },
];

const valid = { line1: "1 Main St", line2: "", city: "LA", state: "CA", zip: "90001" };

function firstMessage(fields: MetadataFieldDef[], values: Record<string, string>, key: string) {
  const result = buildSchema(fields).safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === key)?.message;
}

describe("buildSchema", () => {
  it("accepts valid data (optional empty field allowed)", () => {
    expect(buildSchema(usaFields).safeParse(valid).success).toBe(true);
  });

  it("fails a missing required field with errors.required", () => {
    expect(firstMessage(usaFields, { ...valid, city: "" }, "city")).toBe("errors.required");
  });

  it("fails a wrong-length numeric field with errors.length", () => {
    expect(firstMessage(usaFields, { ...valid, zip: "123" }, "zip")).toBe("errors.length");
  });

  it("fails a non-numeric value with errors.numeric", () => {
    expect(firstMessage(usaFields, { ...valid, zip: "ABCDE" }, "zip")).toBe("errors.numeric");
  });

  it("fails a dropdown value not in options with errors.invalidOption", () => {
    expect(firstMessage(usaFields, { ...valid, state: "ZZ" }, "state")).toBe("errors.invalidOption");
  });

  it("enforces maxLength", () => {
    const fields: MetadataFieldDef[] = [
      { key: "note", label: "Note", required: false, type: "text", order: 1, validation: { maxLength: 3 } },
    ];
    expect(buildSchema(fields).safeParse({ note: "ab" }).success).toBe(true);
    expect(firstMessage(fields, { note: "abcd" }, "note")).toBe("errors.maxLength");
  });

  it("enforces pattern", () => {
    const fields: MetadataFieldDef[] = [
      { key: "code", label: "Code", required: true, type: "text", order: 1, validation: { pattern: "^[A-Z]{2}$" } },
    ];
    expect(buildSchema(fields).safeParse({ code: "AB" }).success).toBe(true);
    expect(firstMessage(fields, { code: "abc" }, "code")).toBe("errors.pattern");
  });
});
