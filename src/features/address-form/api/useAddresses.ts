import { useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { AddressResponse } from "../types";
import { addressesQueryKey } from "./useCreateAddress";

interface AddressesResponse {
  addresses: AddressResponse[];
  limit: number;
  offset: number;
}

/**
 * Lists saved addresses (GET /addresses, FR-018). Shares `addressesQueryKey`
 * with useCreateAddress so a successful create invalidates and refreshes this
 * list (T041).
 */
export function useAddresses() {
  return useQuery({
    queryKey: addressesQueryKey,
    queryFn: () => http.get<AddressesResponse>("/addresses"),
  });
}
