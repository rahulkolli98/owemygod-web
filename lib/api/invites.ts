import { ApiRequestError, requestData } from "../auth-api";

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
  try {
    return await requestData<TData>(path, {
      method: options?.method,
      withAuth: options?.withAuth,
      withOptionalAuth: options?.withOptionalAuth,
    });
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new InviteApiError(error.code, error.message);
    }

    throw new InviteApiError("REQUEST_FAILED", "Request failed");
  }
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
