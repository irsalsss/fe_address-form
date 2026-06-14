import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import type { MappedPlace } from "../hooks/usePlaceMapping";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";
import { COUNTRY_FIELDS, COUNTRY_LIST } from "./fixtures/metadata";

const hoisted = vi.hoisted(() => ({
  mutate: vi.fn(),
  holder: { onResult: undefined as ((r: MappedPlace) => void) | undefined },
}));

vi.mock("../hooks/useGooglePlaces", () => ({
  useGooglePlaces: (opts: { onResult: (r: MappedPlace) => void }) => {
    hoisted.holder.onResult = opts.onResult;
    return {
      query: "",
      setQuery: vi.fn(),
      predictions: [],
      selectPrediction: vi.fn(),
      loading: false,
      unavailable: false,
    };
  },
}));
vi.mock("../api/useCreateAddress", () => ({
  useCreateAddress: () => ({
    mutate: hoisted.mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));
vi.mock("../api/useCountries");
vi.mock("../api/useCountryMetadata");

import { useCountries } from "../api/useCountries";
import { useCountryMetadata } from "../api/useCountryMetadata";

describe("AddressForm — autocomplete capture keyed to metadata (US1/US4)", () => {
  beforeEach(() => {
    hoisted.mutate.mockClear();
    hoisted.holder.onResult = undefined;
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

  it("populates fields by metadata key from a selected suggestion and submits", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);

    act(() => {
      hoisted.holder.onResult?.({
        fields: {
          line1: "1600 Amphitheatre Pkwy",
          city: "Mountain View",
          state: "CA",
          zip: "94043",
        },
        missingRequired: [],
      });
    });

    expect(await screen.findByText("94043")).toBeInTheDocument();
    expect(screen.getByText("Mountain View")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /save address/i }));

    expect(hoisted.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        country: "USA",
        fields: expect.objectContaining({ zip: "94043", state: "CA" }),
      }),
      expect.objectContaining({ onError: expect.any(Function), onSuccess: expect.any(Function) }),
    );
  });

  it("keeps populated values when toggling Manually Edit", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);

    act(() => {
      hoisted.holder.onResult?.({
        fields: { line1: "1 Main St", city: "Los Angeles", state: "CA", zip: "90001" },
        missingRequired: [],
      });
    });

    await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

    expect(screen.getByLabelText(/Address Line 1/i)).toHaveValue("1 Main St");
    expect(screen.getByLabelText(/City/i)).toHaveValue("Los Angeles");
    expect(screen.getByLabelText(/ZIP Code/i)).toHaveValue("90001");
  });

  it("guards: prompts to select a country before the search is usable", () => {
    render(<AddressForm />);
    expect(screen.getByText(/select a country before searching/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/start typing your address/i)).toBeDisabled();
    expect(hoisted.mutate).not.toHaveBeenCalled();
  });
});
