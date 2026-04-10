import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { BillingModule } from "./modules/billing/billing.module";
import { DetectionModule } from "./modules/detection/detection.module";
import { ReminderModule } from "./modules/reminder/reminder.module";
import { HealthController } from "./health.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SubscriptionModule,
    AnalyticsModule,
    DashboardModule,
    NotificationModule,
    BillingModule,
    DetectionModule,
    ReminderModule,
  ],
  controllers: [HealthController],
  providers: [AppService],
})
export class AppModule {}
