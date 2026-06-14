import { useEffect, useRef, useState } from "react";
import { env } from "@/shared/config/env";
import type { Country } from "../types";
import {
  mapPlaceToFields,
  type MappedPlace,
  type PlaceAddressComponent,
} from "./usePlaceMapping";

/* Minimal typings for the bits of the Google Places API we use (no `any`). */
interface GooglePlace {
  address_components?: PlaceAddressComponent[];
  place_id?: string;
}
interface GoogleAutocomplete {
  addListener(event: string, handler: () => void): void;
  getPlace(): GooglePlace;
}
interface GooglePlacesLib {
  Autocomplete: new (
    input: HTMLInputElement,
    opts?: { fields?: string[]; types?: string[] },
  ) => GoogleAutocomplete;
}
interface GoogleNamespace {
  maps?: { places?: GooglePlacesLib };
}
declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadPlacesScript(apiKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Allow a later mount to retry instead of being stuck unavailable forever.
      scriptPromise = null;
      reject(new Error("Google Maps script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface UseGooglePlacesOptions {
  country: Country;
  enabled?: boolean;
  onResult: (result: MappedPlace) => void;
}

/**
 * Lazy-loads the Google Places script once and binds Autocomplete to the input.
 * `unavailable` is true when no API key is configured or the script fails —
 * callers degrade gracefully to manual entry (Constitution VIII / SC-006).
 */
export function useGooglePlaces({ country, enabled = true, onResult }: UseGooglePlacesOptions) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [unavailable, setUnavailable] = useState(!env.VITE_GOOGLE_PLACES_API_KEY);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const apiKey = env.VITE_GOOGLE_PLACES_API_KEY;
    // Initial `unavailable` already reflects a missing key — nothing to do here.
    if (!apiKey || !enabled || !inputRef.current) return;

    let cancelled = false;
    loadPlacesScript(apiKey)
      .then(() => {
        const places = window.google?.maps?.places;
        if (cancelled || !inputRef.current || !places) {
          if (!places) setUnavailable(true);
          return;
        }
        const autocomplete = new places.Autocomplete(inputRef.current, {
          fields: ["address_components", "place_id"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          onResultRef.current(
            mapPlaceToFields(country, place.address_components ?? [], place.place_id),
          );
        });
      })
      .catch(() => setUnavailable(true));

    return () => {
      cancelled = true;
    };
  }, [country, enabled]);

  return { inputRef, unavailable };
}
