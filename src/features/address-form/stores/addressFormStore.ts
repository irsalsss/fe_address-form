import { create } from "zustand";
import type { Address, Country } from "../types";

/**
 * Feature UI state (Constitution IV). Server data lives in TanStack Query, form
 * values in React Hook Form — only pure UI/selection state lives here.
 *
 * `draft` mirrors the current form values so that switching country can
 * preserve fields shared between layouts (e.g. line1) while incompatible
 * fields are simply not seeded into the new country's form (D4 / FR-007).
 */
interface AddressFormState {
  selectedCountry: Country | null;
  manualEdit: boolean;
  googlePlaceId?: string;
  draft: Partial<Address>;
  /** Switching country resets dependent UI state deterministically (D4 / SC-005). */
  setCountry: (country: Country) => void;
  setManualEdit: (manualEdit: boolean) => void;
  setGooglePlaceId: (id: string | undefined) => void;
  setDraft: (draft: Partial<Address>) => void;
  reset: () => void;
}

const initial = {
  selectedCountry: null as Country | null,
  manualEdit: false,
  googlePlaceId: undefined as string | undefined,
  draft: {} as Partial<Address>,
};

export const useAddressFormStore = create<AddressFormState>((set) => ({
  ...initial,
  setCountry: (country) =>
    set({ selectedCountry: country, manualEdit: false, googlePlaceId: undefined }),
  setManualEdit: (manualEdit) => set({ manualEdit }),
  setGooglePlaceId: (googlePlaceId) => set({ googlePlaceId }),
  setDraft: (draft) => set({ draft }),
  reset: () => set({ ...initial, draft: {} }),
}));
