export type Country = "USA" | "AUS" | "IDN";

export interface USAAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface AUSAddress {
  addressLine1: string;
  addressLine2?: string;
  suburb: string;
  state: string;
  postcode: string;
}

export interface IDNAddress {
  province: string;
  cityRegency: string;
  district: string;
  village?: string;
  postalCode: string;
  streetAddress: string;
}

export type Address = USAAddress | AUSAddress | IDNAddress;

export interface AddressFormData {
  country: Country;
  googlePlaceId?: string;
  manualEntry: boolean;
  address: Address;
}

/** Request body sent to POST /addresses (matches contracts/openapi.yaml). */
export interface CreateAddressRequest {
  country: Country;
  fields: Address;
  googlePlaceId?: string;
}

/** Address record returned by the API (GET /addresses, POST /addresses 201). */
export interface AddressResponse {
  id: string;
  country: Country;
  fields: Address;
  createdAt: string;
}
