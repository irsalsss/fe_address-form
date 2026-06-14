/**
 * Country code. Dynamic — the supported set comes from the backend (GET
 * /countries), so this is a string, not a closed literal union (FR-001/FR-017).
 */
export type Country = string;

/**
 * Flat value shape React Hook Form manages and the form submits. Keys are the
 * active country's metadata field keys, unknown at compile time (FR-010); the
 * backend `.strict()` validator is the authoritative gate.
 */
export type AddressFormValues = Record<string, string>;

/** Request body sent to POST /addresses. */
export interface CreateAddressRequest {
  country: Country;
  fields: Record<string, string>;
  googlePlaceId?: string;
}

/** Address record returned by the API (GET /addresses, POST /addresses 201). */
export interface AddressResponse {
  id: string;
  country: Country;
  fields: Record<string, string>;
  createdAt: string;
}
