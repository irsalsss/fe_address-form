import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCountries } from "../api/useCountries";
import { tDynamic } from "../lib/tDynamic";
import { useAddressFormStore } from "../stores/addressFormStore";

/**
 * Country selector — options come exclusively from GET /countries (FR-001); no
 * country list is hardcoded. A failed list disables the dropdown without
 * blocking an already-loaded form (edge case). Labels resolve via local
 * `country.<code>` translations, falling back to the backend name.
 */
export function CountrySelect() {
  const { t } = useTranslation("address-form");
  const selectedCountry = useAddressFormStore((s) => s.selectedCountry);
  const setCountry = useAddressFormStore((s) => s.setCountry);
  const { data: countries, isError } = useCountries();

  return (
    <div className="grid gap-2">
      <Label htmlFor="country-select">{t("country.label")}</Label>
      <Select
        value={selectedCountry ?? ""}
        onValueChange={(value) => setCountry(value)}
        disabled={isError || !countries}
      >
        <SelectTrigger id="country-select" className="w-full">
          <SelectValue placeholder={t("country.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {(countries ?? []).map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {tDynamic(t, `country.${country.code}`, country.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isError && (
        <p role="alert" className="text-destructive text-sm">
          {t("state.error")}
        </p>
      )}
    </div>
  );
}
