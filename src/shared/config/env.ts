import { z } from "zod";

const schema = z.object({
  MODE: z.enum(["development", "production", "test"]),
  VITE_API_URL: z.string().url().optional(),
  VITE_GOOGLE_PLACES_API_KEY: z.string().optional(),
});

export const env = schema.parse(import.meta.env);
