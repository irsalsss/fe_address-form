import type common from "./locales/en/common.json";
import type addressForm from "./locales/en/address-form.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: { common: typeof common; "address-form": typeof addressForm };
  }
}
