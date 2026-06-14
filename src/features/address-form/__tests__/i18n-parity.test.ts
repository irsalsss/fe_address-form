import { describe, expect, it } from "vitest";
import en from "@/shared/i18n/locales/en/address-form.json";
import id from "@/shared/i18n/locales/id/address-form.json";

/** Constitution V: locale files must stay at key parity across en/id. */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === "object"
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

describe("i18n address-form key parity (Constitution V)", () => {
  it("en and id have identical key sets", () => {
    const enKeys = flattenKeys(en).sort();
    const idKeys = flattenKeys(id).sort();
    expect(idKeys).toEqual(enKeys);
  });
});
