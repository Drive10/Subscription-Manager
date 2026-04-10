const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3001/api/v1`;
  }
  return "http://localhost:3001/api/v1";
};

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("accessToken");
  }
  return null;
};

const getHeaders = (): Record<string, string> => {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

const extractData = (json: any) => {
  if (json.data?.data !== undefined) {
    return json.data.data;
  }
  return json.data;
};

export const api = {
  getDashboard: async () => {
    const res = await fetch(`${getApiUrl()}/dashboard`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    const json = await res.json();
    return extractData(json);
  },

  getSubscriptions: async (params?: { status?: string; category?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    const res = await fetch(`${getApiUrl()}/subscriptions${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch subscriptions");
    const json = await res.json();
    return extractData(json);
  },

  createSubscription: async (data: {
    name: string;
    amount: number;
    billingCycle: string;
    nextBillingDate: string;
    category?: string;
  }) => {
    const res = await fetch(`${getApiUrl()}/subscriptions`, {
      method: "POST",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create subscription");
    const json = await res.json();
    return extractData(json);
  },

  getAnalytics: async () => {
    const res = await fetch(`${getApiUrl()}/analytics/monthly-trend`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    const json = await res.json();
    return extractData(json);
  },

  getCategoryBreakdown: async () => {
    const res = await fetch(`${getApiUrl()}/analytics/category-wise`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch category breakdown");
    const json = await res.json();
    return extractData(json);
  },

  getStats: async () => {
    const res = await fetch(`${getApiUrl()}/dashboard`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    const json = await res.json();
    return extractData(json);
  },
};

export default api;