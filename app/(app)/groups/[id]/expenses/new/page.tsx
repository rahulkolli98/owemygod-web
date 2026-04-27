"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddExpenseForm } from "@/components/expenses/AddExpenseForm";
import { getGroupById } from "@/lib/api/groups";
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

export default function NewExpensePage() {
  const params = useParams();
  const groupId = params.id as string;

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentUserId = getCurrentUserId();

    async function load() {
      try {
        const { group, members: rawMembers } = await getGroupById(groupId);
        if (!cancelled) {
          setCurrency(group?.default_currency ?? "USD");
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
  }, [groupId]);

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
      ) : (
        <div className="flex justify-center">
          <AddExpenseForm groupId={groupId} members={members} currency={currency} />
        </div>
      )}
    </div>
  );
}
