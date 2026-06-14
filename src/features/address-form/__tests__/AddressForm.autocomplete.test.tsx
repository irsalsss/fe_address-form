import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import type { MappedPlace } from "../hooks/usePlaceMapping";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";

const hoisted = vi.hoisted(() => ({
  mutate: vi.fn(),
  holder: { onResult: undefined as ((r: MappedPlace) => void) | undefined },
}));

vi.mock("../hooks/useGooglePlaces", () => ({
  useGooglePlaces: (opts: { onResult: (r: MappedPlace) => void }) => {
    hoisted.holder.onResult = opts.onResult;
    return { inputRef: { current: null }, unavailable: false };
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

describe("AddressForm — autocomplete capture (US1)", () => {
  beforeEach(() => {
    hoisted.mutate.mockClear();
    hoisted.holder.onResult = undefined;
    useAddressFormStore.getState().reset();
  });

  it("populates structured fields from a selected suggestion and submits", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);

    act(() => {
      hoisted.holder.onResult?.({
        fields: {
          addressLine1: "1600 Amphitheatre Pkwy",
          city: "Mountain View",
          state: "CA",
          zipCode: "94043",
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
        fields: expect.objectContaining({ zipCode: "94043", state: "CA" }),
      }),
    );
  });

  it("guards: prompts to select a country before the search is usable", () => {
    render(<AddressForm />);
    expect(
      screen.getByText(/select a country before searching/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/start typing your address/i)).toBeDisabled();
    expect(hoisted.mutate).not.toHaveBeenCalled();
  });
});
