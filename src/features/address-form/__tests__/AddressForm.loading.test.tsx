import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";
import { COUNTRY_FIELDS, COUNTRY_LIST } from "./fixtures/metadata";

vi.mock("../hooks/useGooglePlaces", () => ({
  useGooglePlaces: () => ({
    query: "",
    setQuery: vi.fn(),
    predictions: [],
    selectPrediction: vi.fn(),
    loading: false,
    unavailable: false,
  }),
}));
vi.mock("../api/useCreateAddress", () => ({
  useCreateAddress: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
}));
vi.mock("../api/useCountries");
vi.mock("../api/useCountryMetadata");

import { useCountries } from "../api/useCountries";
import { useCountryMetadata } from "../api/useCountryMetadata";

const countriesOk = () =>
  vi.mocked(useCountries).mockReturnValue({
    data: COUNTRY_LIST,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useCountries>);

describe("AddressForm — metadata loading / error / retry (US3, FR-008/009)", () => {
  beforeEach(() => {
    useAddressFormStore.getState().reset();
    useAddressFormStore.setState({ selectedCountry: "USA" });
    countriesOk();
  });

  it("shows a loading state while metadata is pending", () => {
    vi.mocked(useCountryMetadata).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCountryMetadata>);

    render(<AddressForm />);

    expect(screen.getByText(/loading address fields/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save address/i })).not.toBeInTheDocument();
  });

  it("shows an error with a Retry that refetches and recovers without reload", async () => {
    const refetch = vi.fn(() => {
      // After retry, metadata resolves.
      vi.mocked(useCountryMetadata).mockReturnValue({
        data: { code: "USA", name: "United States", version: "v1", fields: COUNTRY_FIELDS.USA },
        isPending: false,
        isError: false,
        refetch,
      } as unknown as ReturnType<typeof useCountryMetadata>);
      return Promise.resolve();
    });
    vi.mocked(useCountryMetadata).mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useCountryMetadata>);

    const { rerender } = render(<AddressForm />);

    expect(screen.getByText(/could not load address fields/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();

    rerender(<AddressForm />);
    expect(screen.getByRole("button", { name: /save address/i })).toBeInTheDocument();
  });
});
