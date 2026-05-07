import { requestData } from "../auth-api";

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
  return requestData<TData>(path, {
    method: options?.method,
    body: options?.body,
    withAuth: true,
  });
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
  const formData = new FormData();
  formData.append("avatar", file);

  return requestData<UploadAvatarResponse>("/profile/avatar", {
    method: "POST",
    withAuth: true,
    rawBody: formData,
    jsonBody: false,
  });
}

export async function removeProfileAvatar(): Promise<UpdateProfileResponse> {
  return profileRequest<UpdateProfileResponse>("/profile/avatar", {
    method: "DELETE",
  });
}
