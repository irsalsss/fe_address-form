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

// Async factory so we can construct a real ApiError (instanceof check in the component).
vi.mock("../api/useCreateAddress", async () => {
  const { ApiError } = await import("@/shared/api/http");
  return {
    useCreateAddress: () => ({
      mutate: (
        _body: unknown,
        opts: { onError: (e: unknown) => void; onSuccess: () => void },
      ) =>
        opts.onError(
          new ApiError(
            400,
            "Bad Request",
            [
              { field: "zip", message: "Server rejected this ZIP" },
              { field: "unknownKey", message: "Stray server error" },
            ],
            ["Whole-form problem"],
          ),
        ),
      isPending: false,
      isError: false,
      isSuccess: false,
    }),
  };
});
vi.mock("../api/useCountries");
vi.mock("../api/useCountryMetadata");

import { useCountries } from "../api/useCountries";
import { useCountryMetadata } from "../api/useCountryMetadata";

describe("AddressForm — server field errors (US2, FR-011)", () => {
  beforeEach(() => {
    useAddressFormStore.getState().reset();
    useAddressFormStore.setState({ selectedCountry: "USA" });
    vi.mocked(useCountries).mockReturnValue({
      data: COUNTRY_LIST,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCountries>);
    vi.mocked(useCountryMetadata).mockReturnValue({
      data: { code: "USA", name: "United States", version: "v1", fields: COUNTRY_FIELDS.USA },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useCountryMetadata>);
  });

  it("maps server field errors onto fields and surfaces unmatched ones in a banner", async () => {
    render(<AddressForm />);
    await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

    await userEvent.type(screen.getByLabelText(/Address Line 1/i), "1 Main St");
    await userEvent.type(screen.getByLabelText(/City/i), "LA");
    await userEvent.click(screen.getByLabelText(/^State/i));
    await userEvent.click(within(await screen.findByRole("listbox")).getByText("California"));
    await userEvent.type(screen.getByLabelText(/ZIP Code/i), "90001");

    await userEvent.click(screen.getByRole("button", { name: /save address/i }));

    // Known field error mapped onto the field.
    expect(await screen.findByText("Server rejected this ZIP")).toBeInTheDocument();
    // Unmatched field error + form-level error fall back to the banner (no crash).
    expect(screen.getByText(/Whole-form problem/)).toBeInTheDocument();
    expect(screen.getByText(/Stray server error/)).toBeInTheDocument();
  });
});
