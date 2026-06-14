import { create } from "zustand";
import type { AddressFormValues, Country } from "../types";

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
  draft: Partial<AddressFormValues>;
  /** True right after a successful save — drives the top-level success banner. */
  submitSuccess: boolean;
  /** Switching country resets dependent UI state deterministically (D4 / SC-005). */
  setCountry: (country: Country) => void;
  setManualEdit: (manualEdit: boolean) => void;
  setGooglePlaceId: (id: string | undefined) => void;
  setDraft: (draft: Partial<AddressFormValues>) => void;
  /** Successful save: blank everything (country, search, fields) and flag success. */
  completeSubmit: () => void;
  reset: () => void;
}

const initial = {
  selectedCountry: null as Country | null,
  manualEdit: false,
  googlePlaceId: undefined as string | undefined,
  draft: {} as Partial<AddressFormValues>,
  submitSuccess: false,
};

export const useAddressFormStore = create<AddressFormState>((set) => ({
  ...initial,
  setCountry: (country) =>
    set({
      selectedCountry: country,
      manualEdit: false,
      googlePlaceId: undefined,
      // Picking a country starts a fresh entry — drop the prior success banner.
      submitSuccess: false,
    }),
  setManualEdit: (manualEdit) => set({ manualEdit }),
  setGooglePlaceId: (googlePlaceId) => set({ googlePlaceId }),
  setDraft: (draft) => set({ draft }),
  completeSubmit: () => set({ ...initial, draft: {}, submitSuccess: true }),
  reset: () => set({ ...initial, draft: {} }),
}));
