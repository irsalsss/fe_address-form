import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";
import { COUNTRY_FIELDS, COUNTRY_LIST } from "./fixtures/metadata";

// Places unavailable (no key / script blocked).
vi.mock("../hooks/useGooglePlaces", () => ({
  useGooglePlaces: () => ({
    query: "",
    setQuery: vi.fn(),
    predictions: [],
    selectPrediction: vi.fn(),
    loading: false,
    unavailable: true,
  }),
}));
vi.mock("../api/useCreateAddress", () => ({
  useCreateAddress: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
}));
vi.mock("../api/useCountries");
vi.mock("../api/useCountryMetadata");

import { useCountries } from "../api/useCountries";
import { useCountryMetadata } from "../api/useCountryMetadata";

describe("AddressForm — autocomplete degradation (US1, SC-006)", () => {
  beforeEach(() => {
    useAddressFormStore.getState().reset();
    vi.mocked(useCountries).mockReturnValue({
      data: COUNTRY_LIST,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCountries>);
    vi.mocked(useCountryMetadata).mockImplementation(
      (code) =>
        ({
          data: code ? { code, name: code, version: "v1", fields: COUNTRY_FIELDS[code] } : undefined,
          isPending: false,
          isError: false,
          refetch: vi.fn(),
        }) as unknown as ReturnType<typeof useCountryMetadata>,
    );
  });

  it("disables the search and shows a manual-entry notice when Places is unavailable", () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);

    expect(screen.getByLabelText(/search address/i)).toBeDisabled();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    // Not a dead end: the form (and its submit path) still renders.
    expect(screen.getByRole("button", { name: /save address/i })).toBeInTheDocument();
  });
});
