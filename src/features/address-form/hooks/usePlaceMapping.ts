import type { MetadataFieldDef } from "../api/useCountryMetadata";
import type { Country } from "../types";

/** Subset of a Google Places `address_components[]` entry we rely on. */
export interface PlaceAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface MappedPlace {
  /** Country-specific fields extracted from the place, keyed by metadata key. */
  fields: Record<string, string | undefined>;
  /** Required field keys the autocomplete result did NOT fill (spec edge case). */
  missingRequired: string[];
  /** Google place id, when available. */
  placeId?: string;
}

function pick(components: PlaceAddressComponent[], type: string): PlaceAddressComponent | undefined {
  return components.find((c) => c.types.includes(type));
}

/**
 * Map a Google Places result to the active country's field set (FR-014).
 * Country differences are handled here by addressing the known Google component
 * `types` — this is country-specific LOGIC, not data, and is intentionally
 * exempt from the no-per-country-branch render invariant. The output is keyed by
 * metadata field keys, and `missingRequired` is derived from the metadata
 * `fields` so it stays in sync with the backend registry.
 */
export function mapPlaceToFields(
  country: Country,
  components: PlaceAddressComponent[],
  fields: MetadataFieldDef[],
  placeId?: string,
): MappedPlace {
  const streetNumber = pick(components, "street_number")?.long_name ?? "";
  const route = pick(components, "route")?.long_name ?? "";
  const line1 = [streetNumber, route].filter(Boolean).join(" ");
  const subpremise = pick(components, "subpremise")?.long_name;
  const locality =
    pick(components, "locality")?.long_name ?? pick(components, "postal_town")?.long_name ?? "";
  const sublocality =
    pick(components, "sublocality")?.long_name ??
    pick(components, "sublocality_level_1")?.long_name ??
    "";
  const aal1 = pick(components, "administrative_area_level_1");
  const aal2 = pick(components, "administrative_area_level_2")?.long_name ?? "";
  const aal3 = pick(components, "administrative_area_level_3")?.long_name ?? "";
  const aal4 = pick(components, "administrative_area_level_4")?.long_name ?? "";
  const postal = pick(components, "postal_code")?.short_name ?? "";

  let mapped: Record<string, string | undefined>;
  if (country === "USA") {
    mapped = {
      line1,
      line2: subpremise,
      city: locality,
      state: aal1?.short_name ?? "",
      zip: postal,
    };
  } else if (country === "AUS") {
    mapped = {
      line1,
      line2: subpremise,
      suburb: locality || sublocality,
      state: aal1?.short_name ?? "",
      postcode: postal,
    };
  } else {
    mapped = {
      province: aal1?.long_name ?? "",
      city: aal2 || locality,
      district: aal3 || sublocality,
      village: aal4 || undefined,
      postalCode: postal,
      street: line1,
    };
  }

  // Keep only keys the active country's metadata actually declares.
  const fieldKeys = new Set(fields.map((f) => f.key));
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(mapped)) {
    if (fieldKeys.has(key)) result[key] = value;
  }

  const missingRequired = fields
    .filter((f) => f.required && !result[f.key]?.trim())
    .map((f) => f.key);

  return { fields: result, missingRequired, placeId };
}
