import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { FieldDescriptor } from "../config/country-config";
import type { Address } from "../types";

interface AddressConfirmationProps {
  fields: FieldDescriptor[];
  missingRequired?: string[];
}

/**
 * Read-only view of the captured address in the country's field order. Any
 * required field the autocomplete left unfilled is flagged for completion
 * (spec edge case "partial autocomplete result").
 */
export function AddressConfirmation({ fields, missingRequired = [] }: AddressConfirmationProps) {
  const { t } = useTranslation("address-form");
  const { getValues } = useFormContext<Address>();
  const values = getValues() as unknown as Record<string, string | undefined>;
  // Field label keys are dynamic (driven by the metadata registry).
  const label = t as unknown as (key: string) => string;

  return (
    <section className="grid gap-2" aria-label={t("confirm.title")}>
      <h3 className="font-medium">{t("confirm.title")}</h3>
      <dl className="grid gap-1 text-sm">
        {fields.map((field) => {
          const value = values[field.key];
          const missing = missingRequired.includes(field.key);
          return (
            <div key={field.key} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{label(field.labelKey)}</dt>
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
