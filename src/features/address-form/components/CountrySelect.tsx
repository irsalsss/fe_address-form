import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "../config/country-config";
import { useAddressFormStore } from "../stores/addressFormStore";
import type { Country } from "../types";

/** Country selector — writes the selection to the feature store (FR-001). */
export function CountrySelect() {
  const { t } = useTranslation("address-form");
  const selectedCountry = useAddressFormStore((s) => s.selectedCountry);
  const setCountry = useAddressFormStore((s) => s.setCountry);

  return (
    <div className="grid gap-2">
      <Label htmlFor="country-select">{t("country.label")}</Label>
      <Select
        value={selectedCountry ?? undefined}
        onValueChange={(value) => setCountry(value as Country)}
      >
        <SelectTrigger id="country-select" className="w-full">
          <SelectValue placeholder={t("country.placeholder")} />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country} value={country}>
              {t(`country.${country}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
