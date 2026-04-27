"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { signOut } from "@/lib/auth-api";

const profileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    const password = data.password ?? "";
    const confirmPassword = data.confirmPassword ?? "";

    if (!password && !confirmPassword) return true;
    if (password.length < 8) return false;
    return password === confirmPassword;
  }, {
    message: "Passwords must match and be at least 8 characters",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "Jane Doe",
      displayName: "Jane",
      email: "you@example.com",
      password: "",
      confirmPassword: "",
    },
  });

  const avatarLabel = useMemo(() => {
    return "JD";
  }, []);

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  }

  function onSubmit(data: ProfileFormValues) {
    // TODO: persist profile updates with API/Supabase.
    console.log({ ...data, profilePhotoUpdated: Boolean(photoPreview) });
  }

  async function onSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      // Ignore network/token revocation errors and always clear local session.
    } finally {
      setIsSigningOut(false);
      router.push("/login");
    }
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Profile</CardTitle>
        <CardDescription>
          Update your account details and profile picture.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                  {avatarLabel}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePhoto">Profile picture</Label>
              <Input
                id="profilePhoto"
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or WEBP. Recommended square image.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" type="text" autoComplete="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" type="text" placeholder="How others see you" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank if unchanged"
              {...register("password")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter new password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isSigningOut}
            className="w-full sm:w-auto"
            onClick={onSignOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
