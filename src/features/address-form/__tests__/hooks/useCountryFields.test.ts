import { describe, expect, it } from "vitest";
import { useCountryFields } from "../../hooks/useCountryFields";

describe("useCountryFields", () => {
  it("returns USA fields in order", () => {
    expect(useCountryFields("USA").map((f) => f.key)).toEqual([
      "addressLine1",
      "addressLine2",
      "city",
      "state",
      "zipCode",
    ]);
  });

  it("returns AUS fields in order", () => {
    expect(useCountryFields("AUS").map((f) => f.key)).toEqual([
      "addressLine1",
      "addressLine2",
      "suburb",
      "state",
      "postcode",
    ]);
  });

  it("returns IDN fields in order", () => {
    expect(useCountryFields("IDN").map((f) => f.key)).toEqual([
      "province",
      "cityRegency",
      "district",
      "village",
      "postalCode",
      "streetAddress",
    ]);
  });

  it("returns an empty list when no country is selected", () => {
    expect(useCountryFields(null)).toEqual([]);
  });
});
