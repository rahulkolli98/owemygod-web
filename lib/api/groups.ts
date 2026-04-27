import { getAccessToken, getApiErrorMessage } from "../auth-api";
import { GroupListItem, GroupResponse } from "../auth-api";

export type { GroupListItem, GroupResponse };
export interface CreateGroupInput {
  name: string;
  description?: string;
  defaultCurrency?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  defaultCurrency?: string;
}

export interface GroupInviteLinkResponse {
  invite: {
    token: string;
    groupId: string;
    groupName: string;
    roleToAssign: "admin" | "member";
    expiresAt: string | null;
  };
}

import { API_BASE_URL } from "../config";

async function groupsRequest<TData>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  }
): Promise<TData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: TData;
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  return (payload.data ?? ({} as TData)) as TData;
}

export async function createGroup(input: CreateGroupInput): Promise<{ group: GroupResponse }> {
  return groupsRequest<{ group: GroupResponse }>("/groups", {
    method: "POST",
    body: input,
  });
}

export async function getGroups(): Promise<{ groups: GroupListItem[] }> {
  return groupsRequest<{ groups: GroupListItem[] }>("/groups", {
    method: "GET",
  });
}

export async function getGroupById(groupId: string): Promise<{ group: GroupResponse; members: any[] }> {
  return groupsRequest<{ group: GroupResponse; members: any[] }>(`/groups/${groupId}`, {
    method: "GET",
  });
}

export async function updateGroup(
  groupId: string,
  input: UpdateGroupInput
): Promise<{ group: GroupResponse }> {
  return groupsRequest<{ group: GroupResponse }>(`/groups/${groupId}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteGroup(
  groupId: string
): Promise<{ message: string; group: { id: string; is_active: boolean; archived_at: string | null; updated_at: string } }> {
  return groupsRequest<{ message: string; group: { id: string; is_active: boolean; archived_at: string | null; updated_at: string } }>(
    `/groups/${groupId}`,
    {
      method: "DELETE",
    }
  );
}

export async function createGroupInviteLink(groupId: string): Promise<GroupInviteLinkResponse> {
  return groupsRequest<GroupInviteLinkResponse>(`/groups/${groupId}/invite-link`, {
    method: "POST",
  });
}
