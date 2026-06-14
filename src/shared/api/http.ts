import { env } from "@/shared/config/env";

/** Field-level error returned by the API (RFC 7807 problem+json `errors[]`). */
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldError[];

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ProblemBody {
  title?: string;
  detail?: string;
  errors?: FieldError[];
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
    throw new ApiError(
      res.status,
      body?.title ?? body?.detail ?? res.statusText,
      body?.errors ?? [],
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
