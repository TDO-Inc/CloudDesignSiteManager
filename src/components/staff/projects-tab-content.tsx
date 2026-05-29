"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  IconLayoutList,
  IconLayoutKanban,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface MilestoneConfig {
  milestones: Array<{ slug: string; label: string; order: number }>;
}

interface ProjectItem {
  id: string;
  name: string;
  status: "active" | "archived" | "cancelled";
  currentMilestoneSlug: string | null;
  organizationName: string;
  officeName: string;
  templateSnapshot: {
    templateName: string;
    milestoneConfig: MilestoneConfig;
  };
}

interface ProjectsTabContentProps {
  projects: ProjectItem[];
}

type ViewMode = "list" | "board";
type StatusFilter = "all" | "active" | "archived";

export function ProjectsTabContent({ projects }: ProjectsTabContentProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const filtered = useMemo(() => {
    let result = projects;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.organizationName.toLowerCase().includes(q) ||
          p.officeName.toLowerCase().includes(q),
      );
    }
    return result;
  }, [projects, search, statusFilter]);

  return (
    <div>
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl text-brand-navy">All projects</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} projects</p>
        </div>
        <div className="flex items-center gap-3">
          {/* List / Board toggle */}
          <div className="flex items-center overflow-hidden rounded-full border">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                view === "list"
                  ? "bg-brand-navy text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IconLayoutList size={13} />
              List
            </button>
            <button
              onClick={() => setView("board")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors",
                view === "board"
                  ? "bg-brand-navy text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <IconLayoutKanban size={13} />
              Board
            </button>
          </div>
          <Button asChild size="sm">
            <Link href={"/staff/projects/new" as never}>
              <IconPlus size={14} /> New project
            </Link>
          </Button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients…"
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "active", "archived"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                statusFilter === s
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <ListView projects={filtered} />
      ) : (
        <BoardView projects={filtered} />
      )}
    </div>
  );
}

function ListView({ projects }: { projects: ProjectItem[] }) {
  return (
    <div className="rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2">Project</th>
            <th className="px-4 py-2">Client</th>
            <th className="px-4 py-2">Office</th>
            <th className="px-4 py-2">Template</th>
            <th className="px-4 py-2">Stage</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No projects match.
              </td>
            </tr>
          ) : (
            projects.map((p) => {
              const ms = p.templateSnapshot.milestoneConfig.milestones.find(
                (m) => m.slug === p.currentMilestoneSlug,
              );
              return (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/staff/projects/${p.id}` as never}
                      className="font-medium text-brand-navy hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.organizationName}</td>
                  <td className="px-4 py-3">{p.officeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.templateSnapshot.templateName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ms?.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === "active" ? "success" : "muted"}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function BoardView({ projects }: { projects: ProjectItem[] }) {
  // Collect unique milestones from all project snapshots, sorted by order.
  const milestoneMap = new Map<string, { label: string; order: number }>();
  for (const p of projects) {
    for (const ms of p.templateSnapshot.milestoneConfig.milestones) {
      if (!milestoneMap.has(ms.slug)) {
        milestoneMap.set(ms.slug, { label: ms.label, order: ms.order });
      }
    }
  }
  const milestones = [...milestoneMap.entries()]
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slug, ms]) => ({ slug, ...ms }));

  const unassigned = projects.filter((p) => !p.currentMilestoneSlug);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {unassigned.length > 0 && (
        <BoardColumn label="Unassigned" projects={unassigned} />
      )}
      {milestones.map((ms) => {
        const colProjects = projects.filter((p) => p.currentMilestoneSlug === ms.slug);
        return (
          <BoardColumn key={ms.slug} label={ms.label} projects={colProjects} />
        );
      })}
    </div>
  );
}

function BoardColumn({ label, projects }: { label: string; projects: ProjectItem[] }) {
  return (
    <div className="w-64 shrink-0">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
          {projects.length}
        </span>
      </div>
      <div className="space-y-2">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white/60 p-4 text-center text-xs text-muted-foreground">
            No projects
          </div>
        ) : (
          projects.map((p) => <BoardCard key={p.id} project={p} />)
        )}
      </div>
    </div>
  );
}

function BoardCard({ project: p }: { project: ProjectItem }) {
  return (
    <Link
      href={`/staff/projects/${p.id}` as never}
      className="block rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="mb-1 text-sm font-medium text-brand-navy leading-snug">{p.name}</p>
      <p className="text-xs text-muted-foreground">{p.organizationName}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{p.officeName}</span>
        <Badge variant={p.status === "active" ? "success" : "muted"} className="text-[10px]">
          {p.status}
        </Badge>
      </div>
    </Link>
  );
}
