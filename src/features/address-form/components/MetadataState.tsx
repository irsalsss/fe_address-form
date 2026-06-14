import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface MetadataStateProps {
  status: "loading" | "error";
  onRetry?: () => void;
}

/**
 * Loading / error+retry presentation for the country metadata fetch (FR-008 /
 * FR-009). The form no longer renders synchronously, so a slow fetch shows a
 * status and a failed fetch offers a Retry that recovers without a page reload.
 */
export function MetadataState({ status, onRetry }: MetadataStateProps) {
  const { t } = useTranslation("address-form");

  if (status === "loading") {
    return (
      <p role="status" className="text-muted-foreground text-sm">
        {t("state.loading")}
      </p>
    );
  }

  return (
    <div role="alert" className="grid gap-2">
      <p className="text-destructive text-sm">{t("state.error")}</p>
      {onRetry && (
        <div>
          <Button type="button" variant="outline" onClick={onRetry}>
            {t("state.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}
