import { describe, expect, it } from "vitest";
import { useCountryFields } from "../../hooks/useCountryFields";

describe("useCountryFields", () => {
  it("returns USA fields in order", () => {
    expect(useCountryFields("USA").map((f) => f.key)).toEqual([
      "line1",
      "line2",
      "city",
      "state",
      "zip",
    ]);
  });

  it("returns AUS fields in order", () => {
    expect(useCountryFields("AUS").map((f) => f.key)).toEqual([
      "line1",
      "line2",
      "suburb",
      "state",
      "postcode",
    ]);
  });

  it("returns IDN fields in order", () => {
    expect(useCountryFields("IDN").map((f) => f.key)).toEqual([
      "province",
      "city",
      "district",
      "village",
      "postalCode",
      "street",
    ]);
  });

  it("returns an empty list when no country is selected", () => {
    expect(useCountryFields(null)).toEqual([]);
  });
});
