import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddresses } from "../api/useAddresses";
import { tDynamic, tFieldLabel } from "../lib/tDynamic";

/**
 * Saved-address review. Each record is rendered generically from its own
 * `fields` map (no local country config) — labels resolve via `tFieldLabel`
 * (local translation → humanized key), so any supported country's address shows
 * its captured fields with no per-country branches (SC-002/SC-004).
 */
export function SavedAddresses() {
  const { t } = useTranslation("address-form");
  const { data, isLoading, isError } = useAddresses();
  const addresses = data?.addresses ?? [];

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
            {addresses.map((address) => (
              <li key={address.id} className="rounded-md border p-3">
                <p className="mb-2 font-medium">
                  {tDynamic(t, `country.${address.country}`, address.country)}
                </p>
                <dl className="grid gap-1 text-sm">
                  {Object.entries(address.fields).map(([key, value]) => {
                    if (!value) return null;
                    return (
                      <div key={key} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{tFieldLabel(t, key)}</dt>
                        <dd>{value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
