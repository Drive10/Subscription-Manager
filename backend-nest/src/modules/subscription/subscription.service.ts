import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SubscriptionStatusValues } from "./subscription.dto";

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    if (new Date(dto.nextBillingDate) < new Date()) {
      throw new BadRequestException("Next billing date must be in the future");
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        name: dto.name,
        amount: dto.amount,
        currency: dto.currency || "INR",
        billingCycle: dto.billingCycle,
        nextBillingDate: new Date(dto.nextBillingDate),
        category: dto.category,
        status: "active",
      },
    });
  }

  async findAll(
    userId: string,
    filters?: { status?: string; category?: string },
    pagination?: { limit: number; page: number },
    sortBy?: string,
    sortOrder?: "asc" | "desc",
  ) {
    const where: any = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || "asc";
    } else {
      orderBy.nextBillingDate = "asc";
    }

    const skip = (pagination?.page || 0) * (pagination?.limit || 10);

    return this.prisma.subscription.findMany({
      where,
      orderBy,
      skip,
      take: pagination?.limit,
    });
  }

  async findById(subscriptionId: string, userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }

    return subscription;
  }

  async update(subscriptionId: string, userId: string, dto: any) {
    await this.findById(subscriptionId, userId);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: dto,
    });
  }

  async updateStatus(subscriptionId: string, userId: string, status: "active" | "paused" | "cancelled" | "expired") {
    await this.findById(subscriptionId, userId);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    });
  }

  async delete(subscriptionId: string, userId: string) {
    await this.findById(subscriptionId, userId);
    await this.prisma.subscription.delete({ where: { id: subscriptionId } });
  }

  async getUpcoming(userId: string, days: number = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
        nextBillingDate: { lte: futureDate, gte: new Date() },
      },
      orderBy: { nextBillingDate: "asc" },
    });
  }

  async getCategoryWiseSpending(userId: string) {
    return this.prisma.subscription.groupBy({
      by: ["category"],
      where: {
        userId,
        status: "active",
        category: { not: null },
      },
      _sum: {
        amount: true,
      },
    });
  }

  async getMonthlySpendingTrend(userId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "nextBillingDate")::date as month,
        SUM(amount) as total_spending
      FROM "Subscription"
      WHERE "userId" = ${userId}
        AND "status" = 'active'
        AND "nextBillingDate" >= ${startDate}
        AND "nextBillingDate" <= ${endDate}
      GROUP BY DATE_TRUNC('month', "nextBillingDate")
      ORDER BY month;
    `;
  }
}
