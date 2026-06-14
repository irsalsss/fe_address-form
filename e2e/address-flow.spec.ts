import { expect, test } from "@playwright/test";

/**
 * E2E for the dynamic address form (Constitution VI). The backend is mocked via
 * route interception so the flow is self-contained: no real API or Google key.
 * Autocomplete is unavailable without a key, so these cover the manual path,
 * validation, and locale switching (quickstart S2/S3/S7).
 */

const created: unknown[] = [];

test.beforeEach(async ({ page }) => {
  created.length = 0;
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
