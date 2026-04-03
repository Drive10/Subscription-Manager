import { register, login } from "@modules/auth/service";
import {
  createSubscription,
  getSubscriptions,
} from "@modules/subscription/service";
import {
  createReminder,
  getReminders,
  getPendingReminders,
  createRemindersForSubscription,
} from "@modules/reminder/service";
import { ValidationError, NotFoundError } from "@shared/errors";

describe("Edge Cases", () => {
  let user: { id: string; email: string };

  beforeEach(async () => {
    const authResult = await register({
      email: "edge@example.com",
      password: "password123",
    });
    user = authResult.user;
  });

  describe("Timezone handling", () => {
    it("should handle subscriptions across timezones", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: futureDate,
      });

      const fetched = await getSubscriptions(user.id);
      expect(fetched[0].nextBillingDate.getTime()).toBe(futureDate.getTime());
    });
  });

  describe("Leap year billing", () => {
    it("should handle February 29th correctly", async () => {
      const leapYearDate = new Date("2024-02-29T00:00:00Z");

      const sub = await createSubscription(user.id, {
        name: "Test",
        amount: 100,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: leapYearDate,
      });

      expect(sub.nextBillingDate).toBeDefined();
    });
  });

  describe("Currency handling", () => {
    it("should handle multiple currencies", async () => {
      await createSubscription(user.id, {
        name: "Netflix India",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await createSubscription(user.id, {
        name: "Spotify US",
        amount: 999,
        currency: "USD",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const subs = await getSubscriptions(user.id);
      expect(subs.length).toBe(2);
    });

    it("should use default currency when not specified", async () => {
      const sub = await createSubscription(user.id, {
        name: "Test Sub",
        amount: 100,
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(sub.currency).toBe("INR");
    });
  });

  describe("Billing cycle variations", () => {
    it("should handle daily billing", async () => {
      const sub = await createSubscription(user.id, {
        name: "Daily News",
        amount: 10,
        currency: "INR",
        billingCycle: "daily",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      expect(sub.billingCycle).toBe("daily");
    });

    it("should handle custom billing interval", async () => {
      const sub = await createSubscription(user.id, {
        name: "Custom Plan",
        amount: 1500,
        currency: "INR",
        billingCycle: "custom",
        intervalCount: 3,
        nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });

      expect(sub.billingCycle).toBe("custom");
    });
  });

  describe("Reminder edge cases", () => {
    it("should not create reminders in the past", async () => {
      const sub = await createSubscription(user.id, {
        name: "Test",
        amount: 100,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await createRemindersForSubscription(sub.id);

      const reminders = await getReminders(user.id, sub.id);
      reminders.forEach((r) => {
        expect(r.scheduledAt.getTime()).toBeGreaterThan(Date.now());
      });
    });

    it("should handle subscription deletion with reminders", async () => {
      const sub = await createSubscription(user.id, {
        name: "Test",
        amount: 100,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await createReminder(user.id, {
        subscriptionId: sub.id,
        reminderType: "pre_reminder",
        daysOffset: 3,
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });

      const {
        deleteSubscription,
      } = require("../../src/modules/subscription/service");
      await deleteSubscription(sub.id, user.id);

      const reminders = await getReminders(user.id);
      const subReminders = reminders.filter(
        (r: any) => r.subscriptionId === sub.id,
      );
      expect(subReminders.length).toBe(0);
    });
  });

  describe("Price increase handling", () => {
    it("should allow price updates", async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const {
        updateSubscription,
      } = require("../../src/modules/subscription/service");
      const updated = await updateSubscription(sub.id, user.id, {
        amount: 599,
      });

      expect(updated.amount).toBe(599);
    });
  });

  describe("Concurrent operations", () => {
    it("should handle multiple simultaneous subscriptions", async () => {
      const promises = [
        createSubscription(user.id, {
          name: "Netflix",
          amount: 499,
          currency: "INR",
          billingCycle: "monthly",
          intervalCount: 1,
          nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
        createSubscription(user.id, {
          name: "Spotify",
          amount: 199,
          currency: "INR",
          billingCycle: "monthly",
          intervalCount: 1,
          nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
        createSubscription(user.id, {
          name: "Amazon Prime",
          amount: 1499,
          currency: "INR",
          billingCycle: "yearly",
          intervalCount: 1,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
      ];

      const results = await Promise.all(promises);
      expect(results.length).toBe(3);
    });
  });

  describe("Empty states", () => {
    it("should handle empty subscription list", async () => {
      const subs = await getSubscriptions(user.id);
      expect(subs.length).toBe(0);
    });

    it("should handle empty reminder list", async () => {
      const reminders = await getReminders(user.id);
      expect(reminders.length).toBe(0);
    });
  });

  describe("Invalid data handling", () => {
    it("should reject subscription with very large amount", async () => {
      await expect(
        createSubscription(user.id, {
          name: "Test",
          amount: 1000000000,
          currency: "INR",
          billingCycle: "monthly",
          intervalCount: 1,
          nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should handle very long subscription names", async () => {
      await expect(
        createSubscription(user.id, {
          name: "a".repeat(200),
          amount: 100,
          currency: "INR",
          billingCycle: "monthly",
          intervalCount: 1,
          nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
