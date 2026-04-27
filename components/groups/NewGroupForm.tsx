"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createGroup } from "@/lib/api/groups";
import { getApiErrorMessage } from "@/lib/auth-api";

const GROUP_CURRENCIES = ["USD", "INR", "EUR", "GBP"] as const;

const newGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  defaultCurrency: z.enum(GROUP_CURRENCIES, { error: "Select a currency" }),
});

type NewGroupFormValues = z.infer<typeof newGroupSchema>;

export function NewGroupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewGroupFormValues>({
    resolver: zodResolver(newGroupSchema),
    defaultValues: {
      defaultCurrency: "USD",
      description: "",
    },
  });

  async function onSubmit(data: NewGroupFormValues) {
    setSubmitError(null);

    try {
      await createGroup({
        name: data.name.trim(),
        description: data.description?.trim() ? data.description.trim() : undefined,
        defaultCurrency: data.defaultCurrency,
      });

      router.push("/groups");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">New group</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {submitError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Group name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Goa Trip, Flat 4B"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g. Shared apartment bills"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Controller
              control={control}
              name="defaultCurrency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUP_CURRENCIES.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.defaultCurrency && (
              <p className="text-sm text-destructive">{errors.defaultCurrency.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save group"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
