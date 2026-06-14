import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { MetadataFieldDef } from "../api/useCountryMetadata";
import { tFieldLabel } from "../lib/tDynamic";
import type { AddressFormValues } from "../types";

interface AddressConfirmationProps {
  fields: MetadataFieldDef[];
  missingRequired?: string[];
}

/**
 * Read-only view of the captured address in the metadata field order. Any
 * required field the autocomplete left unfilled is flagged for completion
 * (spec edge case "partial autocomplete result"). Generic — no per-country
 * branches.
 */
export function AddressConfirmation({ fields, missingRequired = [] }: AddressConfirmationProps) {
  const { t } = useTranslation("address-form");
  const { getValues } = useFormContext<AddressFormValues>();
  const values = getValues();

  return (
    <section className="grid gap-2" aria-label={t("confirm.title")}>
      <h3 className="font-medium">{t("confirm.title")}</h3>
      <dl className="grid gap-1 text-sm">
        {fields.map((field) => {
          const value = values[field.key];
          const missing = missingRequired.includes(field.key);
          return (
            <div key={field.key} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{tFieldLabel(t, field.key, field.label)}</dt>
              <dd className={missing ? "text-destructive" : ""}>
                {value || (missing ? t("confirm.missingRequired") : "—")}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
