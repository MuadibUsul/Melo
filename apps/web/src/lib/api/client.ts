const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  traceId?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  }).catch((error) => {
    if (error instanceof TypeError || (error instanceof Error && /failed to fetch/i.test(error.message))) {
      throw new ApiError(503, {
        code: "BACKEND_UNAVAILABLE",
        message: "\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002",
      });
    }
    throw error;
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ code: "INTERNAL", message: res.statusText }));
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export interface AuthResult {
  user: { id: string; displayName: string; email?: string | null; role: string; avatarKey?: string | null };
  accessToken: string;
}

export async function register(input: {
  email?: string;
  phone?: string;
  password: string;
  displayName: string;
}): Promise<AuthResult> {
  const result = await api.post<AuthResult>("/auth/register", input);
  setAccessToken(result.accessToken);
  return result;
}

export async function login(input: { identifier: string; password: string }): Promise<AuthResult> {
  const result = await api.post<AuthResult>("/auth/login", input);
  setAccessToken(result.accessToken);
  return result;
}

export async function refreshToken(): Promise<AuthResult> {
  const result = await api.post<AuthResult>("/auth/refresh");
  setAccessToken(result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
  setAccessToken(null);
}
