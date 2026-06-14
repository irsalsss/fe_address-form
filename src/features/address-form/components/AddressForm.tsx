import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/shared/api/http";
import { useCountries } from "../api/useCountries";
import { useCountryMetadata, type MetadataFieldDef } from "../api/useCountryMetadata";
import { useCreateAddress } from "../api/useCreateAddress";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import { buildResolver } from "../schemas/buildSchema";
import { useAddressFormStore } from "../stores/addressFormStore";
import type { AddressFormValues } from "../types";
import { AddressConfirmation } from "./AddressConfirmation";
import { CountrySelect } from "./CountrySelect";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";
import { MetadataState } from "./MetadataState";
import { PlacesAutocomplete } from "./PlacesAutocomplete";

/**
 * Address form container. Country selector + (once a country is chosen) the
 * metadata-driven capture flow. The field layout, options, and validation come
 * entirely from the backend (FR-002/004) — there is no local country config.
 */
export function AddressForm() {
  const { t } = useTranslation("address-form");
  const selectedCountry = useAddressFormStore((s) => s.selectedCountry);
  const submitSuccess = useAddressFormStore((s) => s.submitSuccess);

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>{t("country.label")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {/* Success lives here (not in the form): a successful save blanks the
            country, which unmounts the form before any inline message shows. */}
        {submitSuccess && !selectedCountry && (
          <p role="status" className="text-sm text-green-600">
            {t("submitSuccess")}
          </p>
        )}
        <CountrySelect />
        {selectedCountry ? (
          <CountryFormGate country={selectedCountry} />
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

/**
 * Fetches the selected country's metadata and gates the form on it: loading and
 * error/retry states stand in until the layout is available (FR-008/009). The
 * form no longer renders synchronously.
 */
function CountryFormGate({ country }: { country: string }) {
  const { data: countries } = useCountries();
  const version = countries?.find((c) => c.code === country)?.version;
  const { data, isPending, isError, refetch } = useCountryMetadata(country, version);

  if (isPending) return <MetadataState status="loading" />;
  if (isError || !data) return <MetadataState status="error" onRetry={() => void refetch()} />;

  // `key` re-initialises the form (and its draft seeding) on country change.
  return <CountryForm key={country} country={country} fields={data.fields} />;
}

/**
 * Seed a new country's form from the cross-country draft, keeping only text keys
 * that exist in this layout. Dropdown fields are skipped: a shared key name does
 * NOT imply a shared option domain (a US state code is not a valid AUS state),
 * so carrying it over produces an invalid, unselectable value (FR-015).
 */
function seedFromDraft(fields: MetadataFieldDef[]): AddressFormValues {
  const draft = useAddressFormStore.getState().draft;
  const seeded: AddressFormValues = {};
  for (const field of fields) {
    if (field.type === "dropdown") continue;
    const value = draft[field.key];
    if (value !== undefined) seeded[field.key] = value;
  }
  return seeded;
}

function CountryForm({ country, fields }: { country: string; fields: MetadataFieldDef[] }) {
  const { t } = useTranslation("address-form");
  const create = useCreateAddress();
  const setGooglePlaceId = useAddressFormStore((s) => s.setGooglePlaceId);
  const googlePlaceId = useAddressFormStore((s) => s.googlePlaceId);
  const setDraft = useAddressFormStore((s) => s.setDraft);
  const manualEdit = useAddressFormStore((s) => s.manualEdit);
  const setManualEdit = useAddressFormStore((s) => s.setManualEdit);
  const completeSubmit = useAddressFormStore((s) => s.completeSubmit);

  const [captured, setCaptured] = useState(false);
  const [missingRequired, setMissingRequired] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const resolver = useMemo(() => buildResolver(fields), [fields]);

  // Every field defaults to "" so inputs/selects are controlled from first render.
  const emptyValues = useMemo(() => {
    const base: AddressFormValues = {};
    for (const field of fields) base[field.key] = "";
    return base;
  }, [fields]);

  // Preserve fields shared with the previous country (e.g. line1).
  const initialValues = useMemo(
    () => ({ ...emptyValues, ...seedFromDraft(fields) }),
    [emptyValues, fields],
  );

  const methods = useForm<AddressFormValues>({
    resolver,
    mode: "onSubmit",
    defaultValues: initialValues,
  });

  // Mirror form values into the store so a country switch can carry shared fields.
  useEffect(() => {
    const subscription = methods.watch((values) =>
      setDraft(values as Partial<AddressFormValues>),
    );
    return () => subscription.unsubscribe();
  }, [methods, setDraft]);

  const { query, setQuery, predictions, selectPrediction, loading, unavailable } = useGooglePlaces({
    country,
    fields,
    onResult: ({ fields: mapped, missingRequired: missing, placeId }) => {
      methods.reset({ ...emptyValues, ...stripUndefined(mapped) });
      setGooglePlaceId(placeId);
      setMissingRequired(missing);
      setCaptured(true);
    },
  });

  const onSubmit = methods.handleSubmit((values) => {
    setFormError(null);
    create.mutate(
      { country, fields: values, googlePlaceId },
      {
        // Surface server-side field errors on matching fields (FR-011).
        onError: (error) => {
          if (error instanceof ApiError) {
            const known = new Set(fields.map((f) => f.key));
            const unmatched: string[] = [...error.formErrors];
            for (const fieldError of error.fieldErrors) {
              if (known.has(fieldError.field)) {
                methods.setError(fieldError.field, {
                  type: "server",
                  message: fieldError.message,
                });
              } else {
                unmatched.push(fieldError.message);
              }
            }
            if (unmatched.length > 0) setFormError(unmatched.join(" "));
          }
        },
        // Full reset on success: blank country + search + fields so the same
        // address can't be re-posted. This unmounts the form (selectedCountry
        // → null); success is shown by the banner in AddressForm.
        onSuccess: () => {
          completeSubmit();
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
            captured && <AddressConfirmation fields={fields} missingRequired={missingRequired} />
          )}

          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? t("submitting") : t("submit")}
          </Button>
          {(create.isError || formError) && (
            <p role="alert" className="text-destructive text-sm">
              {formError ?? t("submitError")}
            </p>
          )}
        </form>
      </div>
    </FormProvider>
  );
}

/** Drop undefined values so reset doesn't turn controlled inputs uncontrolled. */
function stripUndefined(values: Record<string, string | undefined>): AddressFormValues {
  const out: AddressFormValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}
