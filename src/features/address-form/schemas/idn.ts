import { z } from "zod";
import { IDN_PROVINCES } from "../config/options";

const provinceValues = IDN_PROVINCES.map((o) => o.value);

/** Indonesia address schema (FR-015). */
export const idnSchema = z.object({
  province: z
    .string()
    .min(1, { message: "errors.required" })
    .refine((v) => provinceValues.includes(v), { message: "errors.invalidOption" }),
  city: z.string().min(1, { message: "errors.required" }),
  district: z.string().min(1, { message: "errors.required" }),
  village: z.string().optional(),
  postalCode: z.string().regex(/^\d{5}$/, { message: "errors.postal5" }),
  street: z.string().min(1, { message: "errors.required" }),
});

export type IdnFields = z.infer<typeof idnSchema>;
