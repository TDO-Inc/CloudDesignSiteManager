"use client";

import { useState } from "react";
import { IconSend } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface InviteClientButtonProps {
  projectId: string;
  clientCount: number;
}

export function InviteClientButton({ projectId, clientCount }: InviteClientButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; invited?: number; message?: string } | null>(null);

  async function handleInvite() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/invite`, { method: "POST" });
      const data = await res.json() as { ok?: boolean; invited?: number; error?: string };
      if (res.ok && data.ok) {
        setResult({ ok: true, invited: data.invited });
      } else {
        setResult({ ok: false, message: data.error ?? "Something went wrong" });
      }
    } catch {
      setResult({ ok: false, message: "Network error — please try again" });
    } finally {
      setLoading(false);
    }
  }

  if (clientCount === 0) {
    return (
      <span title="No client users on this project" className="cursor-not-allowed">
        <Button variant="outline" size="sm" disabled className="opacity-50">
          <IconSend size={14} />
          Send client invite
        </Button>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleInvite}
        disabled={loading}
      >
        <IconSend size={14} />
        {loading ? "Sending…" : "Send client invite"}
      </Button>
      {result && (
        <span className={`text-xs ${result.ok ? "text-brand-green" : "text-red-600"}`}>
          {result.ok
            ? `Invite sent to ${result.invited} client${(result.invited ?? 0) !== 1 ? "s" : ""}`
            : result.message}
        </span>
      )}
    </div>
  );
}
