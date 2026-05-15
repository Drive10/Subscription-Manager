import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const [
      totalSubscriptions,
      totalMonthlySpending,
      totalYearlySpending,
      upcomingRenewals,
      topExpensiveSubscriptions,
    ] = await Promise.all([
      this.prisma.subscription.count({ where: { userId, status: "active" } }),
      this.getTotalMonthlySpending(userId),
      this.getTotalYearlySpending(userId),
      this.getUpcomingRenewals(userId),
      this.getTopExpensiveSubscriptions(userId),
    ]);

    return {
      totalSubscriptions,
      totalMonthlySpending,
      totalYearlySpending,
      upcomingRenewals,
      topExpensiveSubscriptions,
    };
  }

  private async getTotalMonthlySpending(userId: string) {
    const monthlySubscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
      },
    });

    return monthlySubscriptions.reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      if (sub.billingCycle === "yearly") {
        monthlyAmount = sub.amount / 12;
      }
      return total + monthlyAmount;
    }, 0);
  }

  private async getTotalYearlySpending(userId: string) {
    const yearlySubscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
      },
    });

    return yearlySubscriptions.reduce((total, sub) => {
      let yearlyAmount = sub.amount;
      if (sub.billingCycle === "monthly") {
        yearlyAmount = sub.amount * 12;
      }
      return total + yearlyAmount;
    }, 0);
  }

  private async getUpcomingRenewals(userId: string, days: number = 7) {
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

  private async getTopExpensiveSubscriptions(userId: string, limit: number = 3) {
    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: "active",
      },
      orderBy: {
        amount: "desc",
      },
      take: limit,
    });
  }
}