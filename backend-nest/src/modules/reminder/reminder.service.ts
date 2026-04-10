import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReminderService {
  constructor(private prisma: PrismaService) {}

  async findBySubscription(subscriptionId: string) {
    return this.prisma.reminder.findMany({
      where: { subscriptionId },
      orderBy: { scheduledAt: "asc" },
    });
  }

  async create(
    subscriptionId: string,
    data: { reminderType: string; daysOffset: number; scheduledAt: Date },
  ) {
    return this.prisma.reminder.create({
      data: { subscriptionId, ...data },
    });
  }

  async cancel(id: string, userId: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, subscription: { userId } },
    });
    if (!reminder) throw new Error("Reminder not found");
    return this.prisma.reminder.update({
      where: { id },
      data: { status: "cancelled" },
    });
  }
}
