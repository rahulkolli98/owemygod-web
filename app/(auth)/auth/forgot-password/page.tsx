"use client";

import { useState } from "react";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const [showSpamHint, setShowSpamHint] = useState(false);

  return (
    <div className="w-full max-w-sm space-y-3">
      <ForgotPasswordForm onSuccess={() => setShowSpamHint(true)} />
      {showSpamHint && (
        <p className="text-xs text-muted-foreground text-center">
          If you do not see the email, please check your spam or junk folder as well.
        </p>
      )}
    </div>
  );
}
