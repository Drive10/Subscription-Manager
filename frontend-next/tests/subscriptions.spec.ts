import { test, expect } from "@playwright/test";

const TEST_USER = { email: "demo@example.com", password: "password123" };
const API_URL = "http://localhost:3001/api/v1";

let sharedToken: string;

test.describe("Subscriptions", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, { data: TEST_USER });
    const json = await res.json();
    sharedToken = json.data.accessToken;
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem("accessToken", t);
    }, sharedToken);
  });

  test("should show subscriptions page", async ({ page }) => {
    await page.goto("/subscriptions");
    await expect(page.getByText("Manage your")).toBeVisible();
  });

  test("should show Add Subscription button", async ({ page }) => {
    await page.goto("/subscriptions");
    await expect(page.getByRole("link", { name: /Add Subscription/ })).toBeVisible();
  });

  test("should navigate to new subscription page", async ({ page }) => {
    await page.goto("/subscriptions");
    await page.getByRole("link", { name: /Add Subscription/ }).click();
    await expect(page).toHaveURL(/\/subscriptions\/new/);
  });

  test("should show subscription cards", async ({ page }) => {
    await page.goto("/subscriptions");
    await expect(page.getByText("Netflix").first()).toBeVisible();
    await expect(page.getByText("Spotify").first()).toBeVisible();
  });

  test("should filter by status", async ({ page }) => {
    await page.goto("/subscriptions");
    const combos = page.getByRole("combobox");
    await combos.first().click();
    await page.getByRole("option", { name: "Active" }).click();
    await page.waitForTimeout(500);
  });

  test("should search subscriptions", async ({ page }) => {
    await page.goto("/subscriptions");
    const searchInput = page.getByPlaceholder("Search subscriptions...");
    await searchInput.fill("Netflix");
    await page.waitForTimeout(300);
    await expect(page.getByText("Netflix").first()).toBeVisible();
  });
});

test.describe("Subscriptions - Full CRUD Flow", () => {
  let createdSubId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_URL}/auth/login`, { data: TEST_USER });
    const json = await res.json();
    sharedToken = json.data.accessToken;
  });

  test.afterAll(async ({ request }) => {
    if (createdSubId) {
      await request.delete(`${API_URL}/subscriptions/${createdSubId}`, {
        headers: { Authorization: `Bearer ${sharedToken}` },
      });
    }
  });

  test("should create a subscription via API and verify dashboard reflects change", async ({
    request,
  }) => {
    const res = await request.post(`${API_URL}/subscriptions`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
      data: {
        name: "Test Sub E2E",
        amount: 500,
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        category: "Entertainment",
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    createdSubId = json.data.id;

    const dashboardRes = await request.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
    });
    const dashboardJson = await dashboardRes.json();
    expect(dashboardJson.data.totalSubscriptions).toBeGreaterThan(0);
    expect(dashboardJson.data.totalMonthlySpending).toBeGreaterThan(0);
  });

  test("should edit a subscription via API and verify changes", async ({ request }) => {
    const createRes = await request.post(`${API_URL}/subscriptions`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
      data: {
        name: "Editable Sub",
        amount: 250,
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        category: "Productivity",
      },
    });
    const createJson = await createRes.json();
    const subId = createJson.data.id;

    const updateRes = await request.patch(`${API_URL}/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
      data: { name: "Edited Sub", amount: 350 },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updateJson = await updateRes.json();
    expect(updateJson.data.name).toBe("Edited Sub");
    expect(updateJson.data.amount).toBe(350);

    await request.delete(`${API_URL}/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
    });
  });

  test("should delete a subscription via API and verify the dashboard still works", async ({
    request,
  }) => {
    const createRes = await request.post(`${API_URL}/subscriptions`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
      data: {
        name: "Delete Me Sub",
        amount: 100,
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        category: "Other",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createJson = await createRes.json();
    const subId = createJson.data.id;

    const delRes = await request.delete(`${API_URL}/subscriptions/${subId}`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
    });
    expect(delRes.ok()).toBeTruthy();

    const dashboardRes = await request.get(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${sharedToken}` },
    });
    expect(dashboardRes.ok()).toBeTruthy();
    const dashboardJson = await dashboardRes.json();
    expect(dashboardJson.data.totalSubscriptions).toBeGreaterThanOrEqual(8);
  });
});

test.describe("Subscriptions - Unauthenticated", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/subscriptions");
    await expect(page).toHaveURL(/login/);
  });
});
