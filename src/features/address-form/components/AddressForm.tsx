import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateAddress } from "../api/useCreateAddress";
import { addressResolver } from "../schemas";
import { useAddressFormStore } from "../stores/addressFormStore";
import type { Address, Country } from "../types";
import { CountrySelect } from "./CountrySelect";

/**
 * Address form container (shell). Hosts CountrySelect and the RHF form scope.
 *
 * NOTE: This is the Phase-2 foundational shell — it wires React Hook Form +
 * Zod resolver and the submit path. Autocomplete (US1), the dynamic field
 * renderer + Manually Edit toggle (US2), and the saved list (US3) are layered
 * on in their respective phases. The inner form is keyed by country so a
 * country switch re-initialises form state.
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
        {selectedCountry && (
          <CountryForm key={selectedCountry} country={selectedCountry} />
        )}
      </CardContent>
    </Card>
  );
}

function CountryForm({ country }: { country: Country }) {
  const { t } = useTranslation("address-form");
  const create = useCreateAddress();
  const googlePlaceId = useAddressFormStore((s) => s.googlePlaceId);

  const methods = useForm<Address>({
    resolver: addressResolver(country),
    mode: "onSubmit",
  });

  const onSubmit = methods.handleSubmit((fields) => {
    create.mutate({ country, fields: fields as Address, googlePlaceId });
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="grid gap-4" noValidate>
        {/* Dynamic fields / autocomplete / confirmation are added in US1 + US2 phases. */}
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
    </FormProvider>
  );
}
