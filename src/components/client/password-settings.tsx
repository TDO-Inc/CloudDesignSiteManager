"use client";

import { useState } from "react";
import { IconLock, IconCheck } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PasswordSettingsProps {
  /** Whether the client already has a password set (vs. setting one for the first time). */
  hasPassword: boolean;
  /** Dev-bypass sessions can't set a password (no backing user row). */
  isDevSession?: boolean;
}

export function PasswordSettings({ hasPassword, isDevSession }: PasswordSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/client/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: hasPassword ? currentPassword : undefined,
          newPassword,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;
        if (body?.error === "current_password_incorrect") {
          setError("Your current password isn't correct.");
        } else {
          setError(body?.message ?? "Couldn't update your password. Try again.");
        }
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  if (isDevSession) {
    return (
      <p className="text-sm text-muted-foreground">
        You&apos;re signed in with a development demo session, which isn&apos;t
        backed by a real account, so a password can&apos;t be set here.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4">
      {hasPassword && (
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-11"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="new-password">
          {hasPassword ? "New password" : "Password"}
        </Label>
        <Input
          id="new-password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11"
        />
      </div>
      {error && <p className="text-sm text-brand-coral">{error}</p>}
      {success && (
        <p className="flex items-center gap-1.5 text-sm text-brand-green">
          <IconCheck size={15} /> Password {hasPassword ? "updated" : "set"}. You can
          use it next time you sign in.
        </p>
      )}
      <Button type="submit" disabled={submitting} className="h-11">
        <IconLock size={16} />{" "}
        {submitting ? "Saving…" : hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  );
}
