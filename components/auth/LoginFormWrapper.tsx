"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "./LoginForm";

export function LoginFormWrapper() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const showDeactivatedMessage = searchParams.get("deactivated") === "1";
  const logoutReason = searchParams.get("reason");

  return (
    <LoginForm
      nextPath={nextPath}
      showDeactivatedMessage={showDeactivatedMessage}
      logoutReason={logoutReason}
    />
  );
}
