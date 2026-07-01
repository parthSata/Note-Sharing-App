const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

function buildUrl(endpoint: string) {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${baseUrl}${path}`;
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("auth_token");
}

function clearAuthAndRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.clear();
  window.location.assign("/login");
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export async function apiFetch<TResponse>(
  endpoint: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const headers = new Headers(options.headers);
  const token = getAuthToken();

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers,
  });
  const data = (await parseJsonResponse(response)) as TResponse & ApiErrorResponse;

  if (response.status === 401) {
    clearAuthAndRedirect();
  }

  if (!response.ok) {
    const code = data?.error?.code ?? `HTTP_${response.status}`;
    const message = data?.error?.message ?? response.statusText;

    throw new ApiError(code, message, response.status);
  }

  return data as TResponse;
}

export const api = {
  get: <TResponse>(endpoint: string, options?: RequestInit) =>
    apiFetch<TResponse>(endpoint, { ...options, method: "GET" }),

  post: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: RequestInit) =>
    apiFetch<TResponse>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  patch: <TResponse, TBody = unknown>(endpoint: string, body?: TBody, options?: RequestInit) =>
    apiFetch<TResponse>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <TResponse>(endpoint: string, options?: RequestInit) =>
    apiFetch<TResponse>(endpoint, { ...options, method: "DELETE" }),
};
