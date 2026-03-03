const API_BASE = "https://instagrowth-saas-production.up.railway.app";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ig_token");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  getAccounts: () => apiFetch<{ accounts: import("./types").Account[] }>("/api/accounts"),
  deleteAccount: (id: string) => apiFetch(`/api/accounts/${id}`, { method: "DELETE" }),
  getMetrics: (range?: string) => apiFetch<{ metrics: import("./types").Metric[] }>(`/api/metrics${range ? `?range=${range}` : ""}`),
  getAffinityTargets: () => apiFetch<{ targets: import("./types").AffinityTarget[] }>("/api/affinity/targets"),
  adjustAffinity: (aggressiveness: number) => apiFetch("/api/affinity/adjust", { method: "POST", body: JSON.stringify({ aggressiveness }) }),
  getAgentDuties: () => apiFetch<{ duties: import("./types").AgentDuty[] }>("/api/agent-duties"),
  approveDuty: (id: string) => apiFetch(`/api/agent-duties/${id}/approve`, { method: "PATCH" }),
  denyDuty: (id: string) => apiFetch(`/api/agent-duties/${id}/deny`, { method: "PATCH" }),
};
