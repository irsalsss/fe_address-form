import { useCallback, useEffect, useRef, useState } from "react";
import { env } from "@/shared/config/env";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { MetadataFieldDef } from "../api/useCountryMetadata";
import type { Country } from "../types";
import {
  mapPlaceToFields,
  type MappedPlace,
  type PlaceAddressComponent,
} from "./usePlaceMapping";

/* Minimal typings for the bits of the Google Places API we use (no `any`). */
interface PlacePrediction {
  place_id: string;
  description: string;
}
interface PlaceDetails {
  address_components?: PlaceAddressComponent[];
  place_id?: string;
}
interface AutocompleteService {
  getPlacePredictions(
    request: { input: string; componentRestrictions?: { country: string } },
    callback: (predictions: PlacePrediction[] | null) => void,
  ): void;
}
interface PlacesService {
  getDetails(
    request: { placeId: string; fields: string[] },
    callback: (place: PlaceDetails | null) => void,
  ): void;
}
interface GooglePlacesLib {
  AutocompleteService: new () => AutocompleteService;
  PlacesService: new (attrContainer: HTMLElement) => PlacesService;
}
interface GoogleNamespace {
  maps?: { places?: GooglePlacesLib };
}
declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

/** Our country codes → ISO 3166-1 alpha-2 for Places `componentRestrictions`. */
const COUNTRY_TO_ISO: Record<string, string> = { USA: "us", AUS: "au", IDN: "id" };

/** ISO code for Places restriction; falls back to a lowercased code for unknown countries. */
function isoFor(country: Country): string {
  return COUNTRY_TO_ISO[country] ?? country.slice(0, 2).toLowerCase();
}

/** Min input length before we bother the predictions API. */
const MIN_QUERY_LENGTH = 3;
/** Keystroke debounce — keeps us well under quota and avoids per-letter requests. */
const QUERY_DEBOUNCE_MS = 300;

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
  /** Active country's metadata fields — used to key the mapped result + missingRequired. */
  fields: MetadataFieldDef[];
  enabled?: boolean;
  onResult: (result: MappedPlace) => void;
}

export interface UseGooglePlacesReturn {
  /** Current search text — drive a controlled input with this. */
  query: string;
  setQuery: (value: string) => void;
  /** Predictions for the debounced query (empty until ≥3 chars + a response). */
  predictions: PlacePrediction[];
  /** Resolve a prediction to full address details and emit via `onResult`. */
  selectPrediction: (placeId: string) => void;
  /** A predictions request is in flight. */
  loading: boolean;
  /** True when no API key is configured or the script fails (degrade to manual). */
  unavailable: boolean;
}

/**
 * Lazy-loads the Google Places script and drives a manual autocomplete:
 * keystrokes are debounced ({@link useDebounce}) before hitting
 * `AutocompleteService.getPlacePredictions`, and a chosen prediction is resolved
 * with `PlacesService.getDetails`. `unavailable` is true when no API key is
 * configured or the script fails — callers degrade gracefully to manual entry
 * (Constitution VIII / SC-006).
 */
export function useGooglePlaces({
  country,
  fields,
  enabled = true,
  onResult,
}: UseGooglePlacesOptions): UseGooglePlacesReturn {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(!env.VITE_GOOGLE_PLACES_API_KEY);

  const autocompleteRef = useRef<AutocompleteService | null>(null);
  const placesRef = useRef<PlacesService | null>(null);
  const onResultRef = useRef(onResult);
  const fieldsRef = useRef(fields);
  const debouncedQuery = useDebounce(query, QUERY_DEBOUNCE_MS);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  // Load the script + build the services once.
  useEffect(() => {
    const apiKey = env.VITE_GOOGLE_PLACES_API_KEY;
    // Initial `unavailable` already reflects a missing key — nothing to do here.
    if (!apiKey || !enabled) return;

    let cancelled = false;
    loadPlacesScript(apiKey)
      .then(() => {
        const places = window.google?.maps?.places;
        if (cancelled) return;
        if (!places) {
          setUnavailable(true);
          return;
        }
        autocompleteRef.current = new places.AutocompleteService();
        // PlacesService needs a DOM node; a detached div is fine for getDetails.
        placesRef.current = new places.PlacesService(document.createElement("div"));
        setReady(true);
      })
      .catch(() => setUnavailable(true));

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Fetch predictions for the (debounced) query, restricted to the active country.
  useEffect(() => {
    const service = autocompleteRef.current;
    const input = debouncedQuery.trim();
    if (!ready || !service || input.length < MIN_QUERY_LENGTH) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    service.getPlacePredictions(
      { input, componentRestrictions: { country: isoFor(country) } },
      (results) => {
        if (cancelled) return;
        setPredictions(results ?? []);
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, country, ready]);

  const selectPrediction = useCallback(
    (placeId: string) => {
      const service = placesRef.current;
      if (!service) return;
      service.getDetails(
        { placeId, fields: ["address_components", "place_id"] },
        (place) => {
          if (!place) return;
          onResultRef.current(
            mapPlaceToFields(
              country,
              place.address_components ?? [],
              fieldsRef.current,
              place.place_id,
            ),
          );
          setPredictions([]);
        },
      );
    },
    [country],
  );

  return { query, setQuery, predictions, selectPrediction, loading, unavailable };
}
