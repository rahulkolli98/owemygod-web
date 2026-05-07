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

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  accessToken: string;
  newPassword: string;
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

export type LogoutReason = "manual_signout" | "session_expired" | "session_revoked";

interface LogoutOptions {
  reason?: LogoutReason;
  redirectTo?: string;
  redirect?: boolean;
  emitEvent?: boolean;
}

interface RequestDataOptions {
  withAuth?: boolean;
  withOptionalAuth?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  rawBody?: BodyInit;
  jsonBody?: boolean;
  expectDataEnvelope?: boolean;
}

export class ApiRequestError extends Error {
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
const AUTH_SYNC_EVENT_KEY = "owemygod_auth_sync_event";
const TOKEN_REFRESH_BUFFER_SECONDS = 60;

type RefreshResult = {
  ok: boolean;
  reason: Exclude<LogoutReason, "manual_signout">;
};

let refreshInFlightPromise: Promise<RefreshResult> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
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

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as { exp?: number };
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpiringSoon(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + TOKEN_REFRESH_BUFFER_SECONDS;
}

function toApiError(payload: unknown): ApiError {
  const maybeError = (payload as { error?: ApiError })?.error;
  if (maybeError?.code && maybeError?.message) {
    return maybeError;
  }

  return {
    code: "REQUEST_FAILED",
    message: "Something went wrong. Please try again.",
  };
}

function getLogoutReasonFromErrorCode(code?: string): Exclude<LogoutReason, "manual_signout"> {
  if (code === "TOKEN_REVOKED" || code === "REFRESH_TOKEN_INVALID") {
    return "session_revoked";
  }

  return "session_expired";
}

function forceLogout(reason: "session_expired" | "session_revoked" = "session_expired") {
  runGlobalLogout({ reason });
}

function clearSessionScopedAppState() {
  if (!isBrowser()) {
    return;
  }

  const sessionKeysToClear: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith("owemygod_")) {
      sessionKeysToClear.push(key);
    }
  }

  sessionKeysToClear.forEach((key) => {
    window.sessionStorage.removeItem(key);
  });
}

function getReasonQueryValue(reason: LogoutReason): string {
  if (reason === "manual_signout") {
    return "signed_out";
  }

  return reason;
}

function buildLoginUrlForLogout(reason: LogoutReason): string {
  if (!isBrowser()) {
    return "/login";
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  const reasonParam = getReasonQueryValue(reason);
  return `/login?reason=${encodeURIComponent(reasonParam)}&next=${encodeURIComponent(nextPath)}`;
}

export function runGlobalLogout(options: LogoutOptions = {}): void {
  const reason = options.reason ?? "session_expired";
  const shouldRedirect = options.redirect ?? true;
  const shouldEmitEvent = options.emitEvent ?? true;

  clearAuthSession();
  clearSessionScopedAppState();

  if (!isBrowser()) {
    return;
  }

  if (shouldEmitEvent) {
    const syncPayload = JSON.stringify({
      type: "logout",
      reason,
      at: Date.now(),
    });
    window.localStorage.setItem(AUTH_SYNC_EVENT_KEY, syncPayload);

    window.dispatchEvent(
      new CustomEvent("owemygod:auth-logout", {
        detail: { reason },
      })
    );
  }

  if (!shouldRedirect) {
    return;
  }

  const targetUrl = options.redirectTo ?? buildLoginUrlForLogout(reason);
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (targetUrl === currentPath) {
    return;
  }

  window.location.href = targetUrl;
}

async function refreshAccessSession(): Promise<RefreshResult> {
  if (refreshInFlightPromise) {
    return refreshInFlightPromise;
  }

  refreshInFlightPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return {
        ok: false,
        reason: "session_expired",
      };
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      data?: AuthResponse;
      error?: ApiError;
    };

    if (!response.ok || !payload.data?.session?.accessToken) {
      return {
        ok: false,
        reason: getLogoutReasonFromErrorCode(payload.error?.code),
      };
    }

    saveAuthSession(payload.data.session);
    return {
      ok: true,
      reason: "session_expired",
    };
  })();

  try {
    return await refreshInFlightPromise;
  } finally {
    refreshInFlightPromise = null;
  }
}

async function resolveAccessToken(options: {
  required: boolean;
  optional: boolean;
  allowRefresh: boolean;
  forceLogoutOnFailure: boolean;
}): Promise<string | null> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    if (options.required) {
      throw new ApiRequestError({
        code: "UNAUTHORIZED",
        message: "You are not signed in.",
      });
    }

    return null;
  }

  const shouldTryRefresh = options.allowRefresh && isTokenExpiringSoon(accessToken);
  if (!shouldTryRefresh) {
    return accessToken;
  }

  const refreshResult = await refreshAccessSession();
  if (!refreshResult.ok) {
    if (options.forceLogoutOnFailure) {
      forceLogout(refreshResult.reason);
    }

    if (options.required) {
      throw new ApiRequestError({
        code: "TOKEN_EXPIRED",
        message: "Session expired. Please sign in again.",
      });
    }

    return null;
  }

  return getAccessToken();
}

async function doFetch<TData>(
  path: string,
  options: RequestDataOptions,
  token: string | null
): Promise<{
  response: Response;
  payload: { data?: TData; error?: ApiError } | TData;
}> {
  const headers: Record<string, string> = {};
  const useJsonBody = options.jsonBody ?? options.rawBody === undefined;

  if (useJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.rawBody !== undefined
        ? options.rawBody
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: TData;
    error?: ApiError;
  } | TData;

  return { response, payload };
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

async function requestData<TData>(
  path: string,
  options?: RequestDataOptions
): Promise<TData> {
  const requestOptions = options ?? {};
  const requiresAuth = !!requestOptions.withAuth;
  const hasOptionalAuth = !!requestOptions.withOptionalAuth;

  let token = await resolveAccessToken({
    required: requiresAuth,
    optional: hasOptionalAuth,
    allowRefresh: requiresAuth || hasOptionalAuth,
    forceLogoutOnFailure: requiresAuth,
  });

  let { response, payload } = await doFetch<TData>(path, requestOptions, token);

  if (response.status === 401 && (requiresAuth || hasOptionalAuth)) {
    const refreshResult = await refreshAccessSession();

    if (refreshResult.ok) {
      token = getAccessToken();
      ({ response, payload } = await doFetch<TData>(path, requestOptions, token));
    } else if (requiresAuth) {
      const responseLogoutReason = getLogoutReasonFromErrorCode(
        (payload as { error?: ApiError })?.error?.code
      );
      forceLogout(responseLogoutReason === "session_revoked" ? responseLogoutReason : refreshResult.reason);
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(toApiError(payload));
  }

  if (requestOptions.expectDataEnvelope === false) {
    return payload as TData;
  }

  return ((payload as { data?: TData })?.data ?? ({} as TData)) as TData;
}

export { requestData };

export async function signIn(input: SignInInput): Promise<AuthResponse> {
  return postAuth("/auth/signin", input);
}

export async function signUp(input: SignUpInput): Promise<AuthResponse> {
  return postAuth("/auth/signup", input);
}

export async function signOut(options?: LogoutOptions): Promise<void> {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    await postAuth("/auth/signout", {}, { withAuth: true });
  } finally {
    runGlobalLogout({
      reason: options?.reason ?? "manual_signout",
      redirectTo: options?.redirectTo,
      redirect: options?.redirect,
      emitEvent: options?.emitEvent,
    });
  }
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await postAuth("/auth/forgot-password", input);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await postAuth("/auth/reset-password", input);
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
