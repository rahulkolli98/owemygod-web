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
import { EXPENSE_CATEGORIES } from "@/lib/mock-data";
import { createExpense } from "@/lib/api/expenses";
import { getApiErrorMessage } from "@/lib/auth-api";

const addExpenseSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  paidBy: z.string().min(1, "Select who paid"),
  category: z.enum(EXPENSE_CATEGORIES, { error: "Select a category" }),
  participants: z
    .array(z.string())
    .min(1, "Select at least one participant"),
});

type AddExpenseFormValues = z.infer<typeof addExpenseSchema>;

interface Member {
  id: string;
  label: string;
}

interface AddExpenseFormProps {
  groupId: string;
  members: Member[];
  currency?: string;
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

export function AddExpenseForm({ groupId, members, currency = "USD" }: AddExpenseFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const currencySymbol = getCurrencySymbol(currency);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddExpenseFormValues>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: { participants: members.map((m) => m.id), category: undefined },
  });

  const selectedParticipants = watch("participants");

  function toggleParticipant(memberId: string) {
    const current = selectedParticipants ?? [];
    const updated = current.includes(memberId)
      ? current.filter((m) => m !== memberId)
      : [...current, memberId];
    setValue("participants", updated, { shouldValidate: true });
  }

  async function onSubmit(data: AddExpenseFormValues) {
    setSubmitError(null);
    try {
      await createExpense({
        groupId,
        description: data.description,
        amount: Number(data.amount),
        paidBy: data.paidBy,
        expenseDate: new Date().toISOString().slice(0, 10),
        splitType: "equal",
        participants: data.participants,
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
        <CardTitle className="text-xl font-bold">New expense</CardTitle>
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
              placeholder="e.g. Hotel stay, Dinner"
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
                placeholder="0"
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
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
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

          {/* Paid by */}
          <div className="space-y-2">
            <Label>Paid by</Label>
            <Controller
              control={control}
              name="paidBy"
              render={({ field }) => {
                const selectedLabel = members.find((m) => m.id === field.value)?.label ?? "Select member";
                return (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save expense"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

