import { describe, expect, it } from "vitest";
import { humanizeKey } from "../../lib/humanizeKey";

describe("humanizeKey", () => {
  it("splits camelCase", () => {
    expect(humanizeKey("postalCode")).toBe("Postal Code");
    expect(humanizeKey("addressLine")).toBe("Address Line");
  });

  it("splits snake_case and kebab-case", () => {
    expect(humanizeKey("address_line_1")).toBe("Address Line 1");
    expect(humanizeKey("street-address")).toBe("Street Address");
  });

  it("separates trailing digits", () => {
    expect(humanizeKey("line1")).toBe("Line 1");
  });

  it("title-cases a single word", () => {
    expect(humanizeKey("city")).toBe("City");
  });
});
