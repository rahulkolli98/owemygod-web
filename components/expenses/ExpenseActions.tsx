"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteExpense } from "@/lib/api/expenses";
import { getApiErrorMessage } from "@/lib/auth-api";

interface ExpenseActionsProps {
  expenseId: string;
  onDeleted?: () => Promise<void> | void;
}

export function ExpenseActions({ expenseId, onDeleted }: ExpenseActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteExpense(expenseId);
      await onDeleted?.();
      setConfirmOpen(false);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmOpen(true); }}
        >
          Delete
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Delete expense?</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
              {deleteError && (
                <p className="text-sm text-destructive pt-1">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
