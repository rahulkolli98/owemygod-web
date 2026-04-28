import { getAccessToken } from "../auth-api";
import { API_BASE_URL } from "../config";

export interface ProfileDto {
  userId: string;
  fullName: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  deletedAt: string | null;
  deletionScheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetProfileResponse {
  profile: ProfileDto;
}

export interface UpdateProfileInput {
  fullName?: string;
  displayName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  profile: ProfileDto;
}

export interface DeactivateProfileInput {
  currentPassword: string;
}

export interface DeactivateProfileResponse {
  message: string;
  deletionScheduledFor: string | null;
}

export interface RestoreProfileResponse {
  message: string;
}

export interface UploadAvatarResponse {
  profile: ProfileDto;
}

async function profileRequest<TData>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  }
): Promise<TData> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("You are not signed in.");
  }

  headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options?.method ?? "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: TData;
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }

  return (payload.data ?? ({} as TData)) as TData;
}

export async function getProfile(): Promise<GetProfileResponse> {
  return profileRequest<GetProfileResponse>("/profile", {
    method: "GET",
  });
}

export async function updateProfile(input: UpdateProfileInput): Promise<UpdateProfileResponse> {
  return profileRequest<UpdateProfileResponse>("/profile", {
    method: "PUT",
    body: input,
  });
}

export async function deactivateProfile(
  input: DeactivateProfileInput
): Promise<DeactivateProfileResponse> {
  return profileRequest<DeactivateProfileResponse>("/profile", {
    method: "DELETE",
    body: input,
  });
}

export async function restoreProfile(): Promise<RestoreProfileResponse> {
  return profileRequest<RestoreProfileResponse>("/profile/restore", {
    method: "POST",
  });
}

export async function uploadProfileAvatar(file: File): Promise<UploadAvatarResponse> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("You are not signed in.");
  }

  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: UploadAvatarResponse;
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Avatar upload failed");
  }

  return (payload.data ?? ({} as UploadAvatarResponse)) as UploadAvatarResponse;
}

export async function removeProfileAvatar(): Promise<UpdateProfileResponse> {
  return profileRequest<UpdateProfileResponse>("/profile/avatar", {
    method: "DELETE",
  });
}
