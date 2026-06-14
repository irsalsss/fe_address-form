import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MetadataFieldDef } from "../api/useCountryMetadata";
import { tDynamic, tFieldLabel } from "../lib/tDynamic";
import type { AddressFormValues } from "../types";

interface DynamicFieldRendererProps {
  fields: MetadataFieldDef[];
}

/**
 * Renders the active country's fields generically from backend metadata
 * (Constitution I — NO per-country branches; only generic text vs dropdown).
 * Labels resolve via `tFieldLabel` (local → backend label → humanized key) and
 * validation messages via `tDynamic` (with `{ count }` for length rules).
 * Errors surface per field with aria association.
 */
export function DynamicFieldRenderer({ fields }: DynamicFieldRendererProps) {
  const { t } = useTranslation("address-form");
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddressFormValues>();

  return (
    <div className="grid gap-4">
      {fields.map((field) => {
        const label = tFieldLabel(t, field.key, field.label);
        const error = errors[field.key];
        const rawMessage = error?.message;
        // Client (zod) messages are i18n keys → resolve via tDynamic. Server
        // errors (type "server") are already human strings → show verbatim.
        const message =
          typeof rawMessage !== "string"
            ? undefined
            : error?.type === "server"
              ? rawMessage
              : tDynamic(t, rawMessage, undefined, {
                  count:
                    rawMessage === "errors.maxLength"
                      ? field.validation?.maxLength
                      : field.validation?.length,
                });
        const errorId = `${field.key}-error`;

        return (
          <div key={field.key} className="grid gap-1.5">
            <Label htmlFor={field.key}>
              {label}
              {field.required ? (
                <span aria-hidden="true"> *</span>
              ) : (
                <span className="text-muted-foreground"> ({t("optional")})</span>
              )}
            </Label>

            {field.type === "dropdown" ? (
              <Controller
                control={control}
                name={field.key}
                render={({ field: rhf }) => (
                  <Select value={rhf.value ?? ""} onValueChange={rhf.onChange}>
                    <SelectTrigger
                      id={field.key}
                      aria-required={field.required}
                      aria-invalid={Boolean(message)}
                      aria-describedby={message ? errorId : undefined}
                    >
                      <SelectValue placeholder={label} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input
                id={field.key}
                aria-required={field.required}
                aria-invalid={Boolean(message)}
                aria-describedby={message ? errorId : undefined}
                {...register(field.key)}
              />
            )}

            {message && (
              <p id={errorId} role="alert" className="text-destructive text-sm">
                {message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
