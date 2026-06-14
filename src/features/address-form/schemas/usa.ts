import { z } from "zod";
import { US_STATES } from "../config/options";

const stateValues = US_STATES.map((o) => o.value);

/** USA address schema — single source of truth for client validation (FR-013). */
export const usaSchema = z.object({
  addressLine1: z.string().min(1, { message: "errors.required" }),
  addressLine2: z.string().optional(),
  city: z.string().min(1, { message: "errors.required" }),
  state: z
    .string()
    .min(1, { message: "errors.required" })
    .refine((v) => stateValues.includes(v), { message: "errors.invalidOption" }),
  zipCode: z.string().regex(/^\d{5}$/, { message: "errors.zip5" }),
});

export type UsaFields = z.infer<typeof usaSchema>;
