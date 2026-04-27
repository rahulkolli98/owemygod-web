"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createGroupInviteLink } from "@/lib/api/groups";
import { getApiErrorMessage } from "@/lib/auth-api";

interface ShareInviteButtonProps {
  groupId: string;
}

export function ShareInviteButton({ groupId }: ShareInviteButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function openInviteModal() {
    setOpen(true);
    setCopied(false);
    setError(null);
    setIsLoading(true);

    try {
      const { invite } = await createGroupInviteLink(groupId);
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://owemygod.app";

      setInviteUrl(`${baseUrl}/invite/${invite.token}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button variant="outline" onClick={openInviteModal}>
        Share invite
      </Button>

      {open && (
        /* Backdrop */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          {/* Panel — stop click bubbling so clicking inside doesn't close */}
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-foreground">Invite link</p>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Share this link with friends so they can join the group.
            </p>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Generating invite link…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-muted px-3 py-2">
                  <p className="break-all text-xs font-mono text-foreground">{inviteUrl}</p>
                </div>

                <Button className="w-full" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
