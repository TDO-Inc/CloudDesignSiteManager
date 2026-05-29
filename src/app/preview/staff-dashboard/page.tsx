/**
 * Staff dashboard MOCKUP — standalone preview with hardcoded sample data.
 * Bypasses auth and the DB. Linked at /preview/staff-dashboard.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StaffShell } from "@/components/staff/staff-shell";
import { DashboardSection, FilterChips } from "@/components/staff/dashboard-section";

export const metadata = {
  title: "Staff dashboard preview · TDO Website Design Portal",
};

const sampleUser = { name: "Jared Ardine", email: "jared.ardine@tdo4endo.com" };

interface SampleProject {
  id: string;
  name: string;
  templateName: string;
  officeName: string;
  milestoneSlug: string;
  milestoneLabel: string;
  progress: number;
}

const projects: SampleProject[] = [
  {
    id: "1",
    name: "Roberts Endodontics — Website Refresh",
    templateName: "Standard",
    officeName: "Springfield, IL",
    milestoneSlug: "content_collection",
    milestoneLabel: "Content collection",
    progress: 35,
  },
  {
    id: "2",
    name: "Mountain View — New 5-page Site",
    templateName: "Basic",
    officeName: "Boulder, CO",
    milestoneSlug: "round_1_review",
    milestoneLabel: "Round 1 review",
    progress: 68,
  },
  {
    id: "3",
    name: "Riverside Endo — Full Rebuild",
    templateName: "Standard",
    officeName: "Riverside, CA",
    milestoneSlug: "kickoff",
    milestoneLabel: "Kickoff",
    progress: 5,
  },
];

interface SampleActivity {
  id: string;
  projectId: string;
  projectName: string;
  action: string;
  actorName: string;
  timeAgo: string;
}

const recentActivity: SampleActivity[] = [
  {
    id: "a1",
    projectId: "1",
    projectName: "Roberts Endodontics — Website Refresh",
    action: "uploaded 4 office photos",
    actorName: "Dr. Jane Roberts",
    timeAgo: "12m ago",
  },
  {
    id: "a2",
    projectId: "1",
    projectName: "Roberts Endodontics — Website Refresh",
    action: "submitted the Branding content brief",
    actorName: "Dr. Jane Roberts",
    timeAgo: "2h ago",
  },
  {
    id: "a3",
    projectId: "2",
    projectName: "Mountain View — New 5-page Site",
    action: "requested revision on Home page copy",
    actorName: "Dr. Michael Chen",
    timeAgo: "yesterday",
  },
  {
    id: "a4",
    projectId: "1",
    projectName: "Roberts Endodontics — Website Refresh",
    action: "submitted the Office details content brief",
    actorName: "Dr. Jane Roberts",
    timeAgo: "3 days ago",
  },
];

function MilestoneBadge({ slug, label }: { slug: string; label: string }) {
  const palette: Record<string, string> = {
    kickoff: "bg-brand-purple text-purple-800",
    content_collection: "bg-brand-amber text-amber-800",
    round_1_review: "bg-brand-blue text-blue-800",
    revisions: "bg-brand-pink text-pink-800",
    pre_launch_setup: "bg-brand-green-100 text-brand-green-600",
    training_and_approval: "bg-brand-green-100 text-brand-green-600",
    launch: "bg-brand-green text-white",
  };
  return (
    <Badge className={`${palette[slug] ?? "bg-muted text-muted-foreground"} border-transparent`}>
      {label}
    </Badge>
  );
}

export default function StaffDashboardPreviewPage() {
  return (
    <StaffShell user={sampleUser}>
      <div className="px-6 py-6">
        {/* Preview banner */}
        <div className="mb-4 flex items-center gap-2 rounded-md border border-dashed border-brand-amber bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
          <span className="font-semibold uppercase tracking-wider">Preview</span>
          <span className="text-amber-900/80">Design mockup with sample data — no live project.</span>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex items-center gap-6 border-b text-sm">
          {["Summary", "Projects", "Clients", "Tasks", "Reports"].map((tab, i) => (
            <button
              key={tab}
              className={`pb-3 ${i === 0 ? "border-b-2 border-brand-green font-semibold text-brand-navy" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <DashboardSection title="Messages" badge={{ tone: "coral", count: 2 }} defaultOpen>
            <ul className="divide-y">
              <li className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-purple text-xs font-semibold text-purple-800">
                  JR
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-brand-navy">Dr. Jane Roberts</span>
                    <span className="text-xs text-muted-foreground">12m ago</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Roberts Endodontics · <span className="text-amber-700">Content collection</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    “Should our team photo be individual shots or a group photo?”
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue text-xs font-semibold text-blue-800">
                  MC
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium text-brand-navy">Dr. Michael Chen</span>
                    <span className="text-xs text-muted-foreground">yesterday</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mountain View Dental · <span className="text-blue-700">Round 1 review</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    “Can we swap the hero photo on the home page for the one with all three doctors?”
                  </p>
                </div>
              </li>
            </ul>
          </DashboardSection>

          <DashboardSection
            title="Client updates"
            badge={{ tone: "green", count: recentActivity.length }}
            defaultOpen
          >
            <ul className="divide-y">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-brand-green" />
                  <div className="flex-1">
                    <Link href={`/staff/projects/${a.projectId}` as never} className="font-medium text-brand-navy hover:underline">
                      {a.projectName}
                    </Link>
                    <span className="ml-2 text-muted-foreground">
                      {a.action} · {a.actorName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.timeAgo}</span>
                  <Link href={`/staff/projects/${a.projectId}` as never} className="text-xs text-brand-green hover:underline">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          </DashboardSection>

          <DashboardSection
            title="My projects"
            badge={{ tone: "green", count: projects.length }}
            right={<FilterChips />}
            defaultOpen
          >
            <ul className="divide-y">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link href={`/staff/projects/${p.id}` as never} className="font-medium text-brand-navy hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.templateName} · {p.officeName}
                    </div>
                  </div>
                  <MilestoneBadge slug={p.milestoneSlug} label={p.milestoneLabel} />
                  <div className="w-32">
                    <Progress value={p.progress} className="h-1.5" />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">{p.progress}%</span>
                </li>
              ))}
            </ul>
          </DashboardSection>

          <DashboardSection title="Recently auto-created" badge={{ tone: "muted", count: 2 }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/30 p-3">
                <Badge className="border-transparent bg-brand-purple text-purple-800">deal closed-won</Badge>
                <p className="mt-2 font-medium text-brand-navy">Riverside Endo — Full Rebuild</p>
                <p className="text-xs text-muted-foreground">Standard · Riverside, CA</p>
                <p className="mt-1 text-xs text-muted-foreground">Designer: Alex Kim · Closer: Pat Williams</p>
                <p className="mt-2 text-[11px] text-muted-foreground">3 days ago · via Zapier</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <Badge className="border-transparent bg-brand-amber text-amber-800">status synced</Badge>
                <p className="mt-2 font-medium text-brand-navy">Mountain View — New 5-page Site</p>
                <p className="text-xs text-muted-foreground">Content collection → Round 1 review</p>
                <p className="mt-1 text-xs text-muted-foreground">Web Design Board</p>
                <p className="mt-2 text-[11px] text-muted-foreground">5 days ago · via Zapier</p>
              </div>
            </div>
          </DashboardSection>
        </div>
      </div>
    </StaffShell>
  );
}
