import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockUserId = "user-1";

  const mockPrisma = {
    subscription: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCategoryWiseSpending", () => {
    it("should return category-wise spending grouped by category", async () => {
      const mockData = [
        { category: "Entertainment", _sum: { amount: 1500 } },
        { category: "Development", _sum: { amount: 2500 } },
      ];
      mockPrisma.subscription.groupBy.mockResolvedValue(mockData);

      const result = await service.getCategoryWiseSpending(mockUserId);

      expect(result).toEqual(mockData);
      expect(mockPrisma.subscription.groupBy).toHaveBeenCalledWith({
        by: ["category"],
        where: { userId: mockUserId, status: "active", category: { not: null } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      });
    });

    it("should return empty array when no subscriptions exist", async () => {
      mockPrisma.subscription.groupBy.mockResolvedValue([]);

      const result = await service.getCategoryWiseSpending(mockUserId);

      expect(result).toEqual([]);
    });

    it("should return data with _sum.amount format for frontend compatibility", async () => {
      const mockData = [
        { category: "Music", _sum: { amount: 999 } },
      ];
      mockPrisma.subscription.groupBy.mockResolvedValue(mockData);

      const result = await service.getCategoryWiseSpending(mockUserId);

      expect(result[0]._sum.amount).toBe(999);
      expect(result[0].category).toBe("Music");
    });
  });

  describe("getMonthlySpendingTrend", () => {
    it("should return monthly trend reflecting createdAt dates", async () => {
      const mockSubscriptions = [
        { amount: 1000, billingCycle: "monthly", createdAt: new Date("2026-01-15") },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await service.getMonthlySpendingTrend(mockUserId, 6);

      expect(result).toHaveLength(6);
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, status: "active" },
        select: { amount: true, billingCycle: true, createdAt: true },
      });
    });

    it("should return non-zero for months after subscription created", async () => {
      const mockSubscriptions = [
        { amount: 1000, billingCycle: "monthly", createdAt: new Date("2024-01-01") },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await service.getMonthlySpendingTrend(mockUserId, 6);

      result.forEach((r) => {
        expect(r.amount).toBe(1000);
      });
    });

    it("should handle yearly billing cycle by dividing by 12", async () => {
      const mockSubscriptions = [
        { amount: 12000, billingCycle: "yearly", createdAt: new Date("2025-01-01") },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const result = await service.getMonthlySpendingTrend(mockUserId, 6);

      const expectedMonthly = Math.round(12000 / 12);
      result.forEach((r) => {
        expect(r.amount).toBe(expectedMonthly);
      });
    });

    it("should handle empty subscriptions", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.getMonthlySpendingTrend(mockUserId, 6);

      expect(result).toHaveLength(6);
      result.forEach((r) => {
        expect(r.amount).toBe(0);
      });
    });

    it("should return correct number of months", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result3 = await service.getMonthlySpendingTrend(mockUserId, 3);
      const result12 = await service.getMonthlySpendingTrend(mockUserId, 12);

      expect(result3).toHaveLength(3);
      expect(result12).toHaveLength(12);
    });

    it("should return months in chronological order", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.getMonthlySpendingTrend(mockUserId, 6);

      for (let i = 1; i < result.length; i++) {
        expect(result[i].month > result[i - 1].month).toBe(true);
      }
    });

    it("should format month as YYYY-MM", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const result = await service.getMonthlySpendingTrend(mockUserId, 6);

      result.forEach((r) => {
        expect(r.month).toMatch(/^\d{4}-\d{2}$/);
      });
    });
  });
});
