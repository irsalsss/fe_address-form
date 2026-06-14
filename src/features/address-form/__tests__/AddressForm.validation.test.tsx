import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import { AddressForm } from "../components/AddressForm";
import { useAddressFormStore } from "../stores/addressFormStore";

const hoisted = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("../hooks/useGooglePlaces", () => ({
  useGooglePlaces: () => ({ inputRef: { current: null }, unavailable: false }),
}));
vi.mock("../api/useCreateAddress", () => ({
  useCreateAddress: () => ({
    mutate: hoisted.mutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

const manualEdit = () => userEvent.click(screen.getByRole("button", { name: /manually edit/i }));
const submit = () => userEvent.click(screen.getByRole("button", { name: /save address/i }));

describe("AddressForm — validation & country switch (US2)", () => {
  beforeEach(() => {
    hoisted.mutate.mockClear();
    useAddressFormStore.getState().reset();
  });

  it("switches country: layout swaps and shared fields carry while incompatible clear", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await manualEdit();

    await userEvent.type(screen.getByLabelText(/Address Line 1/i), "1 Main St");
    await userEvent.type(screen.getByLabelText(/ZIP Code/i), "90001");

    act(() => useAddressFormStore.getState().setCountry("AUS"));
    await manualEdit(); // setCountry resets manualEdit; re-enter

    // AUS layout present, USA-only field gone.
    expect(screen.getByLabelText(/Suburb/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/ZIP Code/i)).not.toBeInTheDocument();
    // Shared field carried over.
    expect(screen.getByLabelText(/Address Line 1/i)).toHaveValue("1 Main St");
  });

  it("blocks an empty submit with per-field required errors", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await manualEdit();
    await submit();

    expect((await screen.findAllByText("This field is required")).length).toBeGreaterThan(0);
    expect(hoisted.mutate).not.toHaveBeenCalled();
  });

  it("rejects a wrong-length ZIP with a localized format error", async () => {
    useAddressFormStore.setState({ selectedCountry: "USA" });
    render(<AddressForm />);
    await manualEdit();
    await userEvent.type(screen.getByLabelText(/ZIP Code/i), "123");
    await submit();

    expect(await screen.findByText(/5-digit ZIP code/i)).toBeInTheDocument();
    expect(hoisted.mutate).not.toHaveBeenCalled();
  });
});
