import { render, screen, within } from "@testing-library/react";
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

const asCountries = (data: unknown) => ({ data, isPending: false, isError: false }) as unknown as ReturnType<typeof useCountries>;
const asMetadata = (data: unknown) =>
  ({ data, isPending: false, isError: false, refetch: vi.fn() }) as unknown as ReturnType<typeof useCountryMetadata>;

describe("AddressForm — metadata-driven render (US1)", () => {
  beforeEach(() => {
    useAddressFormStore.getState().reset();
    vi.mocked(useCountries).mockReturnValue(asCountries(COUNTRY_LIST));
    vi.mocked(useCountryMetadata).mockImplementation((code) =>
      asMetadata(code ? { code, name: code, version: "v1", fields: COUNTRY_FIELDS[code] } : undefined),
    );
  });

  it("renders the USA field set from metadata: text input vs dropdown, in order", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

    // Text field is an input; select field is a combobox — driven by metadata `type`.
    expect(screen.getByLabelText(/ZIP Code/i)).toHaveProperty("tagName", "INPUT");
    expect(screen.getByLabelText(/^State/i)).toHaveAttribute("role", "combobox");

    // Labels resolved (local translation for known keys).
    expect(screen.getByLabelText(/Address Line 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
  });

  it("falls back to the backend English label when no local translation exists", async () => {
    vi.mocked(useCountryMetadata).mockReturnValue(
      asMetadata({
        code: "USA",
        name: "United States",
        version: "v1",
        fields: [
          { key: "buildingName", label: "Building Name", required: false, type: "text", order: 1 },
        ],
      }),
    );
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

    // `buildingName` has no fields.* translation → backend label is shown (not a raw key).
    expect(screen.getByLabelText(/Building Name/i)).toBeInTheDocument();
    expect(screen.queryByText("buildingName")).not.toBeInTheDocument();
  });

  it("sources the dropdown options from country metadata", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

    await userEvent.click(screen.getByLabelText(/^State/i));
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("California")).toBeInTheDocument();
    expect(within(listbox).getByText("New York")).toBeInTheDocument();
  });
});
