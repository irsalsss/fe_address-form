import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export const countryMetadataQueryKey = (code: string, version?: string) =>
  ["country-metadata", code, version ?? "_"] as const;

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
 * for `key` (the submit payload key). `label` is plain English; the FE resolves
 * its own i18n labels keyed by `key`, falling back to this `label` (FR-012).
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
  /** Metadata version; bumping it invalidates the cache via the query key (FR-003). */
  version?: string;
  fields: MetadataFieldDef[];
}

/**
 * Fetches a country's field definitions from the backend
 * (GET /countries/:code/fields, FR-002). This is the authoritative, runtime
 * source for the form's layout, options, and validation — there is no local
 * country config. `version` (from GET /countries) is folded into the query key
 * so a server-side change invalidates the cache automatically (FR-003); when
 * absent the cache falls back to `staleTime`.
 */
export function useCountryMetadata(code: string | null, version?: string) {
  return useQuery({
    queryKey: countryMetadataQueryKey(code ?? "", version),
    queryFn: () => http.get<CountryFieldsResponse>(`/countries/${code}/fields`),
    enabled: Boolean(code),
    staleTime: 5 * 60 * 1000,
  });
}
