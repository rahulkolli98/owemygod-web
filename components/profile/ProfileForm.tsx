"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
import { getApiErrorMessage, signOut } from "@/lib/auth-api";
import {
  deactivateProfile,
  getProfile,
  removeProfileAvatar,
  updateProfile,
  uploadProfileAvatar,
} from "@/lib/api/profile";

const profileSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    currentPassword: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => {
    const currentPassword = data.currentPassword ?? "";
    const password = data.password ?? "";
    const confirmPassword = data.confirmPassword ?? "";

    if (!password && !confirmPassword && !currentPassword) return true;
    if (!password && !confirmPassword && currentPassword) return false;
    if (!currentPassword) return false;
    if (password.length < 8) return false;
    return password === confirmPassword;
  }, {
    message: "Current password is required. New passwords must match and be at least 8 characters",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [loadedFullName, setLoadedFullName] = useState<string>("");
  const [loadedDisplayName, setLoadedDisplayName] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [isDeactivateSectionOpen, setIsDeactivateSectionOpen] = useState(false);
  const [isDeactivatePreviewOpen, setIsDeactivatePreviewOpen] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateConfirmText, setDeactivateConfirmText] = useState("");
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "Jane Doe",
      displayName: "Jane",
      email: "you@example.com",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const loadProfile = useCallback(async () => {
    try {
      const response = await getProfile();

      reset({
        name: response.profile.fullName,
        displayName: response.profile.displayName,
        email: response.profile.email ?? "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setLoadedFullName(response.profile.fullName);
      setLoadedDisplayName(response.profile.displayName);
      setAvatarUrl(response.profile.avatarUrl);
    } catch (error) {
      setProfileLoadError(getApiErrorMessage(error));
    } finally {
      setIsLoadingProfile(false);
    }
  }, [reset]);

  useEffect(() => {
    // Initial profile bootstrap fetch for this client form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const avatarLabel = useMemo(() => {
    const source = (loadedDisplayName || loadedFullName || "").trim();
    if (!source) {
      return "??";
    }

    const parts = source.split(/\s+/).filter(Boolean);
    const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
    return initials.toUpperCase() || parts[0].slice(0, 2).toUpperCase();
  }, [loadedDisplayName, loadedFullName]);

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedPhoto(file);
    const objectUrl = URL.createObjectURL(file);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(objectUrl);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  async function onSubmit(data: ProfileFormValues) {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      let uploadedAvatarUrl: string | null | undefined;
      if (selectedPhoto) {
        const uploadResponse = await uploadProfileAvatar(selectedPhoto);
        uploadedAvatarUrl = uploadResponse.profile.avatarUrl;
      }

      const hasPasswordChange = Boolean(data.password?.trim());

      const response = await updateProfile({
        fullName: data.name.trim(),
        displayName: data.displayName.trim(),
        email: data.email.trim(),
        ...(uploadedAvatarUrl !== undefined ? { avatarUrl: uploadedAvatarUrl } : {}),
        ...(hasPasswordChange
          ? {
              currentPassword: data.currentPassword?.trim(),
              newPassword: data.password?.trim(),
            }
          : {}),
      });

      reset({
        name: response.profile.fullName,
        displayName: response.profile.displayName,
        email: response.profile.email ?? "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setLoadedFullName(response.profile.fullName);
      setLoadedDisplayName(response.profile.displayName);
      setAvatarUrl(response.profile.avatarUrl);
      setSelectedPhoto(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);

      setSubmitSuccess("Profile updated successfully.");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  }

  async function onSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      // Ignore network/token revocation errors and always clear local session.
    } finally {
      setIsSigningOut(false);
      router.push("/");
    }
  }

  async function onDeactivateAccount() {
    const currentPassword = deactivatePassword.trim();
    if (!currentPassword) {
      setDeactivateError("Enter your current password to deactivate your account.");
      return;
    }

    if (deactivateConfirmText.trim().toUpperCase() !== "DEACTIVATE") {
      setDeactivateError("Type DEACTIVATE to confirm account deactivation.");
      return;
    }

    setDeactivateError(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setIsDeactivating(true);

    try {
      await deactivateProfile({ currentPassword });
      await signOut();
      router.push("/login?deactivated=1");
    } catch (error) {
      setDeactivateError(getApiErrorMessage(error));
    } finally {
      setIsDeactivating(false);
    }
  }

  async function onRemoveCurrentAvatar() {
    if (!avatarUrl) {
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setIsRemovingAvatar(true);

    try {
      const response = await removeProfileAvatar();
      setAvatarUrl(response.profile.avatarUrl);
      setSelectedPhoto(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setSubmitSuccess("Profile photo removed.");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setIsRemovingAvatar(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-4">
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Profile</CardTitle>
        <CardDescription>
          Update your account details and profile picture.
        </CardDescription>
      </CardHeader>

      {isLoadingProfile ? (
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Loading your profile...</p>
            <p className="text-xs text-muted-foreground">Fetching your latest account details.</p>
          </div>
        </CardContent>
      ) : null}

      {!isLoadingProfile && profileLoadError ? (
        <CardContent>
          <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm text-destructive">{profileLoadError}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLoadingProfile(true);
                  setProfileLoadError(null);
                  setSubmitError(null);
                  setSubmitSuccess(null);
                  setDeactivateError(null);
                  void loadProfile();
                }}
              >
                Retry
              </Button>
              <Button type="button" variant="ghost" onClick={onSignOut} disabled={isSigningOut}>
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </CardContent>
      ) : null}

      {!isLoadingProfile && !profileLoadError ? (
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile avatar"
                  fill
                  unoptimized
                  className="object-cover"
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
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRemovingAvatar || isSubmitting || isDeactivating}
                  onClick={onRemoveCurrentAvatar}
                >
                  {isRemovingAvatar ? "Removing..." : "Remove current photo"}
                </Button>
              ) : null}
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
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              placeholder="Required only when changing password"
              {...register("currentPassword")}
            />
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

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          {submitSuccess ? <p className="text-sm text-success">{submitSuccess}</p> : null}
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
      ) : null}
    </Card>
    {!isLoadingProfile && !profileLoadError ? (
      <div className="rounded-lg border border-border bg-card/40 p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-between"
          aria-expanded={isDeactivateSectionOpen}
          onClick={() => {
            setIsDeactivateSectionOpen((previous) => !previous);
            setDeactivateError(null);
          }}
        >
          <span>Account options</span>
          <span className="text-xs text-muted-foreground">
            {isDeactivateSectionOpen ? "Hide" : "Show"}
          </span>
        </Button>

        {isDeactivateSectionOpen ? (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Deactivate account until your next successful login.
            </p>

            <Button
              type="button"
              variant="outline"
              disabled={isDeactivating || isSubmitting || isRemovingAvatar}
              onClick={() => {
                setIsDeactivatePreviewOpen((previous) => !previous);
                setDeactivateError(null);
              }}
            >
              {isDeactivatePreviewOpen ? "Hide preview" : "Deactivate account"}
            </Button>

            {isDeactivatePreviewOpen ? (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-medium">Review before deactivation</p>
                <p className="text-xs text-muted-foreground">
                  Your account will be deactivated now. You can come back within 30 days by signing in
                  again.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="deactivatePassword">Current password</Label>
                  <Input
                    id="deactivatePassword"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter current password"
                    value={deactivatePassword}
                    onChange={(event) => setDeactivatePassword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deactivateConfirmText">Type DEACTIVATE to confirm</Label>
                  <Input
                    id="deactivateConfirmText"
                    type="text"
                    placeholder="DEACTIVATE"
                    value={deactivateConfirmText}
                    onChange={(event) => setDeactivateConfirmText(event.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeactivating || isSubmitting || isRemovingAvatar}
                  onClick={onDeactivateAccount}
                >
                  {isDeactivating ? "Deactivating..." : "Confirm deactivation"}
                </Button>
              </div>
            ) : null}

            {deactivateError ? <p className="text-xs text-destructive">{deactivateError}</p> : null}
          </div>
        ) : null}
      </div>
    ) : null}
    </div>
  );
}
