"use client";

import { useState } from "react";
import { X, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateGroup, createGroupInviteLink } from "@/lib/api/groups";
import { getApiErrorMessage } from "@/lib/auth-api";
import type { Group } from "@/lib/mock-data";

interface GroupSettingsModalProps {
  group: Group;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function GroupSettingsModal({ group, open, onClose, onRefresh }: GroupSettingsModalProps) {
  const [name, setName] = useState(group.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [simplifyDebts, setSimplifyDebts] = useState(group.simplify_debts ?? false);
  const [isTogglingSimplify, setIsTogglingSimplify] = useState(false);

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSaveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    if (trimmed === group.name) return;

    setIsSavingName(true);
    setNameError(null);

    try {
      await updateGroup(group.id, { name: trimmed });
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
      onRefresh?.();
    } catch (err) {
      setNameError(getApiErrorMessage(err));
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleToggleSimplify(checked: boolean) {
    setSimplifyDebts(checked);
    setIsTogglingSimplify(true);

    try {
      await updateGroup(group.id, { simplifyDebts: checked });
      onRefresh?.();
    } catch (err) {
      // Revert on failure.
      setSimplifyDebts(!checked);
      console.error("Failed to update simplify debts setting:", getApiErrorMessage(err));
    } finally {
      setIsTogglingSimplify(false);
    }
  }

  async function handleCopyInviteLink() {
    setIsCopying(true);
    setInviteError(null);

    try {
      const { invite } = await createGroupInviteLink(group.id);
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "https://owemygod.app";
      const url = `${baseUrl}/invite/${invite.token}`;
      setInviteUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setInviteError(getApiErrorMessage(err));
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Group settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Group name */}
        <div className="space-y-2">
          <Label htmlFor="group-name-input">Group name</Label>
          <div className="flex gap-2">
            <Input
              id="group-name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              placeholder="Group name"
              disabled={isSavingName}
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveName();
              }}
            />
            <Button
              onClick={() => void handleSaveName()}
              disabled={isSavingName || name.trim() === group.name || !name.trim()}
              size="sm"
            >
              {isSavingName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : nameSaved ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {nameError && <p className="text-xs text-destructive">{nameError}</p>}
        </div>

        {/* Invite link */}
        <div className="space-y-2">
          <Label>Invite link</Label>
          {inviteUrl && (
            <div className="rounded-lg border border-border bg-muted px-3 py-2">
              <p className="break-all text-xs font-mono text-foreground">{inviteUrl}</p>
            </div>
          )}
          {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => void handleCopyInviteLink()}
            disabled={isCopying}
          >
            {isCopying ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : copied ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy invite link"}
          </Button>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <Label>Members ({group.members.length})</Label>
          <div className="rounded-lg border border-border divide-y divide-border max-h-44 overflow-y-auto">
            {group.members.map((member) => (
              <div key={member} className="px-3 py-2 text-sm text-foreground">
                {member}
              </div>
            ))}
          </div>
        </div>

        {/* Simplify debts */}
        <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="simplify-debts-toggle" className="text-sm font-medium cursor-pointer">
              Simplify debts
            </Label>
            <p className="text-xs text-muted-foreground">
              Reduce who pays whom to the fewest transfers while keeping everyone's net balance the same.
            </p>
          </div>
          <Switch
            id="simplify-debts-toggle"
            checked={simplifyDebts}
            onCheckedChange={(checked) => void handleToggleSimplify(checked)}
            disabled={isTogglingSimplify}
          />
        </div>
      </div>
    </div>
  );
}
