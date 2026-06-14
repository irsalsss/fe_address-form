import { describe, expect, it } from "vitest";
import { usaSchema } from "../../schemas/usa";

const valid = {
  addressLine1: "1600 Amphitheatre Pkwy",
  city: "Mountain View",
  state: "CA",
  zipCode: "94043",
};

describe("usaSchema", () => {
  it("accepts a valid address (line2 optional)", () => {
    expect(usaSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-5-digit ZIP", () => {
    expect(usaSchema.safeParse({ ...valid, zipCode: "9404" }).success).toBe(false);
    expect(usaSchema.safeParse({ ...valid, zipCode: "940435" }).success).toBe(false);
    expect(usaSchema.safeParse({ ...valid, zipCode: "ABCDE" }).success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { city: _city, ...noCity } = valid;
    void _city;
    expect(usaSchema.safeParse(noCity).success).toBe(false);
  });

  it("rejects an out-of-set state", () => {
    expect(usaSchema.safeParse({ ...valid, state: "ZZ" }).success).toBe(false);
  });
});
