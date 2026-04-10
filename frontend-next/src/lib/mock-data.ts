export const USE_MOCK_DATA = process.env.NODE_ENV !== "production";

export const isDev = () => process.env.NODE_ENV !== "production";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  lastBillingDate?: string;
  category: string;
  status: "active" | "paused" | "expired";
  description?: string;
  logo?: string;
}

export interface Alert {
  id: string;
  type: "renewal" | "spending" | "warning";
  message: string;
  subscriptionId?: string;
  subscriptionName?: string;
  date: string;
  read: boolean;
}

export interface MonthlySpending {
  month: string;
  amount: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  color: string;
}

export const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    name: "Netflix",
    amount: 649,
    currency: "INR",
    billingCycle: "monthly",
    nextBillingDate: "2026-04-15",
    lastBillingDate: "2026-03-15",
    category: "Entertainment",
    status: "active",
    logo: "N",
  },
  {
    id: "2",
    name: "Spotify",
    amount: 119,
    currency: "INR",
    billingCycle: "monthly",
    nextBillingDate: "2026-04-20",
    lastBillingDate: "2026-03-20",
    category: "Entertainment",
    status: "active",
    logo: "S",
  },
  {
    id: "3",
    name: "Amazon Prime",
    amount: 1499,
    currency: "INR",
    billingCycle: "yearly",
    nextBillingDate: "2026-06-01",
    lastBillingDate: "2025-06-01",
    category: "Shopping",
    status: "active",
    logo: "A",
  },
  {
    id: "4",
    name: "Disney+ Hotstar",
    amount: 1499,
    currency: "INR",
    billingCycle: "yearly",
    nextBillingDate: "2026-05-10",
    lastBillingDate: "2025-05-10",
    category: "Entertainment",
    status: "active",
    logo: "D",
  },
  {
    id: "5",
    name: "YouTube Premium",
    amount: 139,
    currency: "INR",
    billingCycle: "monthly",
    nextBillingDate: "2026-04-12",
    lastBillingDate: "2026-03-12",
    category: "Entertainment",
    status: "active",
    logo: "Y",
  },
  {
    id: "6",
    name: "Notion",
    amount: 799,
    currency: "INR",
    billingCycle: "yearly",
    nextBillingDate: "2026-08-01",
    lastBillingDate: "2025-08-01",
    category: "Productivity",
    status: "active",
    logo: "N",
  },
  {
    id: "7",
    name: "GitHub Pro",
    amount: 467,
    currency: "INR",
    billingCycle: "monthly",
    nextBillingDate: "2026-04-25",
    lastBillingDate: "2026-03-25",
    category: "Development",
    status: "active",
    logo: "G",
  },
  {
    id: "8",
    name: "Cloudflare Pro",
    amount: 2083,
    currency: "INR",
    billingCycle: "monthly",
    nextBillingDate: "2026-04-30",
    lastBillingDate: "2026-03-30",
    category: "Development",
    status: "active",
    logo: "C",
  },
];

export const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "renewal",
    message: "Netflix renews tomorrow",
    subscriptionId: "1",
    subscriptionName: "Netflix",
    date: "2026-04-14",
    read: false,
  },
  {
    id: "2",
    type: "spending",
    message: "You've spent ₹4,543 this month",
    date: "2026-04-10",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    message: "YouTube Premium renews in 2 days",
    subscriptionId: "5",
    subscriptionName: "YouTube Premium",
    date: "2026-04-10",
    read: true,
  },
];

export const mockMonthlySpending: MonthlySpending[] = [
  { month: "Oct", amount: 3200 },
  { month: "Nov", amount: 3500 },
  { month: "Dec", amount: 4800 },
  { month: "Jan", amount: 4100 },
  { month: "Feb", amount: 3800 },
  { month: "Mar", amount: 4200 },
];

export const mockCategorySpending: CategorySpending[] = [
  { category: "Entertainment", amount: 2406, color: "#8b5cf6" },
  { category: "Development", amount: 2550, color: "#06b6d4" },
  { category: "Productivity", amount: 799, color: "#10b981" },
  { category: "Shopping", amount: 1499, color: "#f59e0b" },
];

export function getTotalMonthly(): number {
  return mockSubscriptions
    .filter((s) => s.status === "active")
    .reduce((total, sub) => {
      return total + (sub.billingCycle === "monthly" ? sub.amount : sub.amount / 12);
    }, 0);
}

export function getTotalYearly(): number {
  return mockSubscriptions
    .filter((s) => s.status === "active")
    .reduce((total, sub) => {
      return total + (sub.billingCycle === "yearly" ? sub.amount : sub.amount * 12);
    }, 0);
}

export function getUpcomingRenewals(days: number = 7): Subscription[] {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return mockSubscriptions
    .filter((s) => {
      const billingDate = new Date(s.nextBillingDate);
      return s.status === "active" && billingDate >= now && billingDate <= future;
    })
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
}

export function getTopSubscriptions(limit: number = 3): Subscription[] {
  return [...mockSubscriptions]
    .filter((s) => s.status === "active")
    .sort((a, b) => {
      const aMonthly = a.billingCycle === "monthly" ? a.amount : a.amount / 12;
      const bMonthly = b.billingCycle === "monthly" ? b.amount : b.amount / 12;
      return bMonthly - aMonthly;
    })
    .slice(0, limit);
}

export const popularServices = [
  "Netflix",
  "Spotify",
  "Amazon Prime",
  "Disney+ Hotstar",
  "YouTube Premium",
  "Apple Music",
  "Notion",
  "GitHub",
  "Adobe Creative",
  "Figma",
  "ChatGPT",
  "Midjourney",
];