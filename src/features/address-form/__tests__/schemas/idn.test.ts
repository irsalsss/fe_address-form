import { describe, expect, it } from "vitest";
import { idnSchema } from "../../schemas/idn";

const valid = {
  province: "Jawa Barat",
  cityRegency: "Bandung",
  district: "Coblong",
  postalCode: "40132",
  streetAddress: "Jl. Ganesha No. 10",
};

describe("idnSchema", () => {
  it("accepts a valid address (village optional)", () => {
    expect(idnSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-5-digit postal code", () => {
    expect(idnSchema.safeParse({ ...valid, postalCode: "4013" }).success).toBe(false);
  });

  it("rejects a missing required district (Kecamatan)", () => {
    const { district: _district, ...noDistrict } = valid;
    void _district;
    expect(idnSchema.safeParse(noDistrict).success).toBe(false);
  });

  it("rejects an out-of-set province", () => {
    expect(idnSchema.safeParse({ ...valid, province: "Atlantis" }).success).toBe(false);
  });
});
