"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconSend, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";

export interface MessageRow {
  id: string;
  body: string;
  isFromStaff: boolean;
  senderName: string;
  createdAt: string | Date;
}

interface MessagesClientProps {
  projectId: string;
  initialMessages: MessageRow[];
}

export function MessagesClient({ projectId, initialMessages }: MessagesClientProps) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`);
      if (!res.ok) return;
      const data = await res.json() as { messages: MessageRow[] };
      setMessages((prev) => {
        // Merge new messages (by id) without reordering existing ones
        const existingIds = new Set(prev.map((m) => m.id));
        const incoming = data.messages.filter((m) => !existingIds.has(m.id));
        if (incoming.length === 0) return prev;
        return [...prev, ...incoming];
      });
    } catch {
      // Swallow polling errors
    }
  }, [projectId]);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchMessages();
    }, 10_000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);

    // Optimistic add
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: MessageRow = {
      id: optimisticId,
      body: text,
      isFromStaff: false,
      senderName: "You",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const data = await res.json() as { ok: boolean; message: MessageRow };
      // Replace optimistic with real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...data.message, senderName: "You" } : m)),
      );
    } catch {
      setError("Failed to send message. Please try again.");
      // Remove optimistic
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Send a message to your TDO project manager to get started.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1",
                msg.isFromStaff ? "items-start" : "items-end",
              )}
            >
              <span className="text-xs text-muted-foreground">
                {msg.senderName} · {new Date(msg.createdAt).toLocaleString()}
              </span>
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-4 py-2 text-sm",
                  msg.isFromStaff
                    ? "bg-muted text-foreground"
                    : "bg-brand-navy text-white",
                )}
              >
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {error && (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        )}
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
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
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
        <p className="mt-1 text-xs text-muted-foreground">
          Messages go directly to your TDO project manager.
        </p>
      </div>
    </div>
  );
}
