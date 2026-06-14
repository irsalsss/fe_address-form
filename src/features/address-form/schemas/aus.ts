import { z } from "zod";
import { AUS_STATES } from "../config/options";

const stateValues = AUS_STATES.map((o) => o.value);

/** Australia address schema (FR-014). */
export const ausSchema = z.object({
  line1: z.string().min(1, { message: "errors.required" }),
  line2: z.string().optional(),
  suburb: z.string().min(1, { message: "errors.required" }),
  state: z
    .string()
    .min(1, { message: "errors.required" })
    .refine((v) => stateValues.includes(v), { message: "errors.invalidOption" }),
  postcode: z.string().regex(/^\d{4}$/, { message: "errors.postcode4" }),
});

export type AusFields = z.infer<typeof ausSchema>;
