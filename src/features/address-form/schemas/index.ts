import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Country } from "../types";
import { usaSchema } from "./usa";
import { ausSchema } from "./aus";
import { idnSchema } from "./idn";

export { usaSchema, ausSchema, idnSchema };
export type { UsaFields } from "./usa";
export type { AusFields } from "./aus";
export type { IdnFields } from "./idn";

/** Per-country field schemas, keyed by country (discriminated registry). */
export const countrySchemas = {
  USA: usaSchema,
  AUS: ausSchema,
  IDN: idnSchema,
} as const;

export type CountrySchema = (typeof countrySchemas)[Country];

/** Schema for a single country's form values. */
export function getCountrySchema(country: Country): CountrySchema {
  return countrySchemas[country];
}

/** RHF resolver helper — wire into useForm({ resolver: addressResolver(country) }). */
export function addressResolver(country: Country) {
  return zodResolver(countrySchemas[country]);
}

/**
 * Full create-request schema (discriminated on `country`). Mirrors the API
 * contract body; useful for validating the outgoing payload.
 */
export const createAddressSchema = z.discriminatedUnion("country", [
  z.object({ country: z.literal("USA"), googlePlaceId: z.string().optional(), fields: usaSchema }),
  z.object({ country: z.literal("AUS"), googlePlaceId: z.string().optional(), fields: ausSchema }),
  z.object({ country: z.literal("IDN"), googlePlaceId: z.string().optional(), fields: idnSchema }),
]);
