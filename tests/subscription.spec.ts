import { register, login } from "@modules/auth/service";
import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
  pauseSubscription,
  resumeSubscription,
  getUpcomingRenewals,
} from "@modules/subscription/service";
import { ValidationError, NotFoundError } from "@shared/errors";

describe("Subscription Service", () => {
  let user: { id: string; email: string };

  beforeEach(async () => {
    const authResult = await register({
      email: "subtest@example.com",
      password: "password123",
    });
    user = authResult.user;
  });

  describe("createSubscription", () => {
    it("should create subscription with valid data", async () => {
      const input = {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly" as const,
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const result = await createSubscription(user.id, input);

      expect(result.name).toBe("Netflix");
      expect(result.amount).toBe(499);
      expect(result.status).toBe("active");
    });

    it("should throw ValidationError for past billing date", async () => {
      const input = {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly" as const,
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };

      await expect(createSubscription(user.id, input)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw ValidationError for negative amount", async () => {
      const input = {
        name: "Netflix",
        amount: -100,
        currency: "INR",
        billingCycle: "monthly" as const,
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await expect(createSubscription(user.id, input)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getSubscriptions", () => {
    beforeEach(async () => {
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
        nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    });

    it("should return all user subscriptions", async () => {
      const result = await getSubscriptions(user.id);
      expect(result.length).toBe(2);
    });

    it("should filter by status", async () => {
      const result = await getSubscriptions(user.id, { status: "active" });
      expect(result.length).toBe(2);
    });
  });

  describe("getSubscriptionById", () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      subscriptionId = sub.id;
    });

    it("should return subscription by ID", async () => {
      const result = await getSubscriptionById(subscriptionId, user.id);
      expect(result.name).toBe("Netflix");
    });

    it("should throw NotFoundError for non-existent subscription", async () => {
      await expect(getSubscriptionById("invalid-id", user.id)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should throw NotFoundError for other user subscription", async () => {
      const otherUser = await register({
        email: "other@example.com",
        password: "password123",
      });
      await expect(
        getSubscriptionById(subscriptionId, otherUser.user.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateSubscription", () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      subscriptionId = sub.id;
    });

    it("should update subscription name", async () => {
      const result = await updateSubscription(subscriptionId, user.id, {
        name: "Netflix Premium",
      });
      expect(result.name).toBe("Netflix Premium");
    });

    it("should update subscription amount", async () => {
      const result = await updateSubscription(subscriptionId, user.id, {
        amount: 599,
      });
      expect(result.amount).toBe(599);
    });

    it("should throw ValidationError for past billing date", async () => {
      await expect(
        updateSubscription(subscriptionId, user.id, {
          nextBillingDate: new Date(Date.now() - 1000),
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("deleteSubscription", () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      subscriptionId = sub.id;
    });

    it("should delete subscription", async () => {
      await deleteSubscription(subscriptionId, user.id);
      await expect(
        getSubscriptionById(subscriptionId, user.id),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("pauseSubscription", () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      subscriptionId = sub.id;
    });

    it("should pause active subscription", async () => {
      const result = await pauseSubscription(subscriptionId, user.id);
      expect(result.status).toBe("paused");
    });
  });

  describe("resumeSubscription", () => {
    let subscriptionId: string;

    beforeEach(async () => {
      const sub = await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      subscriptionId = sub.id;
      await pauseSubscription(subscriptionId, user.id);
    });

    it("should resume paused subscription", async () => {
      const result = await resumeSubscription(subscriptionId, user.id);
      expect(result.status).toBe("active");
    });

    it("should throw error for non-paused subscription", async () => {
      await resumeSubscription(subscriptionId, user.id);
      await expect(resumeSubscription(subscriptionId, user.id)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("getUpcomingRenewals", () => {
    beforeEach(async () => {
      await createSubscription(user.id, {
        name: "Netflix",
        amount: 499,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      });
      await createSubscription(user.id, {
        name: "Spotify",
        amount: 199,
        currency: "INR",
        billingCycle: "monthly",
        intervalCount: 1,
        nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    });

    it("should return subscriptions due within specified days", async () => {
      const result = await getUpcomingRenewals(user.id, 7);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("Netflix");
    });
  });
});
