import { Test, TestingModule } from "@nestjs/testing";
import { DashboardService } from "./dashboard.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("DashboardService", () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockUserId = "user-1";

  const mockSubscription = (overrides = {}) => ({
    id: "sub-1",
    userId: mockUserId,
    name: "Netflix",
    amount: 649,
    currency: "INR",
    billingCycle: "monthly",
    nextBillingDate: new Date("2026-06-15"),
    lastBillingDate: new Date("2026-05-15"),
    category: "Entertainment",
    description: null,
    status: "active",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });

  const mockPrisma = {
    subscription: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardData", () => {
    it("should return complete dashboard data", async () => {
      const mockSubscriptions = [
        mockSubscription({ amount: 649, billingCycle: "monthly" }),
        mockSubscription({
          id: "sub-2",
          name: "Amazon Prime",
          amount: 1499,
          billingCycle: "yearly",
          nextBillingDate: new Date("2026-06-01"),
          category: "Shopping",
        }),
      ];

      mockPrisma.subscription.count.mockResolvedValue(2);
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce(mockSubscriptions)
        .mockResolvedValueOnce(mockSubscriptions)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSubscriptions.slice(0, 2));

      const result = await service.getDashboardData(mockUserId);

      expect(result).toHaveProperty("totalSubscriptions");
      expect(result).toHaveProperty("totalMonthlySpending");
      expect(result).toHaveProperty("totalYearlySpending");
      expect(result).toHaveProperty("upcomingRenewals");
      expect(result).toHaveProperty("topExpensiveSubscriptions");
    });

    it("should only count active subscriptions", async () => {
      mockPrisma.subscription.count.mockResolvedValue(3);
      mockPrisma.subscription.findMany
        .mockResolvedValue([])
        .mockResolvedValue([])
        .mockResolvedValue([])
        .mockResolvedValue([]);

      await service.getDashboardData(mockUserId);

      expect(mockPrisma.subscription.count).toHaveBeenCalledWith({
        where: { userId: mockUserId, status: "active" },
      });
    });

    it("should calculate correct monthly spending", async () => {
      const mockSubs = [
        mockSubscription({ amount: 649, billingCycle: "monthly" }),
        mockSubscription({
          id: "sub-2",
          amount: 12000,
          billingCycle: "yearly",
        }),
      ];

      mockPrisma.subscription.count.mockResolvedValue(2);
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce(mockSubs)
        .mockResolvedValueOnce(mockSubs)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSubs);

      const result = await service.getDashboardData(mockUserId);

      const expectedMonthly = 649 + 12000 / 12;
      expect(result.totalMonthlySpending).toBe(expectedMonthly);
    });

    it("should calculate correct yearly spending", async () => {
      const mockSubs = [
        mockSubscription({ amount: 649, billingCycle: "monthly" }),
        mockSubscription({
          id: "sub-2",
          amount: 12000,
          billingCycle: "yearly",
        }),
      ];

      mockPrisma.subscription.count.mockResolvedValue(2);
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce(mockSubs)
        .mockResolvedValueOnce(mockSubs)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockSubs);

      const result = await service.getDashboardData(mockUserId);

      const expectedYearly = 649 * 12 + 12000;
      expect(result.totalYearlySpending).toBe(expectedYearly);
    });

    it("should return upcoming renewals within 7 days", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 6);

      const upcoming = [
        mockSubscription({
          id: "upcoming-1",
          nextBillingDate: tomorrow,
        }),
        mockSubscription({
          id: "upcoming-2",
          nextBillingDate: nextWeek,
        }),
      ];

      mockPrisma.subscription.count.mockResolvedValue(2);
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce([]) // getTotalMonthlySpending
        .mockResolvedValueOnce([]) // getTotalYearlySpending
        .mockResolvedValueOnce(upcoming) // getUpcomingRenewals
        .mockResolvedValueOnce([]); // getTopExpensiveSubscriptions

      const result = await service.getDashboardData(mockUserId);

      expect(result.upcomingRenewals).toHaveLength(2);
      expect(result.upcomingRenewals[0].id).toBe("upcoming-1");
    });

    it("should return top 3 most expensive subscriptions", async () => {
      const expensive = [
        mockSubscription({ id: "e1", amount: 3000 }),
        mockSubscription({ id: "e2", amount: 2000 }),
        mockSubscription({ id: "e3", amount: 1000 }),
      ];

      mockPrisma.subscription.count.mockResolvedValue(3);
      mockPrisma.subscription.findMany
        .mockResolvedValueOnce(expensive)
        .mockResolvedValueOnce(expensive)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(expensive); // getTopExpensiveSubscriptions

      const result = await service.getDashboardData(mockUserId);

      expect(result.topExpensiveSubscriptions).toHaveLength(3);
      expect(result.topExpensiveSubscriptions[0].amount).toBe(3000);
    });

    it("should return zeros for empty dashboard", async () => {
      mockPrisma.subscription.count.mockResolvedValue(0);
      mockPrisma.subscription.findMany
        .mockResolvedValue([])
        .mockResolvedValue([])
        .mockResolvedValue([])
        .mockResolvedValue([]);

      const result = await service.getDashboardData(mockUserId);

      expect(result.totalSubscriptions).toBe(0);
      expect(result.totalMonthlySpending).toBe(0);
      expect(result.totalYearlySpending).toBe(0);
      expect(result.upcomingRenewals).toHaveLength(0);
      expect(result.topExpensiveSubscriptions).toHaveLength(0);
    });
  });
});
