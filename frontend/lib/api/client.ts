const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? (
  process.env.NODE_ENV === "development" ? "http://localhost:8000" : null
);

const ACCESS_KEY = "hub_access_token";
const REFRESH_KEY = "hub_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  return isBrowser() ? window.localStorage.getItem(ACCESS_KEY) : null;
}

export function getRefreshToken(): string | null {
  return isBrowser() ? window.localStorage.getItem(REFRESH_KEY) : null;
}

export function setTokens(access: string, refresh: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!API_BASE_URL || !refresh) return null;

  const response = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string; refresh?: string };
  const nextRefresh = data.refresh ?? refresh;
  setTokens(data.access, nextRefresh);
  return data.access;
}

export async function login(username: string, password: string): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}/api/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  const data = (await response.json()) as { access: string; refresh: string };
  setTokens(data.access, data.refresh);
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  clearTokens();
  if (!API_BASE_URL || !refresh) return;
  await fetch(`${API_BASE_URL}/api/token/logout/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  }).catch(() => undefined);
}

async function request<T>(
  path: string,
  init: RequestInit,
  retried = false,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  const token = getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401 && !retried) {
    const next = await refreshAccessToken();
    if (next) return request<T>(path, init, true);
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: "GET" });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    ...init,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  return request<T>(path, {
    ...init,
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
