import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { AddressResponse, CreateAddressRequest } from "../types";

/** Shared query key for the saved-addresses list (consumed by useAddresses, T038). */
export const addressesQueryKey = ["addresses"] as const;

/**
 * Create an address (POST /addresses). On success, invalidate the saved-list
 * query so US3's view refreshes. On a 422 the failed `http.post` throws an
 * ApiError carrying field-level errors; AddressForm's mutate `onError` maps
 * those onto the matching RHF fields (FR-017).
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
