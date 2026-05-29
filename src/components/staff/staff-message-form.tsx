"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconSend, IconLoader2 } from "@tabler/icons-react";

interface StaffMessageFormProps {
  projectId: string;
}

export function StaffMessageForm({ projectId }: StaffMessageFormProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setInput("");
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-brand-navy">Send a message to the client</h3>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mb-2 text-xs text-brand-green">Message sent successfully.</p>}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Type a message to the client… (Enter to send)"
          rows={3}
          disabled={sending}
          className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:border-brand-green focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="self-end grid h-10 w-10 place-items-center rounded-md bg-brand-green text-white disabled:opacity-40"
        >
          {sending ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <IconSend size={16} />
          )}
        </button>
      </div>
    </div>
  );
}
