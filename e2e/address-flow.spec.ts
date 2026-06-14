import { expect, test } from "@playwright/test";

/**
 * E2E for the dynamic address form (Constitution VI). The backend is mocked via
 * route interception so the flow is self-contained: no real API or Google key.
 * Autocomplete is unavailable without a key, so these cover the manual path,
 * validation, and locale switching (quickstart S2/S3/S7).
 */

const created: unknown[] = [];

const COUNTRIES = [
  { code: "USA", name: "United States", version: "v1" },
  { code: "AUS", name: "Australia", version: "v1" },
  { code: "IDN", name: "Indonesia", version: "v1" },
];

const FIELDS: Record<string, unknown[]> = {
  USA: [
    { key: "line1", label: "Address Line 1", required: true, type: "text", order: 1 },
    { key: "line2", label: "Address Line 2", required: false, type: "text", order: 2 },
    { key: "city", label: "City", required: true, type: "text", order: 3 },
    {
      key: "state",
      label: "State",
      required: true,
      type: "dropdown",
      order: 4,
      options: [
        { value: "CA", label: "California" },
        { value: "NY", label: "New York" },
      ],
    },
    { key: "zip", label: "ZIP Code", required: true, type: "text", order: 5, validation: { length: 5, numeric: true } },
  ],
  AUS: [
    { key: "line1", label: "Address Line 1", required: true, type: "text", order: 1 },
    { key: "suburb", label: "Suburb", required: true, type: "text", order: 2 },
    {
      key: "state",
      label: "State",
      required: true,
      type: "dropdown",
      order: 3,
      options: [{ value: "NSW", label: "New South Wales" }],
    },
    { key: "postcode", label: "Postcode", required: true, type: "text", order: 4, validation: { length: 4, numeric: true } },
  ],
  IDN: [
    { key: "province", label: "Province", required: true, type: "text", order: 1 },
    { key: "city", label: "City / Regency", required: true, type: "text", order: 2 },
    { key: "postalCode", label: "Postal Code", required: true, type: "text", order: 3, validation: { length: 5, numeric: true } },
    { key: "street", label: "Street Address", required: true, type: "text", order: 4 },
  ],
};

test.beforeEach(async ({ page }) => {
  created.length = 0;
  // Country metadata is fetched at runtime (no local config) — mock both endpoints.
  await page.route("**/countries", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(COUNTRIES) });
  });
  await page.route("**/countries/*/fields", async (route) => {
    const segments = new URL(route.request().url()).pathname.split("/");
    const code = segments[segments.length - 2] ?? "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code, name: code, version: "v1", fields: FIELDS[code] ?? [] }),
    });
  });
  await page.route("**/addresses", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      const record = { id: "e2e-1", createdAt: new Date().toISOString(), ...body };
      created.push(record);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(record) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: created }),
    });
  });
});

async function selectCountry(page: import("@playwright/test").Page, label: string) {
  // The country trigger is the first combobox on the page (state appears later).
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: label }).click();
}

test("manual entry: select country, fill fields, submit", async ({ page }) => {
  await page.goto("/onboarding/address");
  await selectCountry(page, "United States");
  await page.getByRole("button", { name: /manually edit/i }).click();

  await page.getByLabel(/Address Line 1/i).fill("1600 Amphitheatre Pkwy");
  await page.getByLabel(/City/i).fill("Mountain View");
  // Radix Select typeahead avoids scrolling the long state list.
  await page.getByLabel(/State/i).click();
  await page.keyboard.type("CA");
  await page.keyboard.press("Enter");
  await page.getByLabel(/ZIP Code/i).fill("94043");

  await page.getByRole("button", { name: /save address/i }).click();

  await expect(page.getByText("Address saved.")).toBeVisible();
});

test("validation: empty submit surfaces per-field errors", async ({ page }) => {
  await page.goto("/onboarding/address");
  await selectCountry(page, "United States");
  await page.getByRole("button", { name: /manually edit/i }).click();
  await page.getByRole("button", { name: /save address/i }).click();

  await expect(page.getByText("This field is required").first()).toBeVisible();
});

test("i18n: Bahasa Indonesia labels render", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("i18nextLng", "id"));
  await page.goto("/onboarding/address");

  await expect(page.getByText("Negara").first()).toBeVisible();
  // Localized country option, then the localized Manually Edit control.
  await selectCountry(page, "Amerika Serikat");
  await expect(page.getByRole("button", { name: "Edit Manual" })).toBeVisible();
});
