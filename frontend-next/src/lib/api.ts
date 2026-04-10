const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const getHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || "Request failed");
  }
  return res.json();
}

export const auth = {
  register: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>(res);
  },
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string };
    }>(res);
  },
  me: async () => {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
    return handleResponse<{ id: string; email: string }>(res);
  },
  logout: async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
    });
    return handleResponse<{ message: string }>(res);
  },
};

export const subscriptions = {
  getAll: async (params?: { status?: string; category?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    const res = await fetch(`${API_URL}/subscriptions${query}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },
  getById: async (id: string) => {
    const res = await fetch(`${API_URL}/subscriptions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },
  create: async (data: {
    name: string;
    amount: number;
    billingCycle: string;
    nextBillingDate: string;
    currency?: string;
    category?: string;
  }) => {
    const res = await fetch(`${API_URL}/subscriptions`, {
      method: "POST",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },
  update: async (
    id: string,
    data: Partial<{ name: string; amount: number; status: string }>,
  ) => {
    const res = await fetch(`${API_URL}/subscriptions/${id}`, {
      method: "PATCH",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },
  delete: async (id: string) => {
    const res = await fetch(`${API_URL}/subscriptions/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse<void>(res);
  },
  pause: async (id: string) => {
    const res = await fetch(`${API_URL}/subscriptions/${id}/pause`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },
  resume: async (id: string) => {
    const res = await fetch(`${API_URL}/subscriptions/${id}/resume`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },
  upcoming: async (days = 7) => {
    const res = await fetch(`${API_URL}/subscriptions/upcoming?days=${days}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },
};

export const analytics = {
  monthlySpend: async (months = 6) => {
    const res = await fetch(
      `${API_URL}/analytics/monthly-spend?months=${months}`,
      { headers: getHeaders() },
    );
    return handleResponse<any[]>(res);
  },
  categoryBreakdown: async () => {
    const res = await fetch(`${API_URL}/analytics/category-breakdown`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },
  subscriptionStats: async () => {
    const res = await fetch(`${API_URL}/analytics/subscription-stats`, {
      headers: getHeaders(),
    });
    return handleResponse<{ totalActive: number; totalPaused: number }>(res);
  },
  totalMonthlySpend: async () => {
    const res = await fetch(`${API_URL}/analytics/total-monthly-spend`, {
      headers: getHeaders(),
    });
    return handleResponse<{ total: number; currency: string }>(res);
  },
};

export const detection = {
  detectSms: async (text: string) => {
    const res = await fetch(`${API_URL}/detect/sms`, {
      method: "POST",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return handleResponse<any>(res);
  },
  confirm: async (
    detectionLogId: string,
    confirmed: boolean,
    data?: { name: string; amount: number; billingCycle?: string },
  ) => {
    const res = await fetch(`${API_URL}/detect/confirm`, {
      method: "POST",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ detectionLogId, confirmed, ...data }),
    });
    return handleResponse<{ message: string }>(res);
  },
  getLogs: async (status?: string) => {
    const query = status ? `?status=${status}` : "";
    const res = await fetch(`${API_URL}/detect/logs${query}`, {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },
};

export default { auth, subscriptions, analytics, detection };
