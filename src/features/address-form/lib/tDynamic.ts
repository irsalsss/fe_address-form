import type { TFunction } from "i18next";
import { humanizeKey } from "./humanizeKey";

/**
 * The address-form `t`. Its key param is the typed resource key union, but these
 * helpers resolve RUNTIME-dynamic keys (metadata field keys, message keys) not
 * known at compile time — so internally we treat `t` as a loose callable. This
 * is the single, contained cast for dynamic translation.
 */
export type DynamicT = TFunction<"address-form">;
type LooseT = (key: string, options?: Record<string, unknown>) => unknown;

const SENTINEL = "__TDYNAMIC_MISSING__";

/**
 * Resolve a dynamic i18n key whose existence is not known at compile time
 * (field labels keyed by metadata `key`, validation message keys). Resolution
 * order (FR-012 / FR-013):
 *   1. local translation for `key` (via i18next `defaultValue`)
 *   2. `fallback` (e.g. the backend-provided English label)
 *   3. `humanizeKey` of the key's last segment — never a raw key (SC-006)
 *
 * `values` is forwarded to i18next for interpolation (e.g. `{ count }`).
 */
export function tDynamic(
  t: DynamicT,
  key: string,
  fallback?: string,
  values?: Record<string, unknown>,
): string {
  const tt = t as unknown as LooseT;
  const resolved = tt(key, { defaultValue: SENTINEL, ...(values ?? {}) });
  if (typeof resolved === "string" && resolved !== SENTINEL) return resolved;
  if (fallback && fallback.trim() !== "") return fallback;
  const lastSegment = key.split(".").pop() ?? key;
  return humanizeKey(lastSegment);
}

/** Convenience for field labels: tries `fields.<key>`, then backend label, then humanize. */
export function tFieldLabel(t: DynamicT, fieldKey: string, backendLabel?: string): string {
  return tDynamic(t, `fields.${fieldKey}`, backendLabel ?? humanizeKey(fieldKey));
}
