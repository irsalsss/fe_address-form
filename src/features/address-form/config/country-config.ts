/**
 * Metadata-driven country configuration (Constitution I — NON-NEGOTIABLE).
 *
 * Each country is described as DATA: an ordered list of field descriptors.
 * The form renderer consumes this generically — there are NO `if (country ===)`
 * branches anywhere in rendering logic. Adding/editing a country happens here
 * (plus a Zod schema), never in components.
 */
import type { Country } from "../types";
import {
  AUS_STATES,
  IDN_PROVINCES,
  US_STATES,
  type FieldOption,
} from "./options";

export type FieldFormat = "zip5" | "postcode4" | "postal5";

export interface FieldDescriptor {
  /**
   * Stable field id — MUST match the backend registry key (countries/registry.ts).
   * This is the payload key sent to POST /addresses (validator is `.strict()`).
   * Never derive it from the label; `labelKey` is for display only.
   */
  key: string;
  /** i18n key in the `address-form` namespace (e.g. `fields.zipCode`). */
  labelKey: string;
  type: "text" | "select";
  required: boolean;
  format?: FieldFormat;
  options?: FieldOption[];
}

export interface CountryConfig {
  country: Country;
  /** Ordered — order is significant and drives render + confirmation order. */
  fields: FieldDescriptor[];
}

const USA: CountryConfig = {
  country: "USA",
  fields: [
    { key: "line1", labelKey: "fields.addressLine1", type: "text", required: true },
    { key: "line2", labelKey: "fields.addressLine2", type: "text", required: false },
    { key: "city", labelKey: "fields.city", type: "text", required: true },
    { key: "state", labelKey: "fields.state", type: "select", required: true, options: US_STATES },
    { key: "zip", labelKey: "fields.zipCode", type: "text", required: true, format: "zip5" },
  ],
};

const AUS: CountryConfig = {
  country: "AUS",
  fields: [
    { key: "line1", labelKey: "fields.addressLine1", type: "text", required: true },
    { key: "line2", labelKey: "fields.addressLine2", type: "text", required: false },
    { key: "suburb", labelKey: "fields.suburb", type: "text", required: true },
    { key: "state", labelKey: "fields.state", type: "select", required: true, options: AUS_STATES },
    { key: "postcode", labelKey: "fields.postcode", type: "text", required: true, format: "postcode4" },
  ],
};

const IDN: CountryConfig = {
  country: "IDN",
  fields: [
    { key: "province", labelKey: "fields.province", type: "select", required: true, options: IDN_PROVINCES },
    { key: "city", labelKey: "fields.cityRegency", type: "text", required: true },
    { key: "district", labelKey: "fields.district", type: "text", required: true },
    { key: "village", labelKey: "fields.village", type: "text", required: false },
    { key: "postalCode", labelKey: "fields.postalCode", type: "text", required: true, format: "postal5" },
    { key: "street", labelKey: "fields.streetAddress", type: "text", required: true },
  ],
};

export const COUNTRY_CONFIGS: Record<Country, CountryConfig> = { USA, AUS, IDN };

export const COUNTRIES: Country[] = ["USA", "AUS", "IDN"];
