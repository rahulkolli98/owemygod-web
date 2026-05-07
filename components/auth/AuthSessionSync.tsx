"use client";

import { useEffect } from "react";
import { runGlobalLogout, type LogoutReason } from "@/lib/auth-api";

const AUTH_SYNC_EVENT_KEY = "owemygod_auth_sync_event";

type AuthSyncEvent = {
  type: "logout";
  reason: LogoutReason;
  at: number;
};

function parseAuthSyncEvent(rawValue: string | null): AuthSyncEvent | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthSyncEvent>;
    if (parsed.type !== "logout" || typeof parsed.reason !== "string") {
      return null;
    }

    return {
      type: "logout",
      reason: parsed.reason as LogoutReason,
      at: typeof parsed.at === "number" ? parsed.at : Date.now(),
    };
  } catch {
    return null;
  }
}

export function AuthSessionSync() {
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_SYNC_EVENT_KEY || !event.newValue) {
        return;
      }

      const parsed = parseAuthSyncEvent(event.newValue);
      if (!parsed) {
        return;
      }

      runGlobalLogout({
        reason: parsed.reason,
        emitEvent: false,
      });
    };

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
