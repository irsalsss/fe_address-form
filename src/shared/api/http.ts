import { env } from "@/shared/config/env";

/**
 * Field-level error mapped from the API's problem+json `details.fieldErrors`
 * (Zod `flatten()`). `field` is a registry field key (zip, street, …) and maps
 * 1:1 onto a React Hook Form field name.
 */
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];
  /** Non-field-level messages (country-level / whole-body). Surface in banner. */
  readonly formErrors: string[];

  constructor(
    status: number,
    message: string,
    fieldErrors: FieldError[] = [],
    formErrors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
  }
}

/** RFC 7807 problem+json body. Validation errors live under `details` (Zod flatten). */
interface ProblemBody {
  title?: string;
  detail?: string;
  code?: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[]>;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = env.VITE_API_URL ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let body: ProblemBody | null;
    try {
      body = (await res.json()) as ProblemBody;
    } catch {
      body = null;
    }
    const fieldErrors: FieldError[] = Object.entries(
      body?.details?.fieldErrors ?? {},
    ).map(([field, msgs]) => ({ field, message: msgs[0] ?? "Invalid" }));
    throw new ApiError(
      res.status,
      body?.detail ?? body?.title ?? res.statusText,
      fieldErrors,
      body?.details?.formErrors ?? [],
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
};
