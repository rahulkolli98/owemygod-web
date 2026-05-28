import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface ServerSession {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export async function getServerSession(): Promise<ServerSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value ?? null;
  const refreshToken = cookieStore.get("refreshToken")?.value ?? null;

  return {
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(accessToken || refreshToken),
  };
}

export async function requireServerSession(redirectTo = "/login"): Promise<ServerSession> {
  const session = await getServerSession();

  if (!session.isAuthenticated) {
    redirect(redirectTo);
  }

  return session;
}