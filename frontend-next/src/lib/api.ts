import type {
  AuthResponse,
  Subscription,
  CreateSubscriptionPayload,
  UpdateSubscriptionPayload,
  DashboardData,
  Payment,
  CreatePaymentPayload,
  DetectionLog,
  Reminder,
  ApiResponse,
} from "./types";

const TOKEN_KEYS = {
  access: "accessToken",
  refresh: "refreshToken",
} as const;

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3001/api/v1`;
  }
  return "http://localhost:3001/api/v1";
};

const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEYS.access);
  }
  return null;
};

const getRefreshToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEYS.refresh);
  }
  return null;
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEYS.access);
      localStorage.removeItem(TOKEN_KEYS.refresh);
      return null;
    }
    const json: ApiResponse<{ accessToken: string }> = await res.json();
    const accessToken = json.data.accessToken;
    localStorage.setItem(TOKEN_KEYS.access, accessToken);
    return accessToken;
  } catch {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
    return null;
  }
};

const getValidToken = async (): Promise<string | null> => {
  const token = getToken();
  if (token) return token;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken();
  const result = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;
  return result;
};

const extractData = <T>(json: ApiResponse<T>): T => {
  if (json.data && typeof json.data === "object" && "data" in json.data) {
    return (json.data as { data: T }).data;
  }
  return json.data;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const token = await getValidToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      const retryRes = await fetch(url, { ...options, headers });
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({}));
        throw new ApiError(
          errData.message || `Request failed with status ${retryRes.status}`,
          retryRes.status,
        );
      }
      return extractData<T>(await retryRes.json());
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(
      errData.message || `Request failed with status ${res.status}`,
      res.status,
    );
  }

  return extractData<T>(await res.json());
};

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>("/dashboard"),

  // Subscriptions
  getSubscriptions: (params?: { status?: string; category?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    return request<Subscription[]>(`/subscriptions${query}`);
  },

  getSubscription: (id: string) =>
    request<Subscription>(`/subscriptions/${id}`),

  createSubscription: (data: CreateSubscriptionPayload) =>
    request<Subscription>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateSubscription: (id: string, data: UpdateSubscriptionPayload) =>
    request<Subscription>(`/subscriptions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteSubscription: (id: string) =>
    request<void>(`/subscriptions/${id}`, { method: "DELETE" }),

  pauseSubscription: (id: string) =>
    request<Subscription>(`/subscriptions/${id}/pause`, { method: "POST" }),

  resumeSubscription: (id: string) =>
    request<Subscription>(`/subscriptions/${id}/resume`, { method: "POST" }),

  getUpcoming: (days?: number) => {
    const query = days ? `?days=${days}` : "";
    return request<Subscription[]>(`/subscriptions/upcoming${query}`);
  },

  // Analytics
  getAnalytics: () => request<unknown>("/analytics/monthly-trend"),

  getCategoryBreakdown: () => request<unknown>("/analytics/category-breakdown"),

  getStats: () => request<DashboardData>("/dashboard"),

  getMonthlySpend: () => request<unknown>("/analytics/monthly-spend"),

  getSubscriptionStats: () => request<unknown>("/analytics/subscription-stats"),

  getTotalMonthlySpend: () => request<unknown>("/analytics/total-monthly-spend"),

  // Payments
  getPayments: (subscriptionId?: string) => {
    const query = subscriptionId ? `?subscriptionId=${subscriptionId}` : "";
    return request<Payment[]>(`/payments${query}`);
  },

  createPayment: (data: CreatePaymentPayload) =>
    request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Detection
  detectFromSms: (text: string) =>
    request<{ detectionLog: DetectionLog; parsed: Record<string, unknown>; suggestedAction: string }>(
      "/detect/sms",
      { method: "POST", body: JSON.stringify({ text }) },
    ),

  confirmDetection: (data: {
    detectionLogId: string;
    confirmed: boolean;
    name?: string;
    amount?: number;
    billingCycle?: string;
  }) =>
    request<{ message: string }>("/detect/confirm", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDetectionLogs: (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return request<DetectionLog[]>(`/detect/logs${query}`);
  },

  // Reminders
  getReminders: (subscriptionId: string) =>
    request<Reminder[]>(`/reminders/${subscriptionId}`),

  createReminder: (data: {
    subscriptionId: string;
    type: string;
    scheduledAt: string;
  }) =>
    request<Reminder>("/reminders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancelReminder: (id: string) =>
    request<void>(`/reminders/${id}`, { method: "DELETE" }),
};

export default api;
