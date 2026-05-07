import { requestData } from "../auth-api";

export interface CreateSettlementInput {
  groupId: string;
  toUserId: string;
  amount: number;
  note?: string;
}

export interface SettlementResponse {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  currency: string;
  settled_at: string;
  note: string | null;
  created_by: string;
  status: "completed" | "void";
  created_at: string;
  updated_at: string;
}

export interface SettlementAllocationResponse {
  id: string;
  settlement_id: string;
  expense_split_id: string;
  amount_applied: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSettlementResponse {
  settlement: SettlementResponse;
  allocations: SettlementAllocationResponse[];
}

export interface ListSettlementsResponse {
  settlements: SettlementResponse[];
}

export interface DeleteSettlementResponse {
  message: string;
  settlement: SettlementResponse;
}

async function settlementsRequest<TData>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "DELETE";
    body?: unknown;
  }
): Promise<TData> {
  return requestData<TData>(path, {
    method: options?.method,
    body: options?.body,
    withAuth: true,
  });
}

export async function createSettlement(
  input: CreateSettlementInput
): Promise<CreateSettlementResponse> {
  return settlementsRequest<CreateSettlementResponse>("/settlements", {
    method: "POST",
    body: input,
  });
}

export async function listSettlements(groupId: string): Promise<ListSettlementsResponse> {
  const query = new URLSearchParams({ groupId });
  return settlementsRequest<ListSettlementsResponse>(`/settlements?${query.toString()}`);
}

export async function deleteSettlement(settlementId: string): Promise<DeleteSettlementResponse> {
  return settlementsRequest<DeleteSettlementResponse>(`/settlements/${settlementId}`, {
    method: "DELETE",
  });
}
