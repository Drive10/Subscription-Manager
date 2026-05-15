import { Test, TestingModule } from "@nestjs/testing";
import { SubscriptionService } from "./subscription.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("SubscriptionService", () => {
  let service: SubscriptionService;
  let prisma: PrismaService;

  const mockUserId = "user-1";
  const mockSubscriptionId = "sub-1";

  const mockSubscription = {
    id: mockSubscriptionId,
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
  };

  const mockPrisma = {
    subscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-15"));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createDto = {
      name: "Spotify",
      amount: 119,
      billingCycle: "monthly",
      nextBillingDate: "2026-06-20T00:00:00.000Z",
      category: "Entertainment",
    };

    it("should create a subscription", async () => {
      mockPrisma.subscription.create.mockResolvedValue({
        ...mockSubscription,
        name: "Spotify",
        amount: 119,
      });

      const result = await service.create(mockUserId, createDto);

      expect(result.name).toBe("Spotify");
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          name: "Spotify",
          amount: 119,
          currency: "INR",
          billingCycle: "monthly",
          nextBillingDate: new Date("2026-06-20T00:00:00.000Z"),
          category: "Entertainment",
          status: "active",
        },
      });
    });

    it("should reject past nextBillingDate", async () => {
      const pastDto = { ...createDto, nextBillingDate: "2026-01-01T00:00:00.000Z" };

      await expect(service.create(mockUserId, pastDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should accept future nextBillingDate", async () => {
      mockPrisma.subscription.create.mockResolvedValue(mockSubscription);

      const result = await service.create(mockUserId, createDto);

      expect(result).toBeDefined();
    });

    it("should return the created subscription object", async () => {
      const newSub = { ...mockSubscription, id: "new-id", name: "Spotify" };
      mockPrisma.subscription.create.mockResolvedValue(newSub);

      const result = await service.create(mockUserId, createDto);

      expect(result.id).toBe("new-id");
      expect(result.name).toBe("Spotify");
    });
  });

  describe("findAll", () => {
    it("should return all subscriptions for user", async () => {
      const mockSubs = [mockSubscription];
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubs);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(mockSubs);
      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { nextBillingDate: "asc" },
        skip: 0,
        take: undefined,
      });
    });

    it("should filter by status", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, { status: "active" });

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, status: "active" },
        }),
      );
    });

    it("should filter by category", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, { category: "Entertainment" });

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId, category: "Entertainment" },
        }),
      );
    });

    it("should support pagination", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, {}, { limit: 10, page: 0 });

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });
  });

  describe("findById", () => {
    it("should return subscription by id", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await service.findById(mockSubscriptionId, mockUserId);

      expect(result).toEqual(mockSubscription);
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(mockSubscriptionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it("should scope by userId", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      await service.findById(mockSubscriptionId, mockUserId);

      expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
        where: { id: mockSubscriptionId, userId: mockUserId },
      });
    });
  });

  describe("update", () => {
    const updateDto = { name: "Netflix Premium", amount: 799 };

    it("should update existing subscription", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        ...updateDto,
      });

      const result = await service.update(mockSubscriptionId, mockUserId, updateDto);

      expect(result.name).toBe("Netflix Premium");
      expect(result.amount).toBe(799);
    });

    it("should throw NotFoundException if subscription does not exist", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockSubscriptionId, mockUserId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("should update amount and reflect in analytics", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        amount: 999,
      });

      const result = await service.update(mockSubscriptionId, mockUserId, {
        amount: 999,
      });

      expect(result.amount).toBe(999);
    });
  });

  describe("delete", () => {
    it("should delete existing subscription", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.delete.mockResolvedValue(mockSubscription);

      await service.delete(mockSubscriptionId, mockUserId);

      expect(mockPrisma.subscription.delete).toHaveBeenCalledWith({
        where: { id: mockSubscriptionId },
      });
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(mockSubscriptionId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatus (pause/resume)", () => {
    it("should pause active subscription", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: "paused",
      });

      const result = await service.updateStatus(
        mockSubscriptionId,
        mockUserId,
        "paused",
      );

      expect(result.status).toBe("paused");
    });

    it("should resume paused subscription", async () => {
      const pausedSub = { ...mockSubscription, status: "paused" };
      mockPrisma.subscription.findFirst.mockResolvedValue(pausedSub);
      mockPrisma.subscription.update.mockResolvedValue({
        ...pausedSub,
        status: "active",
      });

      const result = await service.updateStatus(
        mockSubscriptionId,
        mockUserId,
        "active",
      );

      expect(result.status).toBe("active");
    });

    it("should cancel subscription", async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: "cancelled",
      });

      const result = await service.updateStatus(
        mockSubscriptionId,
        mockUserId,
        "cancelled",
      );

      expect(result.status).toBe("cancelled");
    });
  });

  describe("getUpcoming", () => {
    it("should return upcoming renewals within default 7 days", async () => {
      const futureDate = new Date("2026-05-20");
      const futureSubscriptions = [{ ...mockSubscription, nextBillingDate: futureDate }];
      mockPrisma.subscription.findMany.mockResolvedValue(futureSubscriptions);

      const result = await service.getUpcoming(mockUserId);

      expect(result).toHaveLength(1);
    });

    it("should return upcoming renewals within custom days", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([mockSubscription]);

      await service.getUpcoming(mockUserId, 30);

      expect(mockPrisma.subscription.findMany).toHaveBeenCalled();
    });
  });

  describe("getCategoryWiseSpending", () => {
    it("should return spending grouped by category", async () => {
      const mockData = [
        { category: "Entertainment", _sum: { amount: 1500 } },
        { category: "Development", _sum: { amount: 2500 } },
      ];
      mockPrisma.subscription.groupBy.mockResolvedValue(mockData);

      const result = await service.getCategoryWiseSpending(mockUserId);

      expect(result).toEqual(mockData);
      expect(mockPrisma.subscription.groupBy).toHaveBeenCalledWith({
        by: ["category"],
        where: {
          userId: mockUserId,
          status: "active",
          category: { not: null },
        },
        _sum: { amount: true },
      });
    });
  });
});
