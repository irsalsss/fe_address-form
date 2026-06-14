import { describe, expect, it } from "vitest";
import { ausSchema } from "../../schemas/aus";

const valid = {
  line1: "1 Macquarie St",
  suburb: "Sydney",
  state: "NSW",
  postcode: "2000",
};

describe("ausSchema", () => {
  it("accepts a valid address", () => {
    expect(ausSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-4-digit postcode", () => {
    expect(ausSchema.safeParse({ ...valid, postcode: "200" }).success).toBe(false);
    expect(ausSchema.safeParse({ ...valid, postcode: "20000" }).success).toBe(false);
  });

  it("rejects a missing required suburb", () => {
    const { suburb: _suburb, ...noSuburb } = valid;
    void _suburb;
    expect(ausSchema.safeParse(noSuburb).success).toBe(false);
  });

  it("rejects an out-of-set state", () => {
    expect(ausSchema.safeParse({ ...valid, state: "XX" }).success).toBe(false);
  });
});
