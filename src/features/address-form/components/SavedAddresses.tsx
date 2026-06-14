import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddresses } from "../api/useAddresses";
import { COUNTRY_CONFIGS } from "../config/country-config";

/**
 * Saved-address review (US3 / FR-018). Each record is rendered through its own
 * country's metadata field order, so a US, AUS and IDN address each show their
 * own field set with no dropped or mismatched fields (SC-004).
 */
export function SavedAddresses() {
  const { t } = useTranslation("address-form");
  const { data, isLoading, isError } = useAddresses();
  const addresses = data?.data ?? [];
  const tr = t as unknown as (key: string) => string;

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>{t("saved.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">…</p>
        ) : isError ? (
          <p role="alert" className="text-destructive text-sm">
            {t("saved.error")}
          </p>
        ) : addresses.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("saved.empty")}</p>
        ) : (
          <ul className="grid gap-4">
            {addresses.map((address) => {
              const values = address.fields as unknown as Record<
                string,
                string | undefined
              >;
              return (
                <li key={address.id} className="rounded-md border p-3">
                  <p className="mb-2 font-medium">
                    {tr(`country.${address.country}`)}
                  </p>
                  <dl className="grid gap-1 text-sm">
                    {COUNTRY_CONFIGS[address.country].fields.map((field) => {
                      const value = values[field.key];
                      if (!value) return null;
                      return (
                        <div
                          key={field.key}
                          className="flex justify-between gap-4"
                        >
                          <dt className="text-muted-foreground">
                            {tr(field.labelKey)}
                          </dt>
                          <dd>{value}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
