export interface ApiError {
  code: string;
  message: string;
}

export interface AuthSession {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthUser {
  id?: string;
  email?: string;
}

export interface AuthResponse {
  user?: AuthUser;
  session?: AuthSession;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  fullName: string;
  displayName: string;
  email: string;
  password: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  defaultCurrency?: string;
}

export interface GroupResponse {
  id: string;
  name: string;
  description: string | null;
  default_currency: string;
  created_by: string;
  is_active: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupListItem extends GroupResponse {
  member_role: "owner" | "admin" | "member";
}

const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

interface PostAuthOptions {
  withAuth?: boolean;
}

interface RequestDataOptions {
  withAuth?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

class ApiRequestError extends Error {
  code: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.code = error.code;
  }
}

import { API_BASE_URL } from "./config";
const ACCESS_TOKEN_KEY = "owemygod_access_token";
const REFRESH_TOKEN_KEY = "owemygod_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAuthSession(session?: AuthSession): void {
  if (!isBrowser()) {
    return;
  }

  if (!session?.accessToken) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);

  if (session.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  }
}

export function clearAuthSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function postAuth<TBody extends object>(
  path: string,
  body: TBody,
  options?: PostAuthOptions
): Promise<AuthResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.withAuth) {
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new ApiRequestError({
        code: "UNAUTHORIZED",
        message: "You are not signed in.",
      });
    }

    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: AuthResponse;
    error?: ApiError;
  };

  if (!response.ok) {
    throw new ApiRequestError(
      payload.error ?? {
        code: "REQUEST_FAILED",
        message: "Something went wrong. Please try again.",
      }
    );
  }

  return payload.data ?? {};
}

async function postData<TBody extends object, TData>(
  path: string,
  body: TBody,
  options?: PostAuthOptions
): Promise<TData> {
  return requestData<TData>(path, {
    method: "POST",
    body,
    withAuth: options?.withAuth,
  });
}

async function requestData<TData>(
  path: string,
  options?: RequestDataOptions & {
    body?: unknown;
  }
): Promise<TData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.withAuth) {
    const accessToken = getAccessToken();

    if (!accessToken) {
      throw new ApiRequestError({
        code: "UNAUTHORIZED",
        message: "You are not signed in.",
      });
    }

    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: TData;
    error?: ApiError;
  };

  if (!response.ok) {
    throw new ApiRequestError(
      payload.error ?? {
        code: "REQUEST_FAILED",
        message: "Something went wrong. Please try again.",
      }
    );
  }

  return (payload.data ?? ({} as TData)) as TData;
}

export async function signIn(input: SignInInput): Promise<AuthResponse> {
  return postAuth("/auth/signin", input);
}

export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  return postAuth("/auth/signup", input);
}

export async function signOut(): Promise<void> {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    await postAuth("/auth/signout", {}, { withAuth: true });
  } finally {
    clearAuthSession();
  }
}

export function getApiErrorMessage(error: unknown): string {
  const toFriendlyMessage = (rawMessage: string) => {
    const message = rawMessage.replace(UUID_REGEX, "this record");

    if (/settlement/i.test(message) && /does not exist/i.test(message)) {
      return "That settlement could not be found. Please refresh and try again.";
    }

    return message;
  };

  if (error instanceof ApiRequestError) {
    return toFriendlyMessage(error.message);
  }
  if (error instanceof Error) {
    return toFriendlyMessage(error.message);
  }
  return "Something went wrong. Please try again.";
}

/**
 * Decode the Supabase JWT stored in localStorage to extract the current user's ID (sub claim).
 * Safe to call in client components only.
 */
export function getCurrentUserId(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}
