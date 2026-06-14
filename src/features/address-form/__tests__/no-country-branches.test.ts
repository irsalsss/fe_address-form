import { describe, expect, it } from "vitest";
import rendererSrc from "../components/DynamicFieldRenderer.tsx?raw";
import confirmationSrc from "../components/AddressConfirmation.tsx?raw";
import countrySelectSrc from "../components/CountrySelect.tsx?raw";
import savedSrc from "../components/SavedAddresses.tsx?raw";

/**
 * SC-003 / Constitution I: render + confirmation logic must be metadata-driven —
 * no per-country conditional branches. (Mapping Google components in
 * usePlaceMapping is country-specific LOGIC, not rendering, and is intentionally
 * excluded from this invariant.)
 */
const sources: Record<string, string> = {
  "DynamicFieldRenderer.tsx": rendererSrc,
  "AddressConfirmation.tsx": confirmationSrc,
  "CountrySelect.tsx": countrySelectSrc,
  "SavedAddresses.tsx": savedSrc,
};

const perCountryBranch =
  /\bif\s*\(\s*country\b|country\s*===\s*["'](USA|AUS|IDN)["']|case\s*["'](USA|AUS|IDN)["']/;

/** Strip comments so documentation mentioning a branch doesn't trigger a false positive. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("metadata-driven rendering invariant (SC-003)", () => {
  for (const [name, source] of Object.entries(sources)) {
    it(`has no per-country branches: ${name}`, () => {
      expect(perCountryBranch.test(stripComments(source))).toBe(false);
    });
  }
});
