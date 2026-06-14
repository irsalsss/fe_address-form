import { describe, expect, it } from "vitest";
import { tDynamic, tFieldLabel, type DynamicT } from "../../lib/tDynamic";

/** Fake i18next t: returns a translation for known keys, else the defaultValue. */
function makeT(known: Record<string, string>): DynamicT {
  const fn = (key: string, options?: Record<string, unknown>): string => {
    const entry = known[key];
    if (entry !== undefined) {
      return entry.replace("{{count}}", String(options?.count ?? ""));
    }
    return (options?.defaultValue as string | undefined) ?? key;
  };
  return fn as unknown as DynamicT;
}

describe("tDynamic", () => {
  it("returns the local translation when the key exists", () => {
    const t = makeT({ "fields.zip": "ZIP Code" });
    expect(tDynamic(t, "fields.zip", "Backend ZIP")).toBe("ZIP Code");
  });

  it("falls back to the provided backend label when no translation", () => {
    const t = makeT({});
    expect(tDynamic(t, "fields.weirdKey", "Backend Label")).toBe("Backend Label");
  });

  it("humanizes the key's last segment as last resort", () => {
    const t = makeT({});
    expect(tDynamic(t, "fields.postalCode")).toBe("Postal Code");
  });

  it("interpolates values (count) for message keys", () => {
    const t = makeT({ "errors.length": "Must be exactly {{count}} digits" });
    expect(tDynamic(t, "errors.length", undefined, { count: 5 })).toBe("Must be exactly 5 digits");
  });
});

describe("tFieldLabel", () => {
  it("prefers local, then backend label, then humanized key", () => {
    expect(tFieldLabel(makeT({ "fields.zip": "ZIP Code" }), "zip", "Backend")).toBe("ZIP Code");
    expect(tFieldLabel(makeT({}), "zip", "Backend ZIP")).toBe("Backend ZIP");
    expect(tFieldLabel(makeT({}), "postalCode")).toBe("Postal Code");
  });
});
