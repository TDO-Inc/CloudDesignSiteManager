"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  IconLayoutDashboard,
  IconMessageCircle,
  IconUsers,
  IconTemplate,
  IconBuildingSkyscraper,
  IconUserCog,
  IconArchive,
  IconHistory,
  IconBook,
  IconPlug,
  IconHelpCircle,
  IconSearch,
  IconBell,
  IconSettings,
  IconLogout,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StaffShellProps {
  user: { name: string; email: string };
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  badge?: boolean;
  exact?: boolean;
};

const NAV_PRIMARY: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: IconLayoutDashboard, exact: true },
  { href: "/staff/messages", label: "Messages", icon: IconMessageCircle, badge: true },
  { href: "/staff/clients", label: "Clients", icon: IconUsers },
];

const NAV_SECONDARY: NavItem[] = [
  { href: "/staff/templates", label: "Templates", icon: IconTemplate },
  { href: "/staff/offices", label: "Offices", icon: IconBuildingSkyscraper },
  { href: "/staff/users", label: "Staff users", icon: IconUserCog },
  { href: "/staff/exports", label: "Exports", icon: IconArchive },
  { href: "/staff/activity", label: "Activity log", icon: IconHistory },
  { href: "/staff/knowledge-base", label: "Knowledge base", icon: IconBook },
];

const NAV_TERTIARY: NavItem[] = [
  { href: "/staff/integrations", label: "Integrations", icon: IconPlug },
];

const STORAGE_KEY = "staff-nav-expanded";

export function StaffShell({ user, children, rightSidebar }: StaffShellProps) {
  const pathname = usePathname();
  const [rightOpen, setRightOpen] = useState(true);
  const [navExpanded, setNavExpanded] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setNavExpanded(true);
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
  }, []);

  function toggleNav() {
    setNavExpanded((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function isActive(item: NavItem): boolean {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between bg-brand-navy px-4 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-green text-sm font-bold">
            T
          </div>
          <span className="text-sm font-medium">Staff Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Search" className="text-white/70 hover:text-white">
            <IconSearch size={18} />
          </button>
          <button aria-label="Notifications" className="relative text-white/70 hover:text-white">
            <IconBell size={18} />
          </button>
          <button aria-label="Settings" className="text-white/70 hover:text-white">
            <IconSettings size={18} />
          </button>
          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-white/90">{user.name}</span>
          </div>
          <form action="/api/auth/logout?audience=staff" method="POST">
            <button type="submit" aria-label="Sign out" className="text-white/50 hover:text-white">
              <IconLogout size={18} />
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <nav
          className={cn(
            "hidden shrink-0 flex-col overflow-hidden bg-[#0F2B3C] py-2 transition-[width] duration-200 ease-in-out md:flex",
            navExpanded ? "w-[220px]" : "w-[48px]",
          )}
        >
          <NavGroup items={NAV_PRIMARY} expanded={navExpanded} isActive={isActive} />
          <NavDivider />
          <NavGroup items={NAV_SECONDARY} expanded={navExpanded} isActive={isActive} />
          <NavDivider />
          <NavGroup items={NAV_TERTIARY} expanded={navExpanded} isActive={isActive} />

          <div className="mt-auto">
            <NavGroup
              items={[{ href: "/staff/help", label: "Help", icon: IconHelpCircle }]}
              expanded={navExpanded}
              isActive={isActive}
            />
            <NavDivider />
            <div className={cn("px-1 py-1", navExpanded && "px-2")}>
              <button
                onClick={toggleNav}
                title={navExpanded ? "Collapse navigation" : "Expand navigation"}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-white/80",
                  navExpanded ? "w-full" : "h-9 w-9 justify-center",
                )}
              >
                {navExpanded ? <IconChevronLeft size={15} /> : <IconChevronRight size={15} />}
                {navExpanded && <span className="whitespace-nowrap">Collapse</span>}
              </button>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto bg-[#f5f7f9]">{children}</main>

        {/* Right sidebar with toggle */}
        <aside
          className={cn(
            "relative hidden border-l bg-white transition-all duration-200 lg:flex lg:flex-col",
            rightOpen ? "w-[280px]" : "w-0",
          )}
        >
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="absolute -left-3 top-6 z-10 grid h-6 w-6 place-items-center rounded-full border bg-white shadow"
            aria-label={rightOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {rightOpen ? <IconChevronRight size={14} /> : <IconChevronLeft size={14} />}
          </button>
          {rightOpen && rightSidebar}
        </aside>
      </div>
    </div>
  );
}

function NavDivider() {
  return <div className="mx-3 my-2 h-px bg-white/10" />;
}

function NavGroup({
  items,
  expanded,
  isActive,
}: {
  items: NavItem[];
  expanded: boolean;
  isActive: (item: NavItem) => boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", expanded ? "px-2" : "items-center px-1")}>
      {items.map((item) => (
        <NavItemLink key={item.href} item={item} expanded={expanded} active={isActive(item)} />
      ))}
    </div>
  );
}

function NavItemLink({
  item,
  expanded,
  active,
}: {
  item: NavItem;
  expanded: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href as never}
      title={!expanded ? item.label : undefined}
      className={cn(
        "relative flex items-center rounded-md transition-colors",
        expanded ? "w-full gap-2.5 px-3 py-2" : "h-9 w-9 justify-center",
        active
          ? "bg-brand-green/20 text-brand-green"
          : "text-white/55 hover:bg-white/10 hover:text-white/90",
      )}
    >
      <Icon size={17} />
      {expanded && (
        <span className="truncate whitespace-nowrap text-sm">{item.label}</span>
      )}
      {item.badge && (
        <span
          className={cn(
            "rounded-full bg-brand-coral",
            expanded ? "ml-auto h-2 w-2" : "absolute right-1 top-1 h-1.5 w-1.5",
          )}
        />
      )}
    </Link>
  );
}
