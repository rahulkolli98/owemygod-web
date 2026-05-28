import { requestData } from "../auth-api";

export interface ExpenseResponse {
  id: string;
  group_id: string;
  created_by: string;
  paid_by: string;
  amount_total: number;
  currency: string;
  description: string;
  category: string | null;
  expense_date: string;
  split_type: "equal" | "custom" | "percentage" | "shares";
  receipt_url: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  settled_amount: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseDetails extends ExpenseResponse {
  splits: ExpenseSplit[];
}

/** Returned by the list endpoint — includes splits for balance calculation */
export interface ExpenseListItem extends ExpenseResponse {
  expense_splits: Array<{
    id: string;
    user_id: string;
    amount_owed: number;
    settled_amount: number;
  }>;
}

export interface CreateExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  expenseDate: string;
  splitType: "equal" | "custom" | "percentage" | "shares";
  participants: string[];
  splits?: Record<string, number>;
  category?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  paidBy?: string;
  expenseDate?: string;
  splitType?: "equal" | "custom" | "percentage" | "shares";
  participants?: string[];
  splits?: Record<string, number>;
  category?: string;
  notes?: string;
  receiptUrl?: string;
}

// NOTE: expense controllers return { expense } / { expenses } directly (no { data: ... } wrapper)
async function expensesRequest<TData>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  }
): Promise<TData> {
  return requestData<TData>(path, {
    method: options?.method,
    body: options?.body,
    withAuth: true,
    expectDataEnvelope: false,
  });
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<{ expense: ExpenseDetails }> {
  return expensesRequest<{ expense: ExpenseDetails }>("/expenses", {
    method: "POST",
    body: input,
  });
}

export async function getExpense(
  expenseId: string
): Promise<{ expense: ExpenseDetails }> {
  return expensesRequest<{ expense: ExpenseDetails }>(`/expenses/${expenseId}`);
}

/** List all expenses for a group, each including their splits. */
export async function listExpenses(
  groupId: string
): Promise<{ expenses: ExpenseListItem[] }> {
  return expensesRequest<{ expenses: ExpenseListItem[] }>(
    `/expenses?groupId=${encodeURIComponent(groupId)}`
  );
}

export async function updateExpense(
  expenseId: string,
  input: UpdateExpenseInput
): Promise<{ expense: ExpenseDetails }> {
  return expensesRequest<{ expense: ExpenseDetails }>(`/expenses/${expenseId}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteExpense(
  expenseId: string
): Promise<{ message: string; expense: ExpenseResponse }> {
  return expensesRequest<{ message: string; expense: ExpenseResponse }>(
    `/expenses/${expenseId}`,
    { method: "DELETE" }
  );
}
