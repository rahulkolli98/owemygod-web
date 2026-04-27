"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAccessToken, getApiErrorMessage } from "@/lib/auth-api";
import { InviteApiError, joinInvite, previewInvite, type InvitePreviewResponse } from "@/lib/api/invites";

type InviteState = "ready" | "already-member" | "invalid" | "expired" | "error";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<InvitePreviewResponse | null>(null);
  const [inviteState, setInviteState] = useState<InviteState>("ready");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.replace(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
        return;
      }

      try {
        const data = await previewInvite(token);
        if (!cancelled) {
          setPreview(data);
          setInviteState(data.viewer.alreadyMember ? "already-member" : "ready");
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof InviteApiError) {
            if (err.code === "INVITE_INVALID") {
              setInviteState("expired");
              setError("This invite link has expired or has been revoked.");
            } else if (err.code === "INVITE_NOT_FOUND") {
              setInviteState("invalid");
              setError("This invite link is invalid.");
            } else {
              setInviteState("error");
              setError(getApiErrorMessage(err));
            }
          } else {
            setInviteState("error");
            setError(getApiErrorMessage(err));
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  async function handleJoin() {
    if (!preview) return;

    if (preview.viewer.alreadyMember) {
      router.push(`/groups/${preview.invite.groupId}`);
      return;
    }

    setError(null);
    setJoining(true);

    try {
      const result = await joinInvite(token);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "owemygod_invite_join_flash",
          JSON.stringify({
            groupId: result.group.id,
            message: `Joined ${result.group.name}`,
          })
        );
      }
      router.push(`/groups/${result.group.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading invite…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Group invite</CardTitle>
          <CardDescription>
            {preview && inviteState === "ready" && `You are invited to join ${preview.invite.groupName}.`}
            {preview && inviteState === "already-member" && `You are already a member of ${preview.invite.groupName}.`}
            {(inviteState === "invalid" || inviteState === "expired") && "This invite link cannot be used."}
            {inviteState === "error" && "We could not load this invite right now."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {preview && (inviteState === "ready" || inviteState === "already-member") && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
              <p className="text-sm text-foreground">
                <span className="font-medium">Group:</span> {preview.invite.groupName}
              </p>
              <p className="text-sm text-muted-foreground">
                {inviteState === "already-member"
                  ? "You can open the group directly."
                  : `You will join as ${preview.invite.roleToAssign}.`}
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {(inviteState === "ready" || inviteState === "already-member") && (
            <Button
              className="w-full"
              onClick={handleJoin}
              disabled={!preview || joining}
            >
              {joining
                ? "Joining…"
                : inviteState === "already-member"
                  ? "Open group"
                  : "Join group"}
            </Button>
          )}

          <Link
            href="/groups"
            className={cn("text-sm text-muted-foreground underline-offset-4 hover:underline")}
          >
            Back to groups
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
