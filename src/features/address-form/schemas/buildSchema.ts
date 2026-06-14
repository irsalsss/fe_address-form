import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { z } from "zod";
import type { MetadataFieldDef } from "../api/useCountryMetadata";
import type { AddressFormValues } from "../types";

/**
 * Builds a Zod schema at runtime from backend field metadata (FR-004),
 * replacing the hand-written per-country schemas. Every field is a string (text
 * and dropdown alike). Validation messages are i18n KEYS resolved later via
 * `tDynamic`; the renderer supplies `{ count }` interpolation for length rules.
 *
 * The schema is intentionally NON-strict: field keys are unknown at compile time
 * and the backend `.strict()` validator is the authoritative gate (FR-010).
 */
export function buildSchema(fields: MetadataFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) shape[field.key] = z.string();

  return z.object(shape).superRefine((values, ctx) => {
    for (const field of fields) {
      const raw = values[field.key];
      const value = typeof raw === "string" ? raw : "";
      const empty = value.trim() === "";

      const issue = (message: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field.key], message });

      if (empty) {
        if (field.required) issue("errors.required");
        // Optional + empty: nothing else to validate.
        continue;
      }

      const v = field.validation;
      if (v?.numeric && !/^\d+$/.test(value)) issue("errors.numeric");
      if (v?.length != null && value.length !== v.length) issue("errors.length");
      if (v?.maxLength != null && value.length > v.maxLength) issue("errors.maxLength");
      if (v?.pattern && !new RegExp(v.pattern).test(value)) issue("errors.pattern");
      if (
        field.type === "dropdown" &&
        field.options &&
        !field.options.some((o) => o.value === value)
      ) {
        issue("errors.invalidOption");
      }
    }
  });
}

/**
 * RHF resolver from metadata fields. The form is typed as the flat
 * `AddressFormValues` (keys unknown at compile time, see types.ts); the single
 * cast here bridges the built schema to that type so callers stay cast-free.
 */
export function buildResolver(fields: MetadataFieldDef[]): Resolver<AddressFormValues> {
  return zodResolver(buildSchema(fields)) as unknown as Resolver<AddressFormValues>;
}
