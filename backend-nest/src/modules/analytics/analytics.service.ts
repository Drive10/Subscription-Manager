import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

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
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });
  }

  async getMonthlySpendingTrend(userId: string, months: number = 6) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
      },
      select: {
        amount: true,
        billingCycle: true,
        createdAt: true,
      },
    });

    const monthlyData: Record<string, number> = {};
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData[monthKey] = 0;
    }

    subscriptions.forEach((sub) => {
      const monthlyAmount = sub.billingCycle === "yearly"
        ? Math.round(sub.amount / 12)
        : sub.amount;

      Object.keys(monthlyData).forEach((month) => {
        const [yearStr, monthStr] = month.split("-");
        const nextMonth = new Date(parseInt(yearStr), parseInt(monthStr), 1);
        if (sub.createdAt < nextMonth) {
          monthlyData[month] += monthlyAmount;
        }
      });
    });

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount,
    }));
  }
}
