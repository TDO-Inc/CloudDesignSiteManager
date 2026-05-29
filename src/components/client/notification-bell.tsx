"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconBell,
  IconMessageCircle,
  IconAlertTriangle,
  IconEye,
  IconFlag,
  IconCheck,
  IconBellOff,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";

interface NotificationItem {
  id: string;
  type: "revision_requested" | "message_received" | "preview_ready" | "milestone_changed" | "brief_submitted";
  body: string;
  linkHref: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotifData {
  notifications: NotificationItem[];
  unreadMessages: number;
  unreadTotal: number;
}

function typeIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "message_received": return IconMessageCircle;
    case "revision_requested": return IconAlertTriangle;
    case "preview_ready": return IconEye;
    case "milestone_changed": return IconFlag;
    case "brief_submitted": return IconCheck;
    default: return IconBell;
  }
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotifData | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json() as NotifData;
      setData(json);
    } catch {
      // Swallow
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    void fetchNotifications();
  }

  function handleNotifClick(n: NotificationItem) {
    setOpen(false);
    if (n.linkHref) router.push(n.linkHref as never);
  }

  const unreadTotal = data?.unreadTotal ?? 0;
  const recentNotifs = data?.notifications.slice(0, 10) ?? [];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative text-white/80 hover:text-white"
      >
        <IconBell size={20} />
        {unreadTotal > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-8 z-50 w-80 rounded-lg border bg-white shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold text-brand-navy">Notifications</span>
            {unreadTotal > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-brand-green"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {/* Unread messages pinned item */}
            {(data?.unreadMessages ?? 0) > 0 && (
              <button
                onClick={() => { setOpen(false); router.push("/dashboard/messages" as never); }}
                className="flex w-full items-start gap-3 border-b bg-blue-50 px-4 py-3 text-left hover:bg-blue-100"
              >
                <IconMessageCircle size={16} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    You have {data!.unreadMessages} unread message{data!.unreadMessages !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-blue-600">Open Messages to reply</p>
                </div>
              </button>
            )}

            {/* Notifications list */}
            {recentNotifs.length === 0 && (data?.unreadMessages ?? 0) === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
                <IconBellOff size={24} />
                <span>You&apos;re all caught up</span>
              </div>
            ) : (
              recentNotifs.map((n) => {
                const Icon = typeIcon(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/40",
                      !n.readAt && "bg-brand-green/5",
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        "mt-0.5 shrink-0",
                        !n.readAt ? "text-brand-green" : "text-muted-foreground",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm", !n.readAt ? "font-medium text-brand-navy" : "text-muted-foreground")}>
                        {n.body}
                      </p>
                      <p className="text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
                    </div>
                    {!n.readAt && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
