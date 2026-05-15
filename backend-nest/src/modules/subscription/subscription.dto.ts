import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const BillingCycle = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const;

export const SubscriptionStatusValues = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  PAUSED: "paused",
  EXPIRED: "expired",
} as const;

export type BillingCycleType = (typeof BillingCycle)[keyof typeof BillingCycle];
export type SubscriptionStatusType = (typeof SubscriptionStatusValues)[keyof typeof SubscriptionStatusValues];

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ default: "INR" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: Object.values(BillingCycle) })
  @IsEnum(BillingCycle)
  billingCycle: string;

  @ApiProperty()
  @IsDateString()
  nextBillingDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ enum: Object.values(BillingCycle) })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextBillingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: Object.values(SubscriptionStatusValues) })
  @IsOptional()
  @IsEnum(SubscriptionStatusValues)
  status?: string;
}

export class SubscriptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  billingCycle: string;

  @ApiProperty()
  nextBillingDate: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}