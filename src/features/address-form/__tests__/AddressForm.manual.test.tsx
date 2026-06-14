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

async function enterManualMode() {
  await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));
}

describe("AddressForm — manual mode renders the right fields per country (US2)", () => {
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

  it("renders the USA field set", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await enterManualMode();

    expect(screen.getByLabelText(/Address Line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^State/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ZIP Code/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Suburb/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Province/i)).not.toBeInTheDocument();
  });

  it("renders the AUS field set", async () => {
    useAddressFormStore.setState({ selectedCountry: "AUS" });
    render(<AddressForm />);
    await enterManualMode();

    expect(screen.getByLabelText(/Suburb/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Postcode/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^State/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/ZIP Code/i)).not.toBeInTheDocument();
  });

  it("renders the IDN field set", async () => {
    useAddressFormStore.setState({ selectedCountry: "IDN" });
    render(<AddressForm />);
    await enterManualMode();

    expect(screen.getByLabelText(/Province/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/District \(Kecamatan\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Postal Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Street Address/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Address Line 1/i)).not.toBeInTheDocument();
  });
});
