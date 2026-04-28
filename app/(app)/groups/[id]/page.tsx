"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";
import { getApiErrorMessage, getCurrentUserId } from "@/lib/auth-api";
import { getGroupById } from "@/lib/api/groups";
import { listExpenses, ExpenseListItem } from "@/lib/api/expenses";
import { EXPENSE_CATEGORIES, type Group, type ExpenseCategory } from "@/lib/mock-data";

interface GroupMemberRecord {
  user_id: string;
  display_name?: string | null;
  full_name?: string | null;
}

function memberLabel(member: GroupMemberRecord, currentUserId: string | null): string {
  const userId = member.user_id;
  if (userId === currentUserId) return "You";
  return member.display_name || member.full_name || userId.slice(0, 8) + "...";
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [groupData, setGroupData] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [joinToastMessage, setJoinToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.sessionStorage.getItem("owemygod_invite_join_flash");
    if (!raw) return;

    window.sessionStorage.removeItem("owemygod_invite_join_flash");

    try {
      const parsed = JSON.parse(raw) as { groupId?: string; message?: string };
      if (parsed.groupId === groupId && parsed.message) {
        setJoinToastMessage(parsed.message);
      }
    } catch {
      // Ignore malformed flash payloads.
    }
  }, [groupId]);

  useEffect(() => {
    if (!joinToastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setJoinToastMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [joinToastMessage]);

  useEffect(() => {
    let cancelled = false;
    const currentUserId = getCurrentUserId();

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const [groupResp, expensesResp] = await Promise.all([
          getGroupById(groupId),
          listExpenses(groupId),
        ]);

        if (cancelled) return;

        const group = groupResp.group;
        const rawMembers: GroupMemberRecord[] = groupResp.members || [];
        const rawExpenses: ExpenseListItem[] = expensesResp.expenses || [];
        const memberNameByUserId = new Map(
          rawMembers.map((member) => [member.user_id, memberLabel(member, currentUserId)])
        );
        const memberDirectory = rawMembers.map((member) => ({
          id: member.user_id,
          name: memberLabel(member, currentUserId),
        }));

        const transformed: Group = {
          id: group.id,
          name: group.name,
          currency: group.default_currency,
          members: rawMembers.map((m) => memberLabel(m, currentUserId)),
          memberDirectory,
          expenses: rawExpenses.map((e) => {
            const participants = (e.expense_splits || []).map((s) =>
              memberNameByUserId.get(s.user_id) ?? s.user_id.slice(0, 8) + "..."
            );
            const validCategories = EXPENSE_CATEGORIES as readonly string[];
            const category: ExpenseCategory = validCategories.includes(e.category ?? "")
              ? (e.category as ExpenseCategory)
              : "Other";

            return {
              id: e.id,
              description: e.description,
              amount: e.amount_total,
              paidBy: memberNameByUserId.get(e.paid_by) ?? e.paid_by.slice(0, 8) + "...",
              date: e.expense_date,
              participants,
              category,
              splitDetails: (e.expense_splits || []).map((s) => ({
                userId: s.user_id,
                userName: memberNameByUserId.get(s.user_id) ?? s.user_id.slice(0, 8) + "...",
                amountOwed: s.amount_owed,
                settledAmount: s.settled_amount,
              })),
            };
          }),
        };

        setGroupData(transformed);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [groupId, reloadToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/groups"
          className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 text-muted-foreground")}
        >
          Back to groups
        </Link>

        {/* Header: title + members line + action buttons */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        {/* Balance summary area */}
        <div className="flex justify-center">
          <div className="space-y-2 text-center">
            <Skeleton className="h-5 w-52 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>
        </div>

        {/* Expense list */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/groups"
          className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 text-muted-foreground")}
        >
          Back to groups
        </Link>
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      </div>
    );
  }

  if (!groupData) return notFound();

  return (
    <div className="space-y-6">
      {joinToastMessage && (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success shadow-md">
          {joinToastMessage}
        </div>
      )}

      <Link
        href="/groups"
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 text-muted-foreground")}
      >
        Back to groups
      </Link>

      <GroupDetailClient
        group={groupData}
        onExpenseDeleted={() => setReloadToken((prev) => prev + 1)}
      />
    </div>
  );
}