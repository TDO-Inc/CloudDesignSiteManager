"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconFileText,
  IconPhoto,
  IconExternalLink,
  IconMessageCircle,
  IconBook,
  IconHelpCircle,
  IconSeo,
  IconAccessible,
  IconPlus,
  IconLogout,
  IconSparkles,
  IconSend,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { NotificationBell } from "@/components/client/notification-bell";

interface ClientShellProps {
  user: { name: string; email: string };
  progressPercent: number;
  currentMilestoneLabel: string;
  currentMilestoneIndex: number;
  milestonesTotal: number;
  children: React.ReactNode;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Help me write my bio",
  "What photos do I need?",
  "Where does this file go?",
  "What's left to do?",
];

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/dashboard/briefs", label: "Content briefs", icon: IconFileText },
  { href: "/dashboard/files", label: "Photos & files", icon: IconPhoto },
  { href: "/dashboard/preview", label: "Preview site", icon: IconExternalLink },
  { href: "/dashboard/messages", label: "Messages", icon: IconMessageCircle, badge: 0 },
];

const resourcesNav = [
  { href: "https://lms.tdos.dental/courses/8", label: "Training", icon: IconBook, external: true },
  { href: "/dashboard/help", label: "Help center", icon: IconHelpCircle },
];

const additionalServicesNav = [
  { href: "/dashboard/seo", label: "SEO", icon: IconSeo },
  { href: "/dashboard/ada", label: "ADA compliance", icon: IconAccessible },
  { href: "/dashboard/more", label: "More services", icon: IconPlus },
];

export function ClientShell({
  user,
  progressPercent,
  currentMilestoneLabel,
  currentMilestoneIndex,
  milestonesTotal,
  children,
}: ClientShellProps) {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Scroll to bottom whenever messages change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(text?: string) {
    const content = (text ?? inputValue).trim();
    if (!content || isLoading) return;
    setInputValue("");

    const userMessage: ChatMessage = { role: "user", content };
    const next = [...messages, userMessage];
    setMessages(next);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      const reply = data.content ?? "Sorry, something went wrong. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between bg-brand-navy px-6 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-brand-green text-sm font-bold">
            T
          </div>
          <span className="text-sm font-medium">Client Portal</span>
        </div>
        <div className="flex items-center gap-3">
          {/* AI assistant trigger */}
          <button
            onClick={() => setAiOpen((v) => !v)}
            aria-label="Open AI assistant"
            title="AI assistant"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              aiOpen
                ? "bg-brand-green text-white"
                : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white",
            )}
          >
            <IconSparkles size={16} />
            <span className="hidden sm:inline">AI assistant</span>
          </button>

          <NotificationBell />

          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{user.name}</span>
          </div>

          <form action="/api/auth/logout?audience=client" method="POST">
            <button
              type="submit"
              aria-label="Sign out"
              className="text-white/60 hover:text-white"
              title="Sign out"
            >
              <IconLogout size={18} />
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="hidden w-[200px] shrink-0 flex-col border-r bg-white md:flex">
          <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
            <SidebarSection label="Main">
              {mainNav.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href || pathname.startsWith(item.href + "/")}
                  badge={"badge" in item ? item.badge : undefined}
                />
              ))}
            </SidebarSection>
            <SidebarSection label="Resources">
              {resourcesNav.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname.startsWith(item.href)}
                  external={"external" in item ? item.external : undefined}
                />
              ))}
            </SidebarSection>
            <SidebarSection label="Additional services">
              {additionalServicesNav.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname.startsWith(item.href)}
                />
              ))}
            </SidebarSection>
          </nav>

          <div className="border-t p-4">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted-foreground">Project progress</span>
              <span className="text-sm font-semibold text-brand-green">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">
              Step {currentMilestoneIndex + 1} of {milestonesTotal} · {currentMilestoneLabel}
            </p>
          </div>
        </aside>

        {/* Center content */}
        <main className="flex-1 overflow-y-auto bg-[#f5f7f9]">{children}</main>

        {/* AI assistant panel */}
        {aiOpen && (
          <aside className="flex w-[300px] shrink-0 flex-col border-l bg-white">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <IconSparkles size={16} className="text-brand-green" />
                <span className="text-sm font-semibold text-brand-navy">AI assistant</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close AI assistant"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Hi {user.name.split(" ")[0]}! I can help you write content, figure out
                    where things go, or answer questions about your website project.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => void sendMessage(s)}
                        className="rounded-full border bg-white px-3 py-1 text-xs hover:border-brand-green hover:text-brand-green"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "ml-auto bg-brand-navy text-white"
                          : "bg-muted text-foreground",
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <IconLoader2 size={13} className="animate-spin" />
                      Thinking…
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-3">
              <div className="flex items-center gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask anything…"
                  disabled={isLoading}
                  className="flex-1 rounded-md border px-3 py-1.5 text-sm focus:border-brand-green focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  aria-label="Send"
                  className="grid h-8 w-8 place-items-center rounded-md bg-brand-green text-white disabled:opacity-40"
                >
                  {isLoading ? (
                    <IconLoader2 size={14} className="animate-spin" />
                  ) : (
                    <IconSend size={14} />
                  )}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  external,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  badge?: number;
  external?: boolean;
}) {
  const className = cn(
    "flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
    active
      ? "border-l-2 border-brand-green bg-brand-green/5 font-semibold text-brand-navy"
      : "text-muted-foreground hover:bg-muted",
  );

  const inner = (
    <>
      <span className="flex items-center gap-2">
        <Icon size={16} className={active ? "text-brand-green" : ""} />
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-coral px-1 text-[10px] font-semibold text-white">
          {badge}
        </span>
      )}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href as never} className={className}>
      {inner}
    </Link>
  );
}
