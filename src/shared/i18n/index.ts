import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "./locales/en/common.json";
import idCommon from "./locales/id/common.json";
import enAddressForm from "./locales/en/address-form.json";
import idAddressForm from "./locales/id/address-form.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, "address-form": enAddressForm },
      id: { common: idCommon, "address-form": idAddressForm },
    },
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
