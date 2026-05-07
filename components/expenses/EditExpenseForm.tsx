"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/mock-data";
import { updateExpense, type ExpenseDetails } from "@/lib/api/expenses";
import { getApiErrorMessage } from "@/lib/auth-api";
import {
  buildSplitsPayload,
  createSplitDefaults,
  createSplitDefaultsFromExpense,
  getSplitSummary,
  normalizeSplitValues,
  type SplitType,
} from "./split-utils";

const editExpenseSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  paidBy: z.string().min(1, "Select who paid"),
  category: z.enum(EXPENSE_CATEGORIES, { error: "Select a category" }),
  splitType: z.enum(["equal", "custom", "percentage", "shares"]),
  participants: z.array(z.string()).min(1, "Select at least one participant"),
  splitValues: z.record(z.string(), z.string()).default({}),
});

type EditExpenseFormValues = z.input<typeof editExpenseSchema>;

interface Member {
  id: string;
  label: string;
}

interface EditExpenseFormProps {
  groupId: string;
  expense: ExpenseDetails;
  members: Member[];
}

function toCategory(cat: string | null): ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(cat ?? "")
    ? (cat as ExpenseCategory)
    : "Other";
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
};

function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency;
}

export function EditExpenseForm({ groupId, expense, members }: EditExpenseFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const currencySymbol = getCurrencySymbol(expense.currency ?? "USD");
  const participantIds = expense.splits.map((split) => split.user_id);
  const owedByUser = expense.splits.reduce<Record<string, number>>((acc, split) => {
    acc[split.user_id] = split.amount_owed;
    return acc;
  }, {});

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditExpenseFormValues>({
    resolver: zodResolver(editExpenseSchema),
    defaultValues: {
      description: expense.description,
      amount: String(expense.amount_total),
      paidBy: expense.paid_by,
      category: toCategory(expense.category),
      splitType: expense.split_type,
      participants: participantIds,
      splitValues: createSplitDefaultsFromExpense(
        expense.split_type,
        participantIds,
        expense.amount_total,
        owedByUser
      ),
    },
  });

  const splitType = watch("splitType");
  const selectedParticipants = watch("participants");
  const splitValues = watch("splitValues") ?? {};
  const amountValue = watch("amount");

  function getAmountNumber(): number {
    const parsed = Number(amountValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  const amountNumber = getAmountNumber();
  const splitSummary = getSplitSummary({
    splitType,
    participants: selectedParticipants ?? [],
    amount: amountNumber,
    splitValues,
  });
  const customRemainingIsExact =
    splitType === "custom" && splitSummary
      ? Math.abs(splitSummary.remaining) <= 0.01
      : false;
  const percentageRemainingIsExact =
    splitType === "percentage" && splitSummary
      ? Math.abs(splitSummary.remaining) <= 0.01
      : false;

  function handleSplitTypeChange(nextSplitType: SplitType) {
    setValue("splitType", nextSplitType, { shouldValidate: true });

    const nextDefaults = nextSplitType === expense.split_type
      ? createSplitDefaultsFromExpense(
          nextSplitType,
          selectedParticipants ?? [],
          getAmountNumber(),
          owedByUser
        )
      : createSplitDefaults(nextSplitType, selectedParticipants ?? [], getAmountNumber());

    setValue("splitValues", nextDefaults, { shouldValidate: true });
  }

  function toggleParticipant(memberId: string) {
    const current = selectedParticipants ?? [];
    const updated = current.includes(memberId)
      ? current.filter((m) => m !== memberId)
      : [...current, memberId];

    setValue("participants", updated, { shouldValidate: true });

    const nextSplitValues = normalizeSplitValues(splitValues, updated, splitType);
    setValue("splitValues", nextSplitValues, { shouldValidate: true });
  }

  async function onSubmit(data: EditExpenseFormValues) {
    setSubmitError(null);
    try {
      const amount = Number(data.amount);
      const splitPayload = buildSplitsPayload({
        splitType: data.splitType,
        participants: data.participants,
        amount,
        splitValues: data.splitValues ?? {},
      });

      if (splitPayload.error) {
        setSubmitError(splitPayload.error);
        return;
      }

      await updateExpense(expense.id, {
        description: data.description,
        amount,
        paidBy: data.paidBy,
        splitType: data.splitType,
        participants: data.participants,
        splits: splitPayload.splits,
        category: data.category,
      });
      router.push(`/groups/${groupId}`);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Edit expense</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {submitError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              autoFocus
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="px-3 text-sm text-muted-foreground border-r border-input select-none">{currencySymbol}</span>
              <Input
                id="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Split type */}
          <div className="space-y-2">
            <Label>Split type</Label>
            <Controller
              control={control}
              name="splitType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => handleSplitTypeChange(value as SplitType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select split type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal</SelectItem>
                    <SelectItem value="custom">Custom amounts</SelectItem>
                    <SelectItem value="percentage">By percentage</SelectItem>
                    <SelectItem value="shares">By shares</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Paid by */}
          <div className="space-y-2">
            <Label>Paid by</Label>
            <Controller
              control={control}
              name="paidBy"
              render={({ field }) => {
                const selectedLabel = members.find((m) => m.id === field.value)?.label ?? "Select member";
                return (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select member">{selectedLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            {errors.paidBy && (
              <p className="text-sm text-destructive">{errors.paidBy.message}</p>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Split between</Label>
            <div className="rounded-lg border border-border divide-y divide-border">
              {members.map((member) => {
                const checked = selectedParticipants?.includes(member.id) ?? false;
                return (
                  <label
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{member.label}</span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(member.id)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                );
              })}
            </div>
            {errors.participants && (
              <p className="text-sm text-destructive">{errors.participants.message}</p>
            )}
          </div>

          {splitType !== "equal" && (
            <div className="space-y-2">
              <Label>
                {splitType === "custom"
                  ? "Custom amount per person"
                  : splitType === "percentage"
                    ? "Percentage per person"
                    : "Shares per person"}
              </Label>
              <div className="rounded-lg border border-border divide-y divide-border">
                {(selectedParticipants ?? []).map((participantId) => {
                  const memberLabel = members.find((member) => member.id === participantId)?.label ?? participantId;
                  const participantSummary = splitSummary?.participantValues.find(
                    (row) => row.participantId === participantId
                  );
                  return (
                    <div key={participantId} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{memberLabel}</p>
                        {(splitType === "percentage" || splitType === "shares") && participantSummary && (
                          <p className="text-xs text-muted-foreground">
                            {currencySymbol}{participantSummary.computedAmount?.toFixed(2) ?? "0.00"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-36">
                        {splitType === "custom" && (
                          <span className="text-xs text-muted-foreground">{currencySymbol}</span>
                        )}
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={splitValues[participantId] ?? ""}
                          onChange={(event) => {
                            setValue(
                              "splitValues",
                              {
                                ...splitValues,
                                [participantId]: event.target.value,
                              },
                              { shouldValidate: true }
                            );
                          }}
                        />
                        {splitType === "percentage" && (
                          <span className="text-xs text-muted-foreground">%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {splitSummary && splitType === "custom" && (
                <p className="text-xs text-muted-foreground">
                  Total: {currencySymbol}{splitSummary.total.toFixed(2)} · Remaining: {currencySymbol}
                  <span
                    className={customRemainingIsExact ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
                  >
                    {splitSummary.remaining.toFixed(2)}
                  </span>
                </p>
              )}
              {splitSummary && splitType === "percentage" && (
                <p className="text-xs text-muted-foreground">
                  Total: {splitSummary.total.toFixed(2)}% · Remaining: 
                  <span
                    className={percentageRemainingIsExact ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}
                  >
                    {splitSummary.remaining.toFixed(2)}%
                  </span>
                </p>
              )}
              {splitSummary && splitType === "shares" && (
                <p className="text-xs text-muted-foreground">
                  Total shares: {splitSummary.total.toFixed(2)} · 1 share = {currencySymbol}
                  {(splitSummary.shareValue ?? 0).toFixed(2)}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
