import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";

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
  useCreateAddress: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

describe("AddressForm — autocomplete degradation (US1, SC-006)", () => {
  beforeEach(() => {
    useAddressFormStore.getState().reset();
  });

  it("disables the search and shows a manual-entry notice when Places is unavailable", () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);

    expect(screen.getByLabelText(/search address/i)).toBeDisabled();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    // Not a dead end: the form (and its submit path) still renders.
    expect(screen.getByRole("button", { name: /save address/i })).toBeInTheDocument();
  });

  // NOTE: full "complete + save via manual entry" under degradation is exercised
  // by the US2 manual-entry tests (T029–T031), once the editable DynamicFieldRenderer
  // and Manually Edit toggle exist.
});
