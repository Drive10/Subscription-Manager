import { register, login } from "@modules/auth/service";
import {
  createSubscription,
  getSubscriptions,
} from "@modules/subscription/service";
import { createPayment } from "@modules/billing/service";
import {
  getMonthlySpend,
  getCategoryBreakdown,
  getSubscriptionStats,
  getUpcomingRenewals,
  getTotalMonthlySpend,
  getUnusedSubscriptions,
} from "@modules/analytics/service";

describe("Analytics Service", () => {
  let user: { id: string; email: string };

  beforeEach(async () => {
    const authResult = await register({
      email: "analytics@example.com",
      password: "password123",
    });
    user = authResult.user;
  });

  describe("getMonthlySpend", () => {
    it("should return monthly spend for last N months", async () => {
      const result = await getMonthlySpend(user.id, 6);
      expect(result.length).toBe(6);
      expect(result[0]).toHaveProperty("month");
      expect(result[0]).toHaveProperty("total");
      expect(result[0]).toHaveProperty("currency");
    });

    it("should return zero for months with no payments", async () => {
      const result = await getMonthlySpend(user.id, 3);
      result.forEach((month) => {
        expect(month.total).toBe(0);
      });
    });
  });

  describe("getCategoryBreakdown", () => {
    it("should return category breakdown", async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        category: "Entertainment",
      });

      const result = await getCategoryBreakdown(user.id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].category).toBe("Entertainment");
    });

    it("should handle uncategorized subscriptions", async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const result = await getCategoryBreakdown(user.id);
      const uncategorized = result.find((r) => r.category === "Uncategorized");
      expect(uncategorized).toBeDefined();
    });
  });

  describe("getSubscriptionStats", () => {
    it("should return subscription counts by status", async () => {
      const result = await getSubscriptionStats(user.id);
      expect(result).toHaveProperty("totalActive");
      expect(result).toHaveProperty("totalPaused");
      expect(result).toHaveProperty("totalCancelled");
      expect(result).toHaveProperty("totalExpired");
    });

    it("should count active subscriptions correctly", async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const result = await getSubscriptionStats(user.id);
      expect(result.totalActive).toBe(1);
    });
  });

  describe("getUpcomingRenewals", () => {
    it("should return upcoming renewals", async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      const result = await getUpcomingRenewals(user.id, 30);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty("daysUntil");
    });

    it("should filter by days parameter", async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      const result = await getUpcomingRenewals(user.id, 2);
      expect(result.length).toBe(0);
    });
  });

  describe("getTotalMonthlySpend", () => {
    it("should calculate total monthly spend", async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      await createSubscription(user.id, {
        name: "Spotify",
        amount: 199,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const result = await getTotalMonthlySpend(user.id);
      expect(result.total).toBe(698);
    });

    it("should handle yearly subscriptions", async () => {
      await createSubscription(user.id, {
        name: "Amazon Prime",
        amount: 1499,
        currency: "INR",
        billingCycle: "yearly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const result = await getTotalMonthlySpend(user.id);
      expect(result.total).toBeCloseTo(124.9, 0);
    });

    it("should return zero for no subscriptions", async () => {
      const result = await getTotalMonthlySpend(user.id);
      expect(result.total).toBe(0);
    });
  });

  describe("getUnusedSubscriptions", () => {
    it("should detect unused subscriptions", async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await createPayment(user.id, {
        subscriptionId: sub.id,
        amount: 499,
        currency: "INR",
        paymentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      });

      const result = await getUnusedSubscriptions(user.id, 30);
      expect(result.length).toBe(1);
    });

    it("should not include recently used subscriptions", async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await createPayment(user.id, {
        subscriptionId: sub.id,
        amount: 499,
        currency: "INR",
        paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });

      const result = await getUnusedSubscriptions(user.id, 30);
      expect(result.length).toBe(0);
    });
  });
});
