import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { AddressResponse, CreateAddressRequest } from "../types";

/** Shared query key for the saved-addresses list (consumed by useAddresses, T038). */
export const addressesQueryKey = ["addresses"] as const;

/**
 * Create an address (POST /addresses). On success, invalidate the saved-list
 * query so US3's view refreshes. 422 field errors surface via ApiError
 * (mapped onto RHF fields by the form — see DynamicFieldRenderer / T035).
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAddressRequest) =>
      http.post<AddressResponse>("/addresses", body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: addressesQueryKey });
    },
  });
}
