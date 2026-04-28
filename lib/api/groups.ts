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

export interface GroupTotalSpentMetric {
  groupId: string;
  totalSpent: number;
  currency: string;
}

export interface GroupYourShareMetric {
  groupId: string;
  yourShare: number;
  currency: string;
}

export type GroupNetBalanceStatus = "owed_to_you" | "you_owe" | "settled";

export interface GroupNetBalanceMetric {
  groupId: string;
  netBalance: number;
  creditAmount: number;
  debitAmount: number;
  currency: string;
  status: GroupNetBalanceStatus;
}

export interface GroupTopCategoryMetric {
  groupId: string;
  category: string | null;
  amount: number;
  currency: string;
}

export interface GroupMonthlyExpensePoint {
  monthKey: string;
  year: number;
  month: number;
  totalAmount: number;
}

export interface GroupMonthlyExpensesMetric {
  groupId: string;
  currency: string;
  months: GroupMonthlyExpensePoint[];
}

export interface GroupCategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface GroupCategoryBreakdownMetric {
  groupId: string;
  currency: string;
  totalSpent: number;
  categories: GroupCategoryBreakdownItem[];
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

export async function getGroupTotalSpentMetric(groupId: string): Promise<GroupTotalSpentMetric> {
  return groupsRequest<GroupTotalSpentMetric>(`/groups/${groupId}/metrics/total-spent`, {
    method: "GET",
  });
}

export async function getGroupYourShareMetric(groupId: string): Promise<GroupYourShareMetric> {
  return groupsRequest<GroupYourShareMetric>(`/groups/${groupId}/metrics/your-share`, {
    method: "GET",
  });
}

export async function getGroupNetBalanceMetric(groupId: string): Promise<GroupNetBalanceMetric> {
  return groupsRequest<GroupNetBalanceMetric>(`/groups/${groupId}/metrics/net-balance`, {
    method: "GET",
  });
}

export async function getGroupTopCategoryMetric(groupId: string): Promise<GroupTopCategoryMetric> {
  return groupsRequest<GroupTopCategoryMetric>(`/groups/${groupId}/metrics/top-category`, {
    method: "GET",
  });
}

export async function getGroupMonthlyExpensesMetric(groupId: string): Promise<GroupMonthlyExpensesMetric> {
  return groupsRequest<GroupMonthlyExpensesMetric>(`/groups/${groupId}/metrics/monthly-expenses`, {
    method: "GET",
  });
}

export async function getGroupCategoryBreakdownMetric(groupId: string): Promise<GroupCategoryBreakdownMetric> {
  return groupsRequest<GroupCategoryBreakdownMetric>(`/groups/${groupId}/metrics/category-breakdown`, {
    method: "GET",
  });
}
