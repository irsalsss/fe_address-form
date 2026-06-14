import { create } from "zustand";
import type { Country } from "../types";

/**
 * Feature UI state (Constitution IV). Server data lives in TanStack Query, form
 * values in React Hook Form — only pure UI/selection state lives here.
 */
interface AddressFormState {
  selectedCountry: Country | null;
  manualEdit: boolean;
  googlePlaceId?: string;
  /** Switching country resets dependent UI state deterministically (D4 / SC-005). */
  setCountry: (country: Country) => void;
  setManualEdit: (manualEdit: boolean) => void;
  setGooglePlaceId: (id: string | undefined) => void;
  reset: () => void;
}

const initial = {
  selectedCountry: null as Country | null,
  manualEdit: false,
  googlePlaceId: undefined as string | undefined,
};

export const useAddressFormStore = create<AddressFormState>((set) => ({
  ...initial,
  setCountry: (country) =>
    set({ selectedCountry: country, manualEdit: false, googlePlaceId: undefined }),
  setManualEdit: (manualEdit) => set({ manualEdit }),
  setGooglePlaceId: (googlePlaceId) => set({ googlePlaceId }),
  reset: () => set({ ...initial }),
}));
