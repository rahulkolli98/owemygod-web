"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage, requestData } from "@/lib/auth-api";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      try {
        await requestData("/auth/session", {
          method: "GET",
          withOptionalAuth: true,
        });

        if (!cancelled) {
          setIsCheckingSession(false);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const nextPath = `${window.location.pathname}${window.location.search}`;
        setAuthError(getApiErrorMessage(error));
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">{authError ?? "Checking your session..."}</p>
      </div>
    );
  }

  return <>{children}</>;
}