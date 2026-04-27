"use client";

import { useState } from "react";
import { MOCK_GROUPS } from "@/lib/mock-data";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatINR(amount: number) {
  return `₹${Math.round(Math.abs(amount)).toLocaleString("en-IN")}`;
}

export function DashboardClient() {
  const [activeGroupId, setActiveGroupId] = useState(MOCK_GROUPS[0].id);
  const group = MOCK_GROUPS.find((g) => g.id === activeGroupId)!;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalExpense = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  let yourShare = 0;

  let netBalance = 0;
  for (const expense of group.expenses) {
    if (!expense.participants.includes("You")) continue;
    const share = expense.amount / expense.participants.length;
    yourShare += share;
    netBalance += expense.paidBy === "You" ? expense.amount - share : -share;
  }

  const categoryTotals: Record<string, number> = {};
  for (const e of group.expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount;
  }
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];

  // ── Monthly histogram ─────────────────────────────────────────────────────
  const monthlyTotals: Record<string, number> = {};
  for (const e of group.expenses) {
    const key = e.date.slice(0, 7); // "YYYY-MM"
    monthlyTotals[key] = (monthlyTotals[key] ?? 0) + e.amount;
  }
  const sortedMonths = Object.keys(monthlyTotals).sort();
  const maxMonthlyAmount = Math.max(...Object.values(monthlyTotals), 1);

  const BAR_MAX_PX = 96;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Group tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MOCK_GROUPS.map((g) => (
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
          <p className="text-2xl font-bold text-foreground">{formatINR(totalExpense)}</p>
          <p className="text-xs text-muted-foreground">all time in this group</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Share</p>
          <p className="text-2xl font-bold text-foreground">{formatINR(yourShare)}</p>
          <p className="text-xs text-muted-foreground">your portion across expenses</p>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Net Balance</p>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {netBalance >= 0 ? "+" : "-"}{formatINR(netBalance)}
          </p>
          <p className="text-xs text-muted-foreground">
            {netBalance >= 0 ? "you are owed" : "you owe"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Top Category</p>
          <p className="text-2xl font-bold text-foreground truncate">{topCategory?.[0] ?? "—"}</p>
          <p className="text-xs text-muted-foreground">
            {topCategory ? formatINR(topCategory[1]) + " spent" : "no data"}
          </p>
        </div>
      </div>

      {/* Dashboard grid: Chart + Category breakdown side by side */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly histogram - takes 2 cols on large screens */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card px-5 py-5 space-y-4">
          <p className="font-semibold text-foreground">Monthly Expenses</p>
          {sortedMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-4 pb-1">
                {sortedMonths.map((key) => {
                  const amount = monthlyTotals[key];
                  const [year, month] = key.split("-");
                  const label = `${MONTH_LABELS[parseInt(month, 10) - 1]} '${year.slice(2)}`;
                  const barHeight = Math.max(Math.round((amount / maxMonthlyAmount) * BAR_MAX_PX), 4);

                  return (
                    <div key={key} className="flex shrink-0 flex-col items-center gap-1 w-16 sm:w-20">
                      <p className="text-xs text-muted-foreground">
                        {amount >= 1000 ? `₹${(amount / 1000).toFixed(1)}k` : `₹${amount}`}
                      </p>
                      <div className="flex w-full items-end justify-center" style={{ height: BAR_MAX_PX }}>
                        <div
                          className="w-9 rounded-t-md bg-primary/80 transition-colors sm:w-11"
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
          {sortedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, amt]) => {
                const pct = Math.round((amt / totalExpense) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="text-foreground font-medium text-xs truncate">{cat}</span>
                      <span className="text-muted-foreground text-xs shrink-0 ml-1">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatINR(amt)}</p>
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
