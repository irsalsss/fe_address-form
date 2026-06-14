import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { Country } from "../types";

export const countryMetadataQueryKey = (code: Country) =>
  ["country-metadata", code] as const;

/** A dropdown option as returned by the backend metadata endpoint. */
export interface MetadataFieldOption {
  value: string;
  label: string;
}

/** Field validation rules as returned by the backend (be/.../countries/schemas.ts). */
export interface MetadataFieldValidation {
  length?: number;
  numeric?: boolean;
  pattern?: string;
  maxLength?: number;
}

/**
 * Field descriptor as returned by the backend registry — the SOURCE OF TRUTH
 * for `key` (the submit payload key). Note `label` is plain English; the FE
 * renders its own i18n labels keyed by `key`, so `label` is reference only.
 */
export interface MetadataFieldDef {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "dropdown";
  options?: MetadataFieldOption[];
  validation?: MetadataFieldValidation;
  order: number;
}

export interface CountryFieldsResponse {
  code: string;
  name: string;
  fields: MetadataFieldDef[];
}

/**
 * Fetches a country's field definitions from the backend
 * (GET /api/v1/countries/:code/fields, FR-019).
 *
 * Reconciliation point: the local config registry (`country-config.ts`) is the
 * primary source for synchronous rendering + i18n. This endpoint is the server's
 * authoritative metadata; `registry-parity.test.ts` asserts the two cannot
 * silently diverge (the class of bug that produced the 400 on unrecognized keys).
 */
export function useCountryMetadata(code: Country) {
  return useQuery({
    queryKey: countryMetadataQueryKey(code),
    queryFn: () => http.get<CountryFieldsResponse>(`/countries/${code}/fields`),
    staleTime: Infinity,
  });
}
