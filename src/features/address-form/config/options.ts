/**
 * Dropdown option lists for select fields.
 *
 * Option values/labels are proper nouns or standard codes (US state codes,
 * Indonesian province names) and are intentionally NOT i18n keys — they read
 * the same across locales. Field *labels* (City, State, …) are localized via
 * the descriptor `labelKey`; option labels are plain display strings.
 */
export interface FieldOption {
  value: string;
  label: string;
}

export const US_STATES: FieldOption[] = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
].map((code) => ({ value: code, label: code }));

export const AUS_STATES: FieldOption[] = [
  "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT",
].map((code) => ({ value: code, label: code }));

export const IDN_PROVINCES: FieldOption[] = [
  "Aceh", "Sumatra Utara", "Sumatra Barat", "Riau", "Jambi",
  "Sumatra Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung",
  "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah",
  "DI Yogyakarta", "Jawa Timur", "Banten", "Bali", "Nusa Tenggara Barat",
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan",
  "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat", "Maluku",
  "Maluku Utara", "Papua", "Papua Barat",
].map((name) => ({ value: name, label: name }));
