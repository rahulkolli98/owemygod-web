"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import { getApiErrorMessage } from "@/lib/auth-api";
import {
  getAllGroupsCategoryBreakdownMetric,
  getAllGroupsMonthlyExpensesMetric,
  getAllGroupsNetBalanceMetric,
  getAllGroupsTopCategoryMetric,
  getAllGroupsTotalSpentMetric,
  getAllGroupsYourShareMetric,
  getGroupCategoryBreakdownMetric,
  getGroupMonthlyExpensesMetric,
  getGroupNetBalanceMetric,
  getGroups,
  getGroupTopCategoryMetric,
  getGroupTotalSpentMetric,
  getGroupYourShareMetric,
  GroupCategoryBreakdownMetric,
  GroupListItem,
  GroupMonthlyExpensesMetric,
  GroupNetBalanceMetric,
  GroupTopCategoryMetric,
  GroupTotalSpentMetric,
  GroupYourShareMetric,
} from "@/lib/api/groups";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatINR(amount: number) {
  return `₹${Math.round(Math.abs(amount)).toLocaleString("en-IN")}`;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function DashboardClient() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [totalSpentMetric, setTotalSpentMetric] = useState<GroupTotalSpentMetric | null>(null);
  const [yourShareMetric, setYourShareMetric] = useState<GroupYourShareMetric | null>(null);
  const [netBalanceMetric, setNetBalanceMetric] = useState<GroupNetBalanceMetric | null>(null);
  const [topCategoryMetric, setTopCategoryMetric] = useState<GroupTopCategoryMetric | null>(null);
  const [monthlyExpensesMetric, setMonthlyExpensesMetric] = useState<GroupMonthlyExpensesMetric | null>(null);
  const [categoryBreakdownMetric, setCategoryBreakdownMetric] = useState<GroupCategoryBreakdownMetric | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      setGroupsLoading(true);
      setGroupsError(null);

      try {
        const response = await getGroups();
        if (cancelled) {
          return;
        }

        const nextGroups = response.groups ?? [];
        setGroups(nextGroups);
        setActiveGroupId((currentGroupId) => {
          if (currentGroupId === "all") return "all";
          if (currentGroupId && nextGroups.some((group) => group.id === currentGroupId)) {
            return currentGroupId;
          }

          return "all";
        });
      } catch (error) {
        if (!cancelled) {
          setGroupsError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setGroupsLoading(false);
        }
      }
    }

    void loadGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeGroupId) {
      setTotalSpentMetric(null);
      setYourShareMetric(null);
      setNetBalanceMetric(null);
      setTopCategoryMetric(null);
      setMonthlyExpensesMetric(null);
      setCategoryBreakdownMetric(null);
      return;
    }

    const groupId = activeGroupId;
    let cancelled = false;

    async function loadMetrics() {
      setMetricsLoading(true);
      setMetricsError(null);

      try {
        const [
          totalSpentResponse,
          yourShareResponse,
          netBalanceResponse,
          topCategoryResponse,
          monthlyExpensesResponse,
          categoryBreakdownResponse,
        ] = groupId === "all"
          ? await Promise.all([
              getAllGroupsTotalSpentMetric(),
              getAllGroupsYourShareMetric(),
              getAllGroupsNetBalanceMetric(),
              getAllGroupsTopCategoryMetric(),
              getAllGroupsMonthlyExpensesMetric(),
              getAllGroupsCategoryBreakdownMetric(),
            ])
          : await Promise.all([
              getGroupTotalSpentMetric(groupId),
              getGroupYourShareMetric(groupId),
              getGroupNetBalanceMetric(groupId),
              getGroupTopCategoryMetric(groupId),
              getGroupMonthlyExpensesMetric(groupId),
              getGroupCategoryBreakdownMetric(groupId),
            ]);

        if (cancelled) {
          return;
        }

        setTotalSpentMetric(totalSpentResponse);
        setYourShareMetric(yourShareResponse);
        setNetBalanceMetric(netBalanceResponse);
        setTopCategoryMetric(topCategoryResponse);
        setMonthlyExpensesMetric(monthlyExpensesResponse);
        setCategoryBreakdownMetric(categoryBreakdownResponse);
      } catch (error) {
        if (!cancelled) {
          setMetricsError(getApiErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      }
    }

    void loadMetrics();

    return () => {
      cancelled = true;
    };
  }, [activeGroupId]);

  const activeGroup = activeGroupId && activeGroupId !== "all" ? groups.find((group) => group.id === activeGroupId) ?? null : null;
  const currency = activeGroup?.default_currency ?? totalSpentMetric?.currency ?? "INR";
  const isAllGroups = activeGroupId === "all";
  const totalExpense = totalSpentMetric?.totalSpent ?? 0;
  const yourShare = yourShareMetric?.yourShare ?? 0;
  const netBalance = netBalanceMetric?.netBalance ?? 0;
  const topCategory = topCategoryMetric?.category ?? null;
  const topCategoryAmount = topCategoryMetric?.amount ?? 0;
  const monthlyPoints = monthlyExpensesMetric?.months ?? [];
  const categoryItems = categoryBreakdownMetric?.categories ?? [];
  const maxMonthlyAmount = Math.max(...monthlyPoints.map((point) => point.totalAmount), 1);

  const BAR_MAX_PX = 96;

  if (groupsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-36" />

        {/* Tab skeletons */}
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* KPI card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-5 py-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* Chart + breakdown skeletons */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-border bg-card px-5 py-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="flex items-end gap-4">
              {[60, 80, 45, 96, 70, 55].map((h, i) => (
                <div key={i} className="flex shrink-0 flex-col items-center gap-1 w-16 sm:w-20">
                  <Skeleton className="h-3 w-10" />
                  <div className="flex w-full items-end justify-center" style={{ height: 96 }}>
                    <Skeleton className="w-9 sm:w-11 rounded-t-md rounded-b-none" style={{ height: h }} />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {groupsError}
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No groups yet. Create your first group to see the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {metricsError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {metricsError}
        </p>
      ) : null}

      {/* Group tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveGroupId("all")}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeGroupId === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGroupId(g.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              g.id === activeGroupId
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* KPI cards grid - responsive layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Spent</p>
          {metricsLoading ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpense, currency)}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {isAllGroups ? "all time across all groups" : "all time in this group"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Share</p>
          {metricsLoading ? (
            <Skeleton className="h-8 w-28 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground">{formatCurrency(yourShare, currency)}</p>
          )}
          <p className="text-xs text-muted-foreground">your portion across expenses</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Net Balance</p>
          {metricsLoading ? (
            <Skeleton className="h-8 w-28 mt-1" />
          ) : (
            <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}>
              {`${netBalance >= 0 ? "+" : "-"}${formatCurrency(netBalance, currency)}`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {netBalanceMetric?.status === "owed_to_you"
              ? "you are owed"
              : netBalanceMetric?.status === "you_owe"
                ? "you owe"
                : "all settled up"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Top Category</p>
          {metricsLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-bold text-foreground truncate">{topCategory ?? "—"}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {topCategory ? `${formatCurrency(topCategoryAmount, currency)} spent` : "no data"}
          </p>
        </div>
      </div>

      {/* Dashboard grid: Chart + Category breakdown side by side */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly histogram - takes 2 cols on large screens */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card px-5 py-5 space-y-4">
          <p className="font-semibold text-foreground">Monthly Expenses</p>
          {metricsLoading ? (
            <div className="flex items-end gap-4 pb-1">
              {[60, 80, 45, 96, 70, 55].map((h, i) => (
                <div key={i} className="flex shrink-0 flex-col items-center gap-1 w-16 sm:w-20">
                  <Skeleton className="h-3 w-10" />
                  <div className="flex w-full items-end justify-center" style={{ height: BAR_MAX_PX }}>
                    <Skeleton className="w-9 sm:w-11 rounded-t-md rounded-b-none" style={{ height: h }} />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          ) : monthlyPoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-4 pb-1">
                {monthlyPoints.map((point, index) => {
                  const label = `${MONTH_LABELS[point.month - 1]} '${String(point.year).slice(2)}`;
                  const barHeight = Math.max(Math.round((point.totalAmount / maxMonthlyAmount) * BAR_MAX_PX), 4);
                  const barClass =
                    index % 2 === 0
                      ? "bg-chart-1/90"
                      : "bg-chart-2/90";

                  return (
                    <div key={point.monthKey} className="flex shrink-0 flex-col items-center gap-1 w-16 sm:w-20">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(point.totalAmount, currency)}
                      </p>
                      <div className="flex w-full items-end justify-center" style={{ height: BAR_MAX_PX }}>
                        <div
                          className={`w-9 rounded-t-md transition-colors sm:w-11 ${barClass}`}
                          style={{ height: barHeight }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Category breakdown - sidebar on large screens */}
        <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-4">
          <p className="font-semibold text-foreground">By Category</p>
          {metricsLoading ? (
            <div className="space-y-3">
              {["w-20", "w-28", "w-16", "w-24"].map((w, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <Skeleton className={`h-3 ${w}`} />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ) : categoryItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryItems.map((item) => {
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-foreground font-medium text-xs truncate">{item.category}</span>
                      <span className="text-muted-foreground text-xs shrink-0 ml-1">
                        {Math.round(item.percentage)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.amount, currency)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
