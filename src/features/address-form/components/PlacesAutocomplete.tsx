import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Prediction {
  place_id: string;
  description: string;
}

interface PlacesAutocompleteProps {
  query: string;
  onQueryChange: (value: string) => void;
  predictions: Prediction[];
  onSelect: (placeId: string) => void;
  loading: boolean;
  unavailable: boolean;
  disabled?: boolean;
}

/**
 * Address search box backed by Google Places predictions. Keystrokes are
 * debounced upstream in `useGooglePlaces`; this renders the controlled input and
 * the prediction list. When `unavailable` (no key / script blocked) the input is
 * disabled and a notice points to manual entry (SC-006). Never a dead end.
 */
export function PlacesAutocomplete({
  query,
  onQueryChange,
  predictions,
  onSelect,
  loading,
  unavailable,
  disabled,
}: PlacesAutocompleteProps) {
  const { t } = useTranslation("address-form");
  const listId = useId();
  const isDisabled = disabled || unavailable;
  const showList = !isDisabled && predictions.length > 0;

  return (
    <div className="grid gap-2">
      <Label htmlFor="address-search">{t("search.label")}</Label>
      <div className="relative">
        <Input
          id="address-search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t("search.placeholder")}
          disabled={isDisabled}
          autoComplete="off"
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            aria-label={t("search.label")}
            className="bg-popover absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
          >
            {predictions.map((p) => (
              <li key={p.place_id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => onSelect(p.place_id)}
                  className="hover:bg-accent hover:text-accent-foreground w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors"
                >
                  {p.description}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {loading && (
        <p role="status" className="text-muted-foreground text-sm">
          {t("search.searching")}
        </p>
      )}
      {unavailable && (
        <p role="note" className="text-muted-foreground text-sm">
          {t("search.unavailable")}
        </p>
      )}
    </div>
  );
}
