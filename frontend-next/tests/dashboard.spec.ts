import { test, expect } from "@playwright/test";

const TEST_USER = { email: "demo@example.com", password: "password123" };
const API_URL = "http://localhost:3001/api/v1";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post(`${API_URL}/auth/login`, {
      data: TEST_USER,
    });
    const json = await res.json();
    const token = json.data.accessToken;

    await page.goto("/dashboard");
    await page.evaluate(
      (t) => localStorage.setItem("accessToken", t),
      token,
    );
    await page.goto("/dashboard");
  });

  test("should show stat cards after login", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Monthly Spending", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Yearly Cost" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Active Subscriptions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Upcoming Renewals" })).toBeVisible();
  });

  test("should show monthly spending amount", async ({ page }) => {
    await expect(page.locator(".text-3xl.font-bold").first()).toBeVisible();
  });

  test("should show Monthly Spending Trend chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Monthly Spending Trend" })).toBeVisible();
  });

  test("should show Category Breakdown pie chart", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Category Breakdown" })).toBeVisible();
  });

  test("should show Top Subscriptions section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Top Subscriptions" })).toBeVisible();
  });

  test("should show Add Subscription button", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Add Subscription/ })).toBeVisible();
  });

  test("should have working Add Subscription link", async ({ page }) => {
    await page.getByRole("link", { name: /Add Subscription/ }).click();
    await expect(page).toHaveURL(/\/subscriptions\/new/);
  });

  test("should show subscription names in top list", async ({ page }) => {
    await expect(page.getByText("Cloudflare Pro").first()).toBeVisible();
  });

  test("should navigate to analytics from sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /Analytics/i }).first().click();
    await expect(page).toHaveURL(/\/analytics/);
  });
});

test.describe("Dashboard - Unauthenticated", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });
});
