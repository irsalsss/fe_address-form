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
import type { FieldDescriptor } from "../config/country-config";
import type { Address } from "../types";

interface DynamicFieldRendererProps {
  fields: FieldDescriptor[];
}

/**
 * Renders the active country's fields generically from metadata descriptors
 * (Constitution I — NO per-country branches; only generic text vs select).
 * Validation errors (zod messages, which are i18n keys, plus any server 422
 * messages mapped onto the field) surface per field with aria association (T035).
 */
export function DynamicFieldRenderer({ fields }: DynamicFieldRendererProps) {
  const { t } = useTranslation("address-form");
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<Address>();

  // Dynamic keys: label keys and zod error messages are i18n keys resolved at runtime.
  const tr = t as unknown as (key: string) => string;
  const fieldErrors = errors as Record<string, { message?: string } | undefined>;

  return (
    <div className="grid gap-4">
      {fields.map((field) => {
        const message = fieldErrors[field.key]?.message;
        const errorId = `${field.key}-error`;
        return (
          <div key={field.key} className="grid gap-1.5">
            <Label htmlFor={field.key}>
              {tr(field.labelKey)}
              {field.required ? (
                <span aria-hidden="true"> *</span>
              ) : (
                <span className="text-muted-foreground"> ({t("optional")})</span>
              )}
            </Label>

            {field.type === "select" ? (
              <Controller
                control={control}
                name={field.key as keyof Address}
                render={({ field: rhf }) => (
                  <Select
                    value={(rhf.value as string | undefined) ?? ""}
                    onValueChange={rhf.onChange}
                  >
                    <SelectTrigger
                      id={field.key}
                      aria-required={field.required}
                      aria-invalid={Boolean(message)}
                      aria-describedby={message ? errorId : undefined}
                    >
                      <SelectValue placeholder={tr(field.labelKey)} />
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
                {...register(field.key as keyof Address)}
              />
            )}

            {message && (
              <p id={errorId} role="alert" className="text-destructive text-sm">
                {tr(message)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
