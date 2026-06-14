import { COUNTRY_CONFIGS } from "../config/country-config";
import type { Address, Country } from "../types";

/** Subset of a Google Places `address_components[]` entry we rely on. */
export interface PlaceAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface MappedPlace {
  /** Country-specific fields extracted from the place. */
  fields: Partial<Address>;
  /** Required field keys the autocomplete result did NOT fill (spec edge case). */
  missingRequired: string[];
  /** Google place id, when available. */
  placeId?: string;
}

function pick(components: PlaceAddressComponent[], type: string): PlaceAddressComponent | undefined {
  return components.find((c) => c.types.includes(type));
}

/**
 * Map a Google Places result to the active country's field set (D3).
 * Country differences are handled here by addressing the known component
 * `types`; the renderer stays country-agnostic.
 */
export function mapPlaceToFields(
  country: Country,
  components: PlaceAddressComponent[],
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

  let fields: Partial<Address>;
  if (country === "USA") {
    fields = {
      addressLine1: line1,
      addressLine2: subpremise,
      city: locality,
      state: aal1?.short_name ?? "",
      zipCode: postal,
    };
  } else if (country === "AUS") {
    fields = {
      addressLine1: line1,
      addressLine2: subpremise,
      suburb: locality || sublocality,
      state: aal1?.short_name ?? "",
      postcode: postal,
    };
  } else {
    fields = {
      province: aal1?.long_name ?? "",
      cityRegency: aal2 || locality,
      district: aal3 || sublocality,
      village: aal4 || undefined,
      postalCode: postal,
      streetAddress: line1,
    };
  }

  const record = fields as Record<string, string | undefined>;
  const missingRequired = COUNTRY_CONFIGS[country].fields
    .filter((f) => f.required && !record[f.key]?.trim())
    .map((f) => f.key);

  return { fields, missingRequired, placeId };
}
