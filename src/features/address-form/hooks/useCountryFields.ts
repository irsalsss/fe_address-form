import { COUNTRY_CONFIGS, type FieldDescriptor } from "../config/country-config";
import type { Country } from "../types";

/**
 * Returns the ordered field descriptors for a country from the metadata
 * registry. Empty list when no country is selected. Pure lookup — keeps the
 * renderer country-agnostic (Constitution I).
 */
export function useCountryFields(country: Country | null): FieldDescriptor[] {
  return country ? COUNTRY_CONFIGS[country].fields : [];
}
