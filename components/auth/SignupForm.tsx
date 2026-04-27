"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage, saveAuthSession, signUp } from "@/lib/auth-api";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    useFullNameAsDisplayName: z.boolean(),
    displayName: z.string().optional(),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.useFullNameAsDisplayName && (!data.displayName || data.displayName.trim().length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Display name must be at least 2 characters",
        path: ["displayName"],
      });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const nextPath =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") || "/dashboard"
      : "/dashboard";
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      useFullNameAsDisplayName: true,
      displayName: "",
    },
  });

  const useFullNameAsDisplayName = watch("useFullNameAsDisplayName");

  async function onSubmit(data: SignupFormValues) {
    setSubmitError(null);

    try {
      const response = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.name,
        displayName: data.useFullNameAsDisplayName ? data.name : (data.displayName ?? "").trim(),
      });
      saveAuthSession(response.session);
      router.push(nextPath);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Start splitting expenses with your group
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {submitError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Jane Doe"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}

            <label className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                {...register("useFullNameAsDisplayName")}
              />
              Use full name as display name
            </label>
          </div>

          {!useFullNameAsDisplayName && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How others will see you"
                autoComplete="nickname"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">{errors.displayName.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
