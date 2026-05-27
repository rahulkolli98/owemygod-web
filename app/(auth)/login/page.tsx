import { Suspense } from "react";
import { LoginFormWrapper } from "@/components/auth/LoginFormWrapper";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormWrapper />
    </Suspense>
  );
}
