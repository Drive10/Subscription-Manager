export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  lastBillingDate?: string;
  category?: string;
  description?: string;
  status: "active" | "cancelled" | "paused" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPayload {
  name: string;
  amount: number;
  billingCycle: string;
  nextBillingDate: string;
  currency?: string;
  category?: string;
}

export interface UpdateSubscriptionPayload {
  name?: string;
  amount?: number;
  billingCycle?: string;
  nextBillingDate?: string;
  category?: string;
  status?: string;
}

export interface DashboardData {
  totalSubscriptions: number;
  totalMonthlySpending: number;
  totalYearlySpending: number;
  upcomingRenewals: Subscription[];
  topExpensiveSubscriptions: Subscription[];
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePaymentPayload {
  subscriptionId: string;
  amount: number;
  paymentDate: string;
  currency?: string;
}

export interface DetectionLog {
  id: string;
  userId: string;
  type: string;
  data: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  subscriptionId: string;
  type: string;
  scheduledAt: string;
  sentAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
