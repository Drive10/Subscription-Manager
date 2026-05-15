import { test, expect } from "@playwright/test";

const TEST_USER = { email: "demo@example.com", password: "password123" };
const API_URL = "http://localhost:3001/api/v1";

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post(`${API_URL}/auth/login`, { data: TEST_USER });
    const json = await res.json();
    const token = json.data.accessToken;

    await page.goto("/analytics");
    await page.evaluate((t) => localStorage.setItem("accessToken", t), token);
    await page.goto("/analytics");
  });

  test("should show analytics page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
  });

  test("should show stat cards", async ({ page }) => {
    await expect(page.getByText("Monthly Average")).toBeVisible();
    await expect(page.getByText("Yearly Projection")).toBeVisible();
    await expect(page.getByText("Active Subs")).toBeVisible();
    await expect(page.getByText("vs Last Month")).toBeVisible();
  });

  test("should show monthly amount", async ({ page }) => {
    await expect(page.getByText(/₹[0-9,]+/).first()).toBeVisible();
  });

  test("should show Monthly Spending bar chart", async ({ page }) => {
    await expect(page.getByText("Monthly Spending")).toBeVisible();
  });

  test("should show Spending Trend line chart", async ({ page }) => {
    await expect(page.getByText("Spending Trend")).toBeVisible();
  });

  test("should show Category Breakdown pie chart", async ({ page }) => {
    await expect(page.getByText("Category Breakdown")).toBeVisible();
  });

  test("should show Top Categories table", async ({ page }) => {
    await expect(page.getByText("Top Categories")).toBeVisible();
  });

  test("should show category data in Top Categories", async ({ page }) => {
    await expect(page.getByText("Development")).toBeVisible();
    await expect(page.getByText("Entertainment")).toBeVisible();
  });
});

test.describe("Analytics - Unauthenticated", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page).toHaveURL(/login/);
  });
});
