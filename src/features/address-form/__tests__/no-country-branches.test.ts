import { describe, expect, it } from "vitest";
import rendererSrc from "../components/DynamicFieldRenderer.tsx?raw";
import confirmationSrc from "../components/AddressConfirmation.tsx?raw";
import configSrc from "../config/country-config.ts?raw";

/**
 * SC-007 / Constitution I: the renderer and config must be metadata-driven —
 * no per-country conditional branches. (Mapping Google components in
 * usePlaceMapping is data extraction, not rendering, and is intentionally
 * excluded from this invariant.)
 */
const sources: Record<string, string> = {
  "DynamicFieldRenderer.tsx": rendererSrc,
  "AddressConfirmation.tsx": confirmationSrc,
  "country-config.ts": configSrc,
};

const perCountryBranch =
  /\bif\s*\(\s*country\b|country\s*===\s*["'](USA|AUS|IDN)["']|case\s*["'](USA|AUS|IDN)["']/;

/** Strip comments so documentation mentioning a branch doesn't trigger a false positive. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("metadata-driven rendering invariant (SC-007)", () => {
  for (const [name, source] of Object.entries(sources)) {
    it(`has no per-country branches: ${name}`, () => {
      expect(perCountryBranch.test(stripComments(source))).toBe(false);
    });
  }
});
