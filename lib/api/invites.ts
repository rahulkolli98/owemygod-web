import { getAccessToken } from "../auth-api";
import { API_BASE_URL } from "../config";

export class InviteApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InviteApiError";
    this.code = code;
  }
}

export interface InvitePreviewResponse {
  invite: {
    token: string;
    groupId: string;
    groupName: string;
    roleToAssign: "admin" | "member";
    expiresAt: string | null;
  };
  viewer: {
    authenticated: boolean;
    alreadyMember: boolean;
  };
}

export interface JoinInviteResponse {
  group: {
    id: string;
    name: string;
  };
  alreadyMember: boolean;
  joined: boolean;
}

async function invitesRequest<TData>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    withOptionalAuth?: boolean;
    withAuth?: boolean;
  }
): Promise<TData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const accessToken = getAccessToken();

  if (options?.withAuth && !accessToken) {
    throw new Error("You are not signed in.");
  }

  if ((options?.withAuth || options?.withOptionalAuth) && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: TData;
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new InviteApiError(
      payload.error?.code ?? "REQUEST_FAILED",
      payload.error?.message ?? "Request failed"
    );
  }

  return (payload.data ?? ({} as TData)) as TData;
}

export async function previewInvite(token: string): Promise<InvitePreviewResponse> {
  return invitesRequest<InvitePreviewResponse>(`/invites/${token}`, {
    method: "GET",
    withOptionalAuth: true,
  });
}

export async function joinInvite(token: string): Promise<JoinInviteResponse> {
  return invitesRequest<JoinInviteResponse>(`/invites/${token}/join`, {
    method: "POST",
    withAuth: true,
  });
}
