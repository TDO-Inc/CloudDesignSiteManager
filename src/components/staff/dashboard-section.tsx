"use client";

import { IconChevronDown } from "@tabler/icons-react";

interface DashboardSectionProps {
  title: string;
  badge?: { tone: "green" | "coral" | "muted"; count: number };
  right?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function DashboardSection({
  title,
  badge,
  right,
  defaultOpen,
  children,
}: DashboardSectionProps) {
  return (
    <details open={defaultOpen} className="rounded-lg border bg-white">
      <summary className="flex cursor-pointer items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <IconChevronDown
            size={16}
            className="transition-transform [details[open]>&]:rotate-180"
          />
          <h3 className="text-brand-navy">{title}</h3>
          {badge && (
            <span
              className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${
                badge.tone === "green"
                  ? "bg-brand-green text-white"
                  : badge.tone === "coral"
                    ? "bg-brand-coral text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {badge.count}
            </span>
          )}
        </div>
        {right && (
          <div onClick={(e) => e.preventDefault()}>{right}</div>
        )}
      </summary>
      <div className="border-t px-4 py-2">{children}</div>
    </details>
  );
}

export function FilterChips() {
  return (
    <div className="flex items-center gap-1.5">
      {["All", "Active", "Needs action", "Stalled"].map((label, i) => (
        <button
          key={label}
          className={`rounded-full border px-2.5 py-0.5 text-xs ${
            i === 0
              ? "border-brand-green bg-brand-green/10 text-brand-green"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
