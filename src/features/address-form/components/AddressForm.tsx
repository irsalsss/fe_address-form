import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateAddress } from "../api/useCreateAddress";
import { useCountryFields } from "../hooks/useCountryFields";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import { addressResolver } from "../schemas";
import { useAddressFormStore } from "../stores/addressFormStore";
import type { Address, Country } from "../types";
import { AddressConfirmation } from "./AddressConfirmation";
import { CountrySelect } from "./CountrySelect";
import { PlacesAutocomplete } from "./PlacesAutocomplete";

/**
 * Address form container. Country selector + (once a country is chosen) the
 * autocomplete capture flow. The inner form is keyed by country so a switch
 * re-initialises form state.
 *
 * US1 scope: country-first guard, autocomplete → confirmation → submit, and
 * graceful degradation when Places is unavailable. The Manually Edit toggle +
 * editable dynamic fields (US2) and saved list (US3) layer on next.
 */
export function AddressForm() {
  const { t } = useTranslation("address-form");
  const selectedCountry = useAddressFormStore((s) => s.selectedCountry);

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>{t("country.label")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <CountrySelect />
        {selectedCountry ? (
          <CountryForm key={selectedCountry} country={selectedCountry} />
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="address-search-disabled">{t("search.label")}</Label>
            <Input id="address-search-disabled" disabled placeholder={t("search.placeholder")} />
            <p role="note" className="text-muted-foreground text-sm">
              {t("search.selectCountryFirst")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CountryForm({ country }: { country: Country }) {
  const { t } = useTranslation("address-form");
  const create = useCreateAddress();
  const fields = useCountryFields(country);
  const setGooglePlaceId = useAddressFormStore((s) => s.setGooglePlaceId);
  const googlePlaceId = useAddressFormStore((s) => s.googlePlaceId);

  const [captured, setCaptured] = useState(false);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);

  const methods = useForm<Address>({
    resolver: addressResolver(country),
    mode: "onSubmit",
  });

  const { inputRef, unavailable } = useGooglePlaces({
    country,
    onResult: ({ fields: mapped, missingRequired: missing, placeId }) => {
      methods.reset(mapped as Address);
      setGooglePlaceId(placeId);
      setMissingRequired(missing);
      setCaptured(true);
    },
  });

  const onSubmit = methods.handleSubmit((values) => {
    create.mutate({ country, fields: values as Address, googlePlaceId });
  });

  return (
    <FormProvider {...methods}>
      <div className="grid gap-4">
        <PlacesAutocomplete inputRef={inputRef} unavailable={unavailable} />
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          {captured && (
            <AddressConfirmation fields={fields} missingRequired={missingRequired} />
          )}
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t("submitting") : t("submit")}
          </Button>
          {create.isError && (
            <p role="alert" className="text-destructive text-sm">
              {t("submitError")}
            </p>
          )}
          {create.isSuccess && (
            <p role="status" className="text-sm text-green-600">
              {t("submitSuccess")}
            </p>
          )}
        </form>
      </div>
    </FormProvider>
  );
}
