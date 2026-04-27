"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditExpenseForm } from "@/components/expenses/EditExpenseForm";
import { getGroupById } from "@/lib/api/groups";
import { getExpense, type ExpenseDetails } from "@/lib/api/expenses";
import { getApiErrorMessage, getCurrentUserId } from "@/lib/auth-api";

interface GroupMember {
  id: string;
  label: string;
}

interface RawGroupMember {
  user_id: string;
  display_name?: string | null;
  full_name?: string | null;
}

export default function EditExpensePage() {
  const params = useParams();
  const groupId = params.id as string;
  const expenseId = params.expenseId as string;

  const [expense, setExpense] = useState<ExpenseDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentUserId = getCurrentUserId();

    async function load() {
      try {
        const [{ expense: rawExpense }, { members: rawMembers }] = await Promise.all([
          getExpense(expenseId),
          getGroupById(groupId),
        ]);

        if (!cancelled) {
          setExpense(rawExpense);
          setMembers(
            (rawMembers as RawGroupMember[]).map((m) => ({
              id: m.user_id,
              label:
                m.user_id === currentUserId
                  ? "You"
                  : m.display_name || m.full_name || m.user_id.slice(0, 8) + "\u2026",
            }))
          );
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [groupId, expenseId]);

  return (
    <div className="space-y-6">
      <Link
        href={`/groups/${groupId}`}
        className={cn(buttonVariants({ variant: "ghost" }), "-ml-2 text-muted-foreground")}
      >
        ← Back to group
      </Link>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : expense ? (
        <div className="flex justify-center">
          <EditExpenseForm groupId={groupId} expense={expense} members={members} />
        </div>
      ) : null}
    </div>
  );
}
