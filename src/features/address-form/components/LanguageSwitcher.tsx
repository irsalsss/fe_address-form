import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

const LANGUAGES = ["en", "id"] as const;
type Lang = (typeof LANGUAGES)[number];

/** Segmented EN/ID toggle that switches the active i18next language. */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation("common");
  const active = (i18n.resolvedLanguage ?? i18n.language).split("-")[0] as Lang;

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className="inline-flex rounded-md border border-input p-0.5"
    >
      {LANGUAGES.map((lng) => {
        const selected = active === lng;
        return (
          <Button
            key={lng}
            type="button"
            size="sm"
            variant={selected ? "default" : "ghost"}
            aria-pressed={selected}
            onClick={() => void i18n.changeLanguage(lng)}
            className={cn("h-8 px-3", !selected && "text-muted-foreground")}
          >
            {t(`language.${lng}`)}
          </Button>
        );
      })}
    </div>
  );
}
