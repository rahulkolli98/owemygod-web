"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareInviteButton } from "@/components/groups/ShareInviteButton";
import { ExpenseActions } from "@/components/expenses/ExpenseActions";
import {
  createSettlement,
  deleteSettlement,
  listSettlements,
  type SettlementResponse,
} from "@/lib/api/settlements";
import { getApiErrorMessage, getCurrentUserId } from "@/lib/auth-api";
import type { Group } from "@/lib/mock-data";

interface GroupDetailClientProps {
  group: Group;
  onExpenseDeleted?: () => Promise<void> | void;
}

interface Balance {
  from: string;
  to: string;
  amount: number;
}

interface SettleTarget {
  name: string;
  userId: string | null;
  amount: number;
  type: "you-owe" | "owes-you";
}

function calculateBalances(
  group: Group,
  options?: {
    settlements?: SettlementResponse[];
    memberNameById?: Map<string, string>;
  }
): Balance[] {
  const ledger: Record<string, Record<string, number>> = {};

  // Initialize ledger for all members
  for (const member of group.members) {
    ledger[member] = {};
    for (const other of group.members) {
      if (member !== other) {
        ledger[member][other] = 0;
      }
    }
  }

  // Process each expense
  for (const expense of group.expenses) {
    if (expense.splitDetails && expense.splitDetails.length > 0) {
      for (const split of expense.splitDetails) {
        const amountOwed = Number(Number(split.amountOwed).toFixed(2));
        if (amountOwed <= 0) continue;
        if (split.userName === expense.paidBy) continue;

        ledger[split.userName][expense.paidBy] =
          (ledger[split.userName][expense.paidBy] ?? 0) + amountOwed;
      }
      continue;
    }

    const share = expense.amount / expense.participants.length;

    for (const participant of expense.participants) {
      if (participant === expense.paidBy) continue;
      // participant owes to paidBy
      ledger[participant][expense.paidBy] = (ledger[participant][expense.paidBy] ?? 0) + share;
    }
  }

  const settlements = options?.settlements ?? [];
  const memberNameById = options?.memberNameById;

  // Apply completed settlements as debt reductions without global simplification.
  for (const settlement of settlements) {
    if (settlement.status !== "completed") continue;

    const fromName = memberNameById?.get(settlement.from_user_id);
    const toName = memberNameById?.get(settlement.to_user_id);
    if (!fromName || !toName || fromName === toName) continue;

    if (!ledger[fromName]) ledger[fromName] = {};
    if (!ledger[toName]) ledger[toName] = {};

    const reduction = Number(Number(settlement.amount).toFixed(2));
    const currentDebt = Number((ledger[fromName][toName] ?? 0).toFixed(2));
    const nextDebt = Number((currentDebt - reduction).toFixed(2));

    if (nextDebt >= 0) {
      ledger[fromName][toName] = nextDebt;
      continue;
    }

    // Safety fallback: if payment exceeds tracked debt edge, carry the remainder as reverse debt.
    ledger[fromName][toName] = 0;
    ledger[toName][fromName] = Number(((ledger[toName][fromName] ?? 0) + Math.abs(nextDebt)).toFixed(2));
  }

  // Extract balances (only positive amounts)
  const balances: Balance[] = [];
  for (const [from, debts] of Object.entries(ledger)) {
    for (const [to, amount] of Object.entries(debts)) {
      if (amount > 0) {
        balances.push({ from, to, amount });
      }
    }
  }

  return balances;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function GroupDetailClient({ group, onExpenseDeleted }: GroupDetailClientProps) {
  const currencyCode = (group.currency ?? "USD").toUpperCase();
  const [settleUpOpen, setSettleUpOpen] = useState(false);
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [totalsOpen, setTotalsOpen] = useState(false);
  const [selectedSettleTarget, setSelectedSettleTarget] = useState<SettleTarget | null>(null);
  const [settleMessage, setSettleMessage] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [settleError, setSettleError] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [settlements, setSettlements] = useState<SettlementResponse[]>([]);
  const [settlementHistoryLoading, setSettlementHistoryLoading] = useState(false);
  const [settlementHistoryError, setSettlementHistoryError] = useState<string | null>(null);
  const [undoingSettlementId, setUndoingSettlementId] = useState<string | null>(null);

  const currentUserId = getCurrentUserId();

  const memberIdByName = new Map((group.memberDirectory ?? []).map((member) => [member.name, member.id]));
  const memberNameById = new Map((group.memberDirectory ?? []).map((member) => [member.id, member.name]));
  const total = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  const balances = calculateBalances(group, {
    settlements,
    memberNameById,
  });
  const groupBalances = [...balances].sort((a, b) => b.amount - a.amount);

  const memberSummaries = group.members
    .map((member) => {
      const receives = groupBalances
        .filter((b) => b.to === member)
        .reduce((sum, b) => sum + b.amount, 0);
      const owes = groupBalances
        .filter((b) => b.from === member)
        .reduce((sum, b) => sum + b.amount, 0);
      const net = receives - owes;

      const details = groupBalances
        .filter((b) => b.from === member || b.to === member)
        .map((b) => {
          if (b.from === member) {
            return {
              id: `${b.from}-${b.to}-${b.amount}`,
              label: `owes ${b.to}`,
              amount: b.amount,
              tone: "owes" as const,
            };
          }

          return {
            id: `${b.from}-${b.to}-${b.amount}`,
            label: `gets back from ${b.from}`,
            amount: b.amount,
            tone: "gets" as const,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      return { member, net, details };
    })
    .filter((item) => item.net !== 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  // Your net balances per person
  const netByPerson: Record<string, number> = {};
  for (const balance of balances) {
    if (balance.from === "You") {
      netByPerson[balance.to] = (netByPerson[balance.to] ?? 0) - balance.amount;
    }
    if (balance.to === "You") {
      netByPerson[balance.from] = (netByPerson[balance.from] ?? 0) + balance.amount;
    }
  }

  const youOweList = Object.entries(netByPerson)
    .filter(([, amount]) => amount < 0)
    .map(([name, amount]) => ({
      name,
      userId: memberIdByName.get(name) ?? null,
      amount: Math.abs(amount),
    }))
    .sort((a, b) => b.amount - a.amount);

  const oweYouList = Object.entries(netByPerson)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => ({
      name,
      userId: memberIdByName.get(name) ?? null,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const youOwe = youOweList.reduce((sum, item) => sum + item.amount, 0);
  const owedToYou = oweYouList.reduce((sum, item) => sum + item.amount, 0);

  // Group expenses by month
  const expensesByMonth: Record<string, typeof group.expenses> = {};
  for (const expense of group.expenses) {
    const dateObj = new Date(expense.date);
    const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    if (!expensesByMonth[key]) {
      expensesByMonth[key] = [];
    }
    expensesByMonth[key].push(expense);
  }

  const sortedMonths = Object.keys(expensesByMonth).sort().reverse();
  const yourShare = group.expenses.reduce((sum, expense) => {
    if (!expense.participants.includes("You")) return sum;
    return sum + expense.amount / expense.participants.length;
  }, 0);
  const othersShare = Math.max(total - yourShare, 0);
  const yourSharePercent = total > 0 ? Math.round((yourShare / total) * 100) : 0;

  const displayedSettlements = [...settlements]
    .filter((item) => item.status === "completed")
    .sort((a, b) => new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime());

  function formatMemberName(userId: string) {
    return memberNameById.get(userId) ?? `${userId.slice(0, 8)}...`;
  }

  async function refreshSettlements() {
    setSettlementHistoryLoading(true);
    setSettlementHistoryError(null);

    try {
      const response = await listSettlements(group.id);
      setSettlements(response.settlements ?? []);
    } catch (error) {
      setSettlementHistoryError(getApiErrorMessage(error));
    } finally {
      setSettlementHistoryLoading(false);
    }
  }

  useEffect(() => {
    void refreshSettlements();
  }, [group.id]);

  function closeSettleUpModal() {
    setSettleUpOpen(false);
    setSelectedSettleTarget(null);
    setSettleMessage("");
    setSettleAmount("");
    setSettleError(null);
  }

  function closeBalancesModal() {
    setBalancesOpen(false);
  }

  function closeTotalsModal() {
    setTotalsOpen(false);
  }

  async function handleConfirmSettleUp() {
    if (!selectedSettleTarget) return;
    if (selectedSettleTarget.type !== "you-owe") {
      setSettleError("For now, only payments where you owe can be recorded from this account.");
      return;
    }
    if (!selectedSettleTarget.userId) {
      setSettleError("Unable to resolve this member for settlement.");
      return;
    }

    const amount = Number(settleAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setSettleError("Enter a valid amount greater than 0.");
      return;
    }

    setIsSettling(true);
    setSettleError(null);

    try {
      await createSettlement({
        groupId: group.id,
        toUserId: selectedSettleTarget.userId,
        amount,
        note: settleMessage.trim() || undefined,
      });

      await refreshSettlements();
      await onExpenseDeleted?.();
      closeSettleUpModal();
    } catch (error) {
      setSettleError(getApiErrorMessage(error));
      setIsSettling(false);
    }
  }

  async function handleUndoSettlement(settlementId: string) {
    setUndoingSettlementId(settlementId);
    setSettlementHistoryError(null);

    try {
      await deleteSettlement(settlementId);
      await refreshSettlements();
      await onExpenseDeleted?.();
    } catch (error) {
      setSettlementHistoryError(getApiErrorMessage(error));
    } finally {
      setUndoingSettlementId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header: Title + Total + Members - back to left/right layout */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-sm text-muted-foreground">
            {group.members.join(", ")} · Total {formatCurrency(total, currencyCode)}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <ShareInviteButton groupId={group.id} />
          <Link
            href={`/groups/${group.id}/expenses/new`}
            className={cn(buttonVariants())}
          >
            + Add expense
          </Link>
        </div>
      </div>

      {/* Balance summary - centered only */}
      <div className="flex justify-center">
        <div className="space-y-3 text-center max-w-xl">
          {youOwe > 0 && (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-destructive">
                You owe {formatCurrency(youOwe, currencyCode)} overall
              </p>
              <div className="space-y-0.5">
                {youOweList.map((item) => (
                  <p key={`you-owe-${item.name}`} className="text-sm text-muted-foreground">
                    You owe {item.name} <span className="text-destructive">{formatCurrency(item.amount, currencyCode)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {owedToYou > 0 && (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-success">
                You get back {formatCurrency(owedToYou, currencyCode)} overall
              </p>
              <div className="space-y-0.5">
                {oweYouList.map((item) => (
                  <p key={`owes-you-${item.name}`} className="text-sm text-muted-foreground">
                    {item.name} owes you <span className="text-success">{formatCurrency(item.amount, currencyCode)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {youOwe === 0 && owedToYou === 0 && (
            <p className="text-sm text-muted-foreground">All settled up!</p>
          )}
        </div>
      </div>

      {/* Action chips */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            closeBalancesModal();
            closeTotalsModal();
            setSettleUpOpen(true);
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full text-sm"
          )}
        >
          Settle up
        </button>
        <button
          onClick={() => {
            closeSettleUpModal();
            closeTotalsModal();
            setBalancesOpen(true);
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full text-sm"
          )}
        >
          Balances
        </button>
        <button
          onClick={() => {
            closeSettleUpModal();
            closeBalancesModal();
            setTotalsOpen(true);
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full text-sm"
          )}
        >
          Total
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent settlements</h2>
          <button
            onClick={() => void refreshSettlements()}
            className={cn(buttonVariants({ variant: "ghost" }), "h-8 px-2 text-xs")}
            disabled={settlementHistoryLoading || !!undoingSettlementId}
          >
            Refresh
          </button>
        </div>

        {settlementHistoryError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {settlementHistoryError}
          </p>
        )}

        {settlementHistoryLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : displayedSettlements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No settlements recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {displayedSettlements.slice(0, 10).map((settlement) => {
              const fromName = formatMemberName(settlement.from_user_id);
              const toName = formatMemberName(settlement.to_user_id);
              const isMine = settlement.created_by === currentUserId;

              return (
                <div
                  key={settlement.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{fromName}</span> paid{" "}
                      <span className="font-medium">{toName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(settlement.settled_at).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isMine ? " · by you" : ""}
                    </p>
                    {settlement.note ? (
                      <p className="text-xs text-muted-foreground">{settlement.note}</p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(settlement.amount, settlement.currency || currencyCode)}
                    </p>
                    <button
                      onClick={() => void handleUndoSettlement(settlement.id)}
                      className={cn(buttonVariants({ variant: "outline" }), "h-8 px-2 text-xs")}
                      disabled={undoingSettlementId === settlement.id}
                    >
                      {undoingSettlementId === settlement.id ? "Undoing..." : "Undo"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expenses grouped by month */}
      {group.expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-muted-foreground text-sm">No expenses yet.</p>
          <Link
            href={`/groups/${group.id}/expenses/new`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Add first expense
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((monthKey) => {
            const [year, month] = monthKey.split("-");
            const monthLabel = `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`;
            const expenses = expensesByMonth[monthKey];

            return (
              <div key={monthKey} className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {monthLabel}
                </p>
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:bg-muted/50 transition-colors"
                    >
                      <Link
                        href={`/groups/${group.id}/expenses/${expense.id}/edit`}
                        className="block min-w-0 flex-1 space-y-0.5"
                      >
                        <p className="font-medium text-foreground">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Paid by {expense.paidBy} · {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Split: {expense.participants.join(", ")}
                        </p>
                      </Link>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(expense.amount, currencyCode)}
                        </p>
                        <ExpenseActions expenseId={expense.id} onDeleted={onExpenseDeleted} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {settleUpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={closeSettleUpModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {!selectedSettleTarget ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Select a balance to settle</h2>
                  <button
                    onClick={closeSettleUpModal}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You owe</p>
                    {youOweList.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nothing to settle.</p>
                    ) : (
                      <div className="space-y-2">
                        {youOweList.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => {
                              setSelectedSettleTarget({ ...item, type: "you-owe" });
                              setSettleAmount(item.amount.toFixed(2));
                              setSettleError(null);
                            }}
                            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/50"
                          >
                            <p className="text-sm text-foreground">{item.name}</p>
                            <p className="text-sm font-semibold text-destructive">{formatCurrency(item.amount, currencyCode)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owes you</p>
                    {oweYouList.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No one owes you right now.</p>
                    ) : (
                      <div className="space-y-2">
                        {oweYouList.map((item) => (
                          <button
                            key={item.name}
                            onClick={() => {
                              setSelectedSettleTarget({ ...item, type: "owes-you" });
                              setSettleAmount(item.amount.toFixed(2));
                              setSettleError(null);
                            }}
                            className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left hover:bg-muted/50"
                          >
                            <p className="text-sm text-foreground">{item.name}</p>
                            <p className="text-sm font-semibold text-success">{formatCurrency(item.amount, currencyCode)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Settle up with {selectedSettleTarget.name}</h2>
                  <button
                    onClick={() => {
                      setSelectedSettleTarget(null);
                      setSettleMessage("");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Back
                  </button>
                </div>

                <div className="rounded-lg border border-border px-4 py-3 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {selectedSettleTarget.type === "you-owe" ? "You pay" : "You receive"}
                  </p>
                  <div className="flex items-center rounded-md border border-input bg-background">
                    <span className="px-3 text-sm text-muted-foreground border-r border-input select-none">
                      {formatCurrency(0, currencyCode).replace(/[0.,\s]/g, "") || currencyCode}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      className="w-full bg-transparent px-3 py-2 text-xl font-bold outline-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Max: {formatCurrency(selectedSettleTarget.amount, currencyCode)}
                  </p>
                </div>

                {settleError && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {settleError}
                  </p>
                )}

                <div className="space-y-2">
                  <label htmlFor="settle-note" className="text-sm font-medium text-foreground">
                    Message (optional)
                  </label>
                  <textarea
                    id="settle-note"
                    rows={3}
                    value={settleMessage}
                    onChange={(e) => setSettleMessage(e.target.value)}
                    placeholder="e.g. Paid via UPI / bank transfer on another app"
                    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedSettleTarget(null);
                      setSettleMessage("");
                      setSettleAmount("");
                      setSettleError(null);
                    }}
                    className={cn(buttonVariants({ variant: "outline" }))}
                    disabled={isSettling}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSettleUp}
                    className={cn(buttonVariants())}
                    disabled={isSettling}
                  >
                    {isSettling ? "Saving…" : "Mark as settled"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {balancesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={closeBalancesModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">All balances in {group.name}</h2>
              <button
                onClick={closeBalancesModal}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            {memberSummaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">All settled up in this group.</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {memberSummaries.map((summary) => (
                  <div
                    key={summary.member}
                    className="rounded-lg border border-border px-3 py-3 space-y-2"
                  >
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{summary.member}</span>
                      <span className="text-muted-foreground"> </span>
                      <span className={summary.net < 0 ? "text-destructive" : "text-success"}>
                        {summary.net < 0 ? "owes" : "gets back"} {formatCurrency(Math.abs(summary.net), currencyCode)}
                      </span>
                      <span className="text-muted-foreground"> in total</span>
                    </p>

                    <div className="space-y-1">
                      {summary.details.map((detail) => (
                        <div key={detail.id} className="flex items-center justify-between text-xs text-muted-foreground">
                          <p>{detail.label}</p>
                          <p className={detail.tone === "owes" ? "text-destructive" : "text-success"}>
                            {formatCurrency(detail.amount, currencyCode)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {totalsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={closeTotalsModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Group totals</h2>
              <button
                onClick={closeTotalsModal}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
              <div className="flex justify-center">
                <div
                  className="h-44 w-44 rounded-full border border-border"
                  style={{
                    background: `conic-gradient(var(--color-primary) ${yourSharePercent}%, color-mix(in oklab, var(--color-primary) 24%, white) ${yourSharePercent}% 100%)`,
                  }}
                >
                  <div className="m-6 flex h-[128px] w-[128px] items-center justify-center rounded-full bg-background border border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total spent</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(total, currencyCode)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <p className="text-sm font-medium text-foreground">Your share</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(yourShare, currencyCode)}</p>
                  <p className="text-xs text-muted-foreground">{yourSharePercent}% of total</p>
                </div>

                <div className="rounded-lg border border-border px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
                    <p className="text-sm font-medium text-foreground">Others' share</p>
                  </div>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(othersShare, currencyCode)}</p>
                  <p className="text-xs text-muted-foreground">{100 - yourSharePercent}% of total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
