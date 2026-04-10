import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";

interface ParsedData {
  name: string | null;
  amount: number | null;
  currency: string | null;
  billingCycle: string | null;
  confidence: number;
}

@Injectable()
export class DetectionService {
  constructor(private prisma: PrismaService) {}

  private extractAmount(text: string): {
    amount: number | null;
    currency: string | null;
  } {
    const patterns = [
      /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i,
      /(?:USD|EUR|GBP)\s*([\d,]+(?:\.\d{2})?)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ""));
        if (amount > 0 && amount < 1000000) {
          let currency = "INR";
          if (text.includes("$")) currency = "USD";
          return { amount, currency };
        }
      }
    }
    return { amount: null, currency: null };
  }

  private extractName(text: string): string | null {
    const keywords = [
      "subscription",
      "charged",
      "Netflix",
      "Spotify",
      "Amazon",
      "Premium",
      "membership",
    ];
    const lowerText = text.toLowerCase();
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    return text.split(/[.!]/)[0]?.substring(0, 30) || null;
  }

  async detectSms(userId: string, text: string) {
    const { amount, currency } = this.extractAmount(text);
    const name = this.extractName(text);

    let confidence = 0;
    if (amount) confidence += 40;
    if (name) confidence += 30;

    const parsed = {
      name,
      amount,
      currency,
      billingCycle: null,
      confidence,
    };
    const status = confidence >= 50 ? "matched" : "unmatched";

    const log = await this.prisma.detectionLog.create({
      data: {
        id: uuidv4(),
        userId,
        rawText: text,
        parsedData: parsed,
        confidenceScore: confidence,
        status: status as any,
      },
    });

    return {
      detectionLog: log,
      parsed,
      suggestedAction: confidence >= 70 ? "confirm" : "review",
    };
  }

  async confirmDetection(
    userId: string,
    data: {
      detectionLogId: string;
      confirmed: boolean;
      name?: string;
      amount?: number;
      billingCycle?: string;
    },
  ) {
    const log = await this.prisma.detectionLog.findFirst({
      where: { id: data.detectionLogId, userId },
    });
    if (!log) throw new Error("Detection log not found");

    if (data.confirmed && data.name && data.amount) {
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      await this.prisma.subscription.create({
        data: {
          id: uuidv4(),
          userId,
          name: data.name,
          amount: data.amount,
          currency: "INR",
          billingCycle: (data.billingCycle || "monthly") as any,
          nextBillingDate,
          status: "active" as any,
        },
      });
      await this.prisma.detectionLog.update({
        where: { id: data.detectionLogId },
        data: { status: "confirmed" as any },
      });
      return { message: "Subscription created" };
    }

    await this.prisma.detectionLog.update({
      where: { id: data.detectionLogId },
      data: { status: "rejected" as any },
    });
    return { message: "Detection rejected" };
  }

  async getLogs(userId: string, status?: string) {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status as any;
    return this.prisma.detectionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}
