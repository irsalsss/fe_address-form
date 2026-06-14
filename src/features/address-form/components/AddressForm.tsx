import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/shared/api/http";
import { useCreateAddress } from "../api/useCreateAddress";
import { COUNTRY_CONFIGS } from "../config/country-config";
import { useCountryFields } from "../hooks/useCountryFields";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import { addressResolver } from "../schemas";
import { useAddressFormStore } from "../stores/addressFormStore";
import type { Address, Country } from "../types";
import { AddressConfirmation } from "./AddressConfirmation";
import { CountrySelect } from "./CountrySelect";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";
import { PlacesAutocomplete } from "./PlacesAutocomplete";

/**
 * Address form container. Country selector + (once a country is chosen) the
 * capture flow: autocomplete → confirmation, with a Manually Edit toggle into
 * editable country-specific fields. Switching country re-initialises the form,
 * preserving only fields shared between layouts (D4 / FR-007 / SC-005).
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

/** Seed a new country's form from the cross-country draft, keeping only keys that exist in this layout. */
function seedFromDraft(country: Country): Partial<Address> {
  const draft = useAddressFormStore.getState().draft as Record<string, unknown>;
  const seeded: Record<string, unknown> = {};
  for (const field of COUNTRY_CONFIGS[country].fields) {
    if (draft[field.key] !== undefined) seeded[field.key] = draft[field.key];
  }
  return seeded as Partial<Address>;
}

function CountryForm({ country }: { country: Country }) {
  const { t } = useTranslation("address-form");
  const create = useCreateAddress();
  const fields = useCountryFields(country);
  const setGooglePlaceId = useAddressFormStore((s) => s.setGooglePlaceId);
  const googlePlaceId = useAddressFormStore((s) => s.googlePlaceId);
  const setDraft = useAddressFormStore((s) => s.setDraft);
  const manualEdit = useAddressFormStore((s) => s.manualEdit);
  const setManualEdit = useAddressFormStore((s) => s.setManualEdit);

  const [captured, setCaptured] = useState(false);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);

  // Every field defaults to "" so inputs/selects are controlled from first render.
  const emptyValues = useMemo(() => {
    const base: Record<string, string> = {};
    for (const field of COUNTRY_CONFIGS[country].fields) base[field.key] = "";
    return base as unknown as Address;
  }, [country]);

  // Preserve fields shared with the previous country (e.g. line1).
  const initialValues = useMemo(
    () => ({ ...emptyValues, ...seedFromDraft(country) }) as Address,
    [country, emptyValues],
  );

  const methods = useForm<Address>({
    resolver: addressResolver(country),
    mode: "onSubmit",
    defaultValues: initialValues,
  });

  // Mirror form values into the store so a country switch can carry shared fields.
  useEffect(() => {
    const subscription = methods.watch((values) => setDraft(values as Partial<Address>));
    return () => subscription.unsubscribe();
  }, [methods, setDraft]);

  const { query, setQuery, predictions, selectPrediction, loading, unavailable } = useGooglePlaces(
    {
      country,
      onResult: ({ fields: mapped, missingRequired: missing, placeId }) => {
        methods.reset(mapped as Address);
        setGooglePlaceId(placeId);
        setMissingRequired(missing);
        setCaptured(true);
      },
    },
  );

  const onSubmit = methods.handleSubmit((values) => {
    create.mutate(
      { country, fields: values as Address, googlePlaceId },
      {
        // Surface server-side field errors (422) on the matching fields (FR-017).
        onError: (error) => {
          if (error instanceof ApiError) {
            for (const fieldError of error.fieldErrors) {
              methods.setError(fieldError.field as keyof Address, {
                type: "server",
                message: fieldError.message,
              });
            }
          }
        },
        // Clear the form after a successful save so the same address can't be re-posted.
        onSuccess: () => {
          methods.reset(emptyValues);
          setGooglePlaceId(undefined);
          setCaptured(false);
          setMissingRequired([]);
        },
      },
    );
  });

  return (
    <FormProvider {...methods}>
      <div className="grid gap-4">
        <PlacesAutocomplete
          query={query}
          onQueryChange={setQuery}
          predictions={predictions}
          onSelect={selectPrediction}
          loading={loading}
          unavailable={unavailable}
        />
        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              aria-pressed={manualEdit}
              onClick={() => setManualEdit(!manualEdit)}
            >
              {t("manualEdit")}
            </Button>
          </div>

          {manualEdit ? (
            <DynamicFieldRenderer fields={fields} />
          ) : (
            captured && (
              <AddressConfirmation fields={fields} missingRequired={missingRequired} />
            )
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
