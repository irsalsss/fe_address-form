import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { CountryConfig } from "../config/country-config";

export const countryMetadataQueryKey = ["country-metadata"] as const;

interface MetadataResponse {
  data: CountryConfig[];
}

/**
 * Fetches per-country field definitions from the backend (GET /addresses/metadata,
 * FR-019). Optional reconciliation point: the local config registry is the
 * primary source for rendering; this lets the FE verify parity with the server.
 */
export function useCountryMetadata() {
  return useQuery({
    queryKey: countryMetadataQueryKey,
    queryFn: () => http.get<MetadataResponse>("/addresses/metadata"),
    staleTime: Infinity,
  });
}
