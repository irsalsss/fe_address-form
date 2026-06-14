import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlacesAutocompleteProps {
  inputRef: Ref<HTMLInputElement>;
  unavailable: boolean;
  disabled?: boolean;
}

/**
 * Address search box backed by Google Places. When `unavailable` (no key /
 * script blocked) the input is disabled and a notice points to manual entry
 * (SC-006). Never a dead end.
 */
export function PlacesAutocomplete({ inputRef, unavailable, disabled }: PlacesAutocompleteProps) {
  const { t } = useTranslation("address-form");
  return (
    <div className="grid gap-2">
      <Label htmlFor="address-search">{t("search.label")}</Label>
      <Input
        id="address-search"
        ref={inputRef}
        placeholder={t("search.placeholder")}
        disabled={disabled || unavailable}
        autoComplete="off"
      />
      {unavailable && (
        <p role="note" className="text-muted-foreground text-sm">
          {t("search.unavailable")}
        </p>
      )}
    </div>
  );
}
