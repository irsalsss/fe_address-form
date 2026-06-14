import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";

export const countriesQueryKey = ["countries"] as const;

/** A selectable country as returned by GET /countries (dropdown source, FR-001). */
export interface CountryListEntry {
  code: string;
  name: string;
  /** Current metadata version; folded into the per-country metadata query key (FR-003). */
  version?: string;
}

/** GET /countries wraps the list in a `countries` envelope (be/.../schemas.ts). */
interface CountriesResponse {
  countries: CountryListEntry[];
}

/**
 * Fetches the list of supported countries (GET /countries). This is the ONLY
 * source of the country dropdown — there is no hardcoded country list on the
 * frontend (FR-001). The list is server state, held only in TanStack Query.
 * The backend wraps the array in `{ countries }`; `select` unwraps it so
 * consumers get a bare `CountryListEntry[]`.
 */
export function useCountries() {
  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: () => http.get<CountriesResponse>("/countries"),
    select: (res) => res.countries,
    staleTime: 5 * 60 * 1000,
  });
}
