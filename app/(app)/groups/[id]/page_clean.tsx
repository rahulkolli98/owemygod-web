"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GroupDetailClient } from "@/components/groups/GroupDetailClient";
import { getApiErrorMessage, getCurrentUserId } from "@/lib/auth-api";
import { getGroupById } from "@/lib/api/groups";
import { listExpenses, ExpenseListItem } from "@/lib/api/expenses";
import { EXPENSE_CATEGORIES, type Group, type ExpenseCategory } from "@/lib/mock-data";

function memberLabel(userId: string, currentUserId: string | null): string {
  if (userId === currentUserId) return "You";
  return userId.slice(0, 8) + "…";
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [groupData, setGroupData] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const rawMembers: Array<{ user_id: string }> = groupResp.members || [];
        const rawExpenses: ExpenseListItem[] = expensesResp.expenses || [];

        const transformed: Group = {
          id: group.id,
          name: group.name,
          members: rawMembers.map((m) => memberLabel(m.user_id, currentUserId)),
          expenses: rawExpenses.map((e) => {
            const participants = (e.expense_splits || []).map((s) =>
              memberLabel(s.user_id, currentUserId)
            );
            const validCategories = EXPENSE_CATEGORIES as readonly string[];
            const category: ExpenseCategory = validCategories.includes(e.category ?? "")
              ? (e.category as ExpenseCategory)
              : "Other";

            return {
              id: e.id,
              description: e.description,
              amount: e.amount_total,
              paidBy: memberLabel(e.paid_by, currentUserId),
              date: e.expense_date,
              participants,
              category,
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
  }, [groupId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/groups"
          className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 text-muted-foreground")}
        >
          ← Back to groups
        </Link>
        <p className="text-sm text-muted-foreground">Loading group…</p>
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
          ← Back to groups
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
      <Link
        href="/groups"
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 text-muted-foreground")}
      >
        ← Back to groups
      </Link>

      <GroupDetailClient group={groupData} />
    </div>
  );
}
