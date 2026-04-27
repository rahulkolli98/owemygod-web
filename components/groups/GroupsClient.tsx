"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/auth-api";
import { deleteGroup, getGroups, GroupListItem, updateGroup } from "@/lib/api/groups";

const GROUP_CURRENCIES = ["USD", "INR", "EUR", "GBP"] as const;

interface EditState {
  name: string;
  description: string;
  defaultCurrency: string;
}

export function GroupsClient() {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    name: "",
    description: "",
    defaultCurrency: "USD",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingGroupId, setIsDeletingGroupId] = useState<string | null>(null);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      setLoading(true);
      setError(null);

      try {
        const response = await getGroups();
        if (!cancelled) {
          setGroups(response.groups ?? []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(getApiErrorMessage(fetchError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGroups();

    return () => {
      cancelled = true;
    };
  }, []);

  const isEditing = useMemo(() => editingGroupId !== null, [editingGroupId]);

  function startEdit(group: GroupListItem) {
    setSaveError(null);
    setDeleteError(null);
    setEditingGroupId(group.id);
    setConfirmDeleteGroupId(null);
    setEditState({
      name: group.name,
      description: group.description ?? "",
      defaultCurrency: group.default_currency,
    });
  }

  function cancelEdit() {
    setEditingGroupId(null);
    setSaveError(null);
    setEditState({
      name: "",
      description: "",
      defaultCurrency: "USD",
    });
  }

  function startDeleteConfirmation(groupId: string) {
    setSaveError(null);
    setDeleteError(null);
    setEditingGroupId(null);
    setConfirmDeleteGroupId(groupId);
  }

  function cancelDeleteConfirmation() {
    setConfirmDeleteGroupId(null);
    setDeleteError(null);
  }

  async function handleSave(groupId: string) {
    setSaveError(null);

    const trimmedName = editState.name.trim();
    if (trimmedName.length < 2) {
      setSaveError("Group name must be at least 2 characters");
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateGroup(groupId, {
        name: trimmedName,
        description: editState.description.trim(),
        defaultCurrency: editState.defaultCurrency,
      });

      setGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                ...response.group,
              }
            : group
        )
      );
      cancelEdit();
    } catch (saveGroupError) {
      setSaveError(getApiErrorMessage(saveGroupError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(group: GroupListItem) {
    setDeleteError(null);
    setIsDeletingGroupId(group.id);

    try {
      await deleteGroup(group.id);
      setGroups((prev) => prev.filter((item) => item.id !== group.id));

      if (editingGroupId === group.id) {
        cancelEdit();
      }
      if (confirmDeleteGroupId === group.id) {
        setConfirmDeleteGroupId(null);
      }
    } catch (deleteError) {
      setDeleteError(getApiErrorMessage(deleteError));
    } finally {
      setIsDeletingGroupId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading groups...</p>;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No groups yet. Create your first group.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const canEdit = group.member_role === "owner" || group.member_role === "admin";
        const groupIsEditing = editingGroupId === group.id;
        const isDeletingThisGroup = isDeletingGroupId === group.id;
        const showDeleteConfirm = confirmDeleteGroupId === group.id;

        return (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className="rounded-xl border border-border bg-card p-5 space-y-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="truncate font-semibold text-foreground">{group.name}</h2>

              {canEdit && (
                <div 
                  className="flex items-center gap-2"
                  onClick={(e) => e.preventDefault()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      groupIsEditing ? cancelEdit() : startEdit(group);
                    }}
                    className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label={groupIsEditing ? "Cancel editing" : "Edit group"}
                    disabled={isDeletingThisGroup || showDeleteConfirm}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      showDeleteConfirm ? cancelDeleteConfirmation() : startDeleteConfirmation(group.id);
                    }}
                    className="rounded-md border border-destructive/30 p-1.5 text-destructive/80 hover:text-destructive disabled:opacity-50"
                    aria-label={showDeleteConfirm ? "Cancel delete" : "Delete group"}
                    disabled={isDeletingThisGroup || isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {showDeleteConfirm && (
              <div 
                className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                onClick={(e) => e.preventDefault()}
              >
                <p className="text-sm text-foreground">
                  Are you sure you want to delete this group? This will soft delete it and hide it from active groups.
                </p>

                {deleteError && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={isDeletingThisGroup}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(group);
                    }}
                  >
                    {isDeletingThisGroup ? "Deleting..." : "Yes, delete"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isDeletingThisGroup}
                    onClick={(e) => {
                      e.preventDefault();
                      cancelDeleteConfirmation();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!groupIsEditing ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{group.description?.trim() || "No description"}</p>
                <p>Currency: {group.default_currency}</p>
                <p className="capitalize">Your role: {group.member_role}</p>
              </div>
            ) : (
              <div 
                className="space-y-3"
                onClick={(e) => e.preventDefault()}
              >
                {saveError && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {saveError}
                  </p>
                )}

                <div className="space-y-1">
                  <Label htmlFor={`name-${group.id}`}>Group name</Label>
                  <Input
                    id={`name-${group.id}`}
                    value={editState.name}
                    onChange={(e) => setEditState((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`description-${group.id}`}>Description</Label>
                  <Input
                    id={`description-${group.id}`}
                    value={editState.description}
                    onChange={(e) => setEditState((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-1">
                  <Label>Currency</Label>
                  <Select
                    value={editState.defaultCurrency}
                    onValueChange={(value) => {
                      if (!value) return;
                      setEditState((prev) => ({ ...prev, defaultCurrency: value }));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    className="flex-1" 
                    disabled={isSaving} 
                    onClick={(e) => {
                      e.preventDefault();
                      handleSave(group.id);
                    }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" disabled={isSaving || isDeletingThisGroup} onClick={(e) => {
                      e.preventDefault();
                      cancelEdit();
                    }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Link>
        );
      })}

      {isEditing && <div className="hidden" aria-hidden="true" />}
    </div>
  );
}
