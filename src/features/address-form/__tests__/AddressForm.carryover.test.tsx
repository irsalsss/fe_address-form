import { render, screen, act, within } from "@testing-library/react";
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

const manualEdit = () => userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

describe("AddressForm — country switch carry-over (US4, FR-015)", () => {
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

  it("carries shared text fields but not dropdown selections across countries", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await manualEdit();

    await userEvent.type(screen.getByLabelText(/Address Line 1/i), "1 Main St");
    // Select a USA state (dropdown).
    await userEvent.click(screen.getByLabelText(/^State/i));
    await userEvent.click(within(await screen.findByRole("listbox")).getByText("California"));
    expect(screen.getByLabelText(/^State/i)).toHaveTextContent("California");

    act(() => useAddressFormStore.getState().setCountry("AUS"));
    await manualEdit();

    // Shared text field carried over.
    expect(screen.getByLabelText(/Address Line 1/i)).toHaveValue("1 Main St");
    // Dropdown selection did NOT carry — the AUS state shows its placeholder, not "California".
    expect(screen.queryByText("California")).not.toBeInTheDocument();
  });
});
