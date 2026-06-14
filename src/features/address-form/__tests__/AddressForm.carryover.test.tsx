import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import type { MappedPlace } from "../hooks/usePlaceMapping";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";

const hoisted = vi.hoisted(() => ({
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
  useCreateAddress: () => ({ mutate: vi.fn(), isPending: false, isError: false, isSuccess: false }),
}));

describe("AddressForm — autocomplete values carry into manual edit (US2, FR-007)", () => {
  beforeEach(() => {
    hoisted.holder.onResult = undefined;
    useAddressFormStore.getState().reset();
  });

  it("keeps populated values when toggling Manually Edit", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);

    act(() => {
      hoisted.holder.onResult?.({
        fields: {
          addressLine1: "1 Main St",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90001",
        },
        missingRequired: [],
      });
    });

    await userEvent.click(screen.getByRole("button", { name: /manually edit/i }));

    expect(screen.getByLabelText(/Address Line 1/i)).toHaveValue("1 Main St");
    expect(screen.getByLabelText(/City/i)).toHaveValue("Los Angeles");
    expect(screen.getByLabelText(/ZIP Code/i)).toHaveValue("90001");
  });
});
