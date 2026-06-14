import type { CountryListEntry } from "../../api/useCountries";
import type { MetadataFieldDef } from "../../api/useCountryMetadata";

/** Shared backend-metadata fixtures for AddressForm integration tests. */
export const COUNTRY_LIST: CountryListEntry[] = [
  { code: "USA", name: "United States", version: "v1" },
  { code: "AUS", name: "Australia", version: "v1" },
  { code: "IDN", name: "Indonesia", version: "v1" },
];

export const COUNTRY_FIELDS: Record<string, MetadataFieldDef[]> = {
  USA: [
    { key: "line1", label: "Address Line 1", required: true, type: "text", order: 1 },
    { key: "line2", label: "Address Line 2", required: false, type: "text", order: 2 },
    { key: "city", label: "City", required: true, type: "text", order: 3 },
    {
      key: "state",
      label: "State",
      required: true,
      type: "dropdown",
      order: 4,
      options: [
        { value: "CA", label: "California" },
        { value: "NY", label: "New York" },
      ],
    },
    {
      key: "zip",
      label: "ZIP Code",
      required: true,
      type: "text",
      order: 5,
      validation: { length: 5, numeric: true },
    },
  ],
  AUS: [
    { key: "line1", label: "Address Line 1", required: true, type: "text", order: 1 },
    { key: "line2", label: "Address Line 2", required: false, type: "text", order: 2 },
    { key: "suburb", label: "Suburb", required: true, type: "text", order: 3 },
    {
      key: "state",
      label: "State",
      required: true,
      type: "dropdown",
      order: 4,
      options: [
        { value: "NSW", label: "New South Wales" },
        { value: "VIC", label: "Victoria" },
      ],
    },
    {
      key: "postcode",
      label: "Postcode",
      required: true,
      type: "text",
      order: 5,
      validation: { length: 4, numeric: true },
    },
  ],
  IDN: [
    {
      key: "province",
      label: "Province",
      required: true,
      type: "dropdown",
      order: 1,
      options: [{ value: "BAL", label: "Bali" }],
    },
    { key: "city", label: "City / Regency", required: true, type: "text", order: 2 },
    { key: "district", label: "District (Kecamatan)", required: true, type: "text", order: 3 },
    { key: "village", label: "Village (Kelurahan/Desa)", required: false, type: "text", order: 4 },
    {
      key: "postalCode",
      label: "Postal Code",
      required: true,
      type: "text",
      order: 5,
      validation: { length: 5, numeric: true },
    },
    { key: "street", label: "Street Address", required: true, type: "text", order: 6 },
  ],
};

/** Build a fresh country list with the IDN metadata version bumped (cache-invalidation tests). */
export function bumpedVersion(): CountryListEntry[] {
  return COUNTRY_LIST.map((c) => (c.code === "IDN" ? { ...c, version: "v2" } : c));
}
