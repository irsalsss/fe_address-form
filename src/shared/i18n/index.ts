import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enCommon from "./locales/en/common.json";
import idCommon from "./locales/id/common.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      id: { common: idCommon },
    },
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
