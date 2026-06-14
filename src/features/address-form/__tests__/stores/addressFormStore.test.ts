import { beforeEach, describe, expect, it } from "vitest";
import { useAddressFormStore } from "../../stores/addressFormStore";

describe("addressFormStore", () => {
  beforeEach(() => {
    useAddressFormStore.getState().reset();
  });

  it("toggles manualEdit", () => {
    useAddressFormStore.getState().setManualEdit(true);
    expect(useAddressFormStore.getState().manualEdit).toBe(true);
  });

  it("setCountry resets manualEdit and googlePlaceId", () => {
    const s = useAddressFormStore.getState();
    s.setManualEdit(true);
    s.setGooglePlaceId("place-123");

    s.setCountry("AUS");

    const next = useAddressFormStore.getState();
    expect(next.selectedCountry).toBe("AUS");
    expect(next.manualEdit).toBe(false);
    expect(next.googlePlaceId).toBeUndefined();
  });

  it("reset returns to initial state", () => {
    const s = useAddressFormStore.getState();
    s.setCountry("USA");
    s.reset();
    expect(useAddressFormStore.getState().selectedCountry).toBeNull();
  });
});
