/**
 * Last-resort label for a field whose key has neither a local translation nor a
 * backend English label (FR-012). Splits camelCase / snake_case / kebab-case and
 * title-cases the words: `postalCode` → "Postal Code", `address_line_1` →
 * "Address Line 1". Never returns a raw key (SC-006).
 */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camelCase boundary
    .replace(/[_-]+/g, " ") // snake / kebab separators
    .replace(/([a-zA-Z])(\d)/g, "$1 $2") // letter→digit boundary
    .trim()
    .split(/\s+/);

  return words
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
