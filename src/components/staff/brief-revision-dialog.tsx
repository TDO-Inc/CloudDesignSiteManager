"use client";

import { useState } from "react";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface BriefRevisionDialogProps {
  projectId: string;
  sectionSlug: string;
  sectionLabel: string;
  onDone: () => void;
}

export function BriefRevisionDialog({
  projectId,
  sectionSlug,
  sectionLabel,
  onDone,
}: BriefRevisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!note.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/briefs/${sectionSlug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "needs_revision", revisionNote: note.trim() }),
      });
      if (!res.ok) throw new Error("Failed to request revision");
      setOpen(false);
      setNote("");
      onDone();
    } catch {
      setError("Failed to send revision request. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
      >
        <IconAlertTriangle size={14} />
        Request revision
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 min-w-[280px]">
      <p className="text-xs font-medium text-amber-800">
        Revision note for <strong>{sectionLabel}</strong>
      </p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Describe what needs to be updated…"
        rows={3}
        disabled={loading}
        className="text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !note.trim()}
          className="gap-1 bg-amber-600 hover:bg-amber-700 text-white"
        >
          {loading ? <IconLoader2 size={13} className="animate-spin" /> : null}
          Send request
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setOpen(false); setNote(""); setError(null); }}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
