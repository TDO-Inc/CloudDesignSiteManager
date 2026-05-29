/**
 * Client dashboard MOCKUP — standalone preview with hardcoded sample data.
 * Bypasses auth and the DB so the design can be reviewed without setting up
 * Postgres. Linked at /preview/client-dashboard.
 */

import {
  IconBuilding,
  IconPalette,
  IconStethoscope,
  IconUsers,
  IconCamera,
  IconHome,
  IconDeviceDesktop,
  IconStar,
  IconHeart,
  IconClipboardCheck,
  IconShieldCheck,
  IconCreditCard,
  IconFirstAidKit,
  IconInfoCircle,
  IconDental,
  IconMessageCircle,
  IconBulb,
  IconFileText,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { MilestoneBar } from "@/components/client/milestone-bar";
import { ClientShell } from "@/components/client/client-shell";

export const metadata = {
  title: "Client dashboard preview · TDO Website Design Portal",
};

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  building: IconBuilding,
  palette: IconPalette,
  stethoscope: IconStethoscope,
  users: IconUsers,
  camera: IconCamera,
  home: IconHome,
  "device-desktop": IconDeviceDesktop,
  star: IconStar,
  heart: IconHeart,
  "clipboard-check": IconClipboardCheck,
  "shield-check": IconShieldCheck,
  "credit-card": IconCreditCard,
  "first-aid-kit": IconFirstAidKit,
  "info-circle": IconInfoCircle,
  tooth: IconDental,
  "message-circle": IconMessageCircle,
  "file-text": IconFileText,
};

/** Sample milestones — matches the 7 stages from website-templates.md. */
const milestones = [
  { slug: "kickoff", label: "Kickoff", order: 1 },
  { slug: "content_collection", label: "Content collection", order: 2 },
  { slug: "round_1_review", label: "Round 1 review", order: 3 },
  { slug: "revisions", label: "Revisions", order: 4 },
  { slug: "pre_launch_setup", label: "Pre-launch setup", order: 5 },
  { slug: "training_and_approval", label: "Training & approval", order: 6 },
  { slug: "launch", label: "Launch", order: 7 },
];

type Status = { label: string; tone: "success" | "warning" | "muted" };

const sections: Array<{
  slug: string;
  label: string;
  description: string;
  icon: string;
  status: Status;
}> = [
  {
    slug: "office_details",
    label: "Office details",
    description: "Name, address, phone, hours, email.",
    icon: "building",
    status: { label: "Done", tone: "success" },
  },
  {
    slug: "branding",
    label: "Logo & branding",
    description: "Brand colors, fonts, style notes. Upload logo files separately under Photos & Files.",
    icon: "palette",
    status: { label: "Done", tone: "success" },
  },
  {
    slug: "doctor_bios",
    label: "Doctor bios",
    description: "Name, credentials, bio, education, memberships, headshot.",
    icon: "stethoscope",
    status: { label: "2 of 3 done", tone: "warning" },
  },
  {
    slug: "team",
    label: "Meet the team",
    description: "Names, roles, optional bios and photos.",
    icon: "users",
    status: { label: "To do", tone: "muted" },
  },
  {
    slug: "home",
    label: "Home page",
    description: "Tagline, welcome message, key differentiators, primary CTA.",
    icon: "home",
    status: { label: "Started", tone: "warning" },
  },
  {
    slug: "services",
    label: "Endodontic services",
    description: "Root canal, retreatment, apicoectomy, cracked teeth — and any custom services.",
    icon: "tooth",
    status: { label: "To do", tone: "muted" },
  },
  {
    slug: "technology",
    label: "Technology",
    description: "Selected technology and equipment featured on the site.",
    icon: "device-desktop",
    status: { label: "1 of 4 done", tone: "warning" },
  },
  {
    slug: "office_tour",
    label: "Office photos",
    description: "Exterior, waiting room, operatory, equipment — see the Photos & Files page.",
    icon: "camera",
    status: { label: "4 of 6 done", tone: "warning" },
  },
  {
    slug: "insurance",
    label: "Insurance & financial",
    description: "Insurance plans, payment options, fee schedule notes.",
    icon: "credit-card",
    status: { label: "To do", tone: "muted" },
  },
  {
    slug: "testimonials",
    label: "Testimonials & reviews",
    description: "Review links and selected quotes (with patient permission).",
    icon: "star",
    status: { label: "To do", tone: "muted" },
  },
];

export default function ClientDashboardPreviewPage() {
  const sampleUser = { name: "Dr. Jane Roberts", email: "dr.roberts@robertsendodontics.example.com" };
  const currentIndex = 1; // Content collection
  const progressPercent = 35;

  return (
    <ClientShell
      user={sampleUser}
      progressPercent={progressPercent}
      currentMilestoneLabel={milestones[currentIndex].label}
      currentMilestoneIndex={currentIndex}
      milestonesTotal={milestones.length}
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Preview banner */}
        <div className="mb-6 flex items-center gap-2 rounded-md border border-dashed border-brand-amber bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
          <span className="font-semibold uppercase tracking-wider">Preview</span>
          <span className="text-amber-900/80">
            This is a design mockup with sample data — no live project.
          </span>
        </div>

        <header className="mb-6">
          <h1 className="text-2xl text-brand-navy">Welcome back, Jane</h1>
          <p className="text-sm text-muted-foreground">Work on any section in any order.</p>
        </header>

        <div className="mb-8">
          <MilestoneBar milestones={milestones} currentIndex={currentIndex} />
        </div>

        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Content sections
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = iconMap[section.icon] ?? IconFileText;
            return (
              <div
                key={section.slug}
                className="group rounded-lg border bg-white p-5 transition hover:border-brand-green hover:shadow"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-green/10 text-brand-green">
                    <Icon size={20} />
                  </div>
                  <Badge
                    variant={
                      section.status.tone === "success"
                        ? "success"
                        : section.status.tone === "warning"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {section.status.label}
                  </Badge>
                </div>
                <h3 className="mb-1 text-base text-brand-navy">{section.label}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-lg border bg-brand-green/5 p-4 text-sm">
          <IconBulb size={20} className="mt-0.5 shrink-0 text-brand-green" />
          <div>
            <p className="font-medium text-brand-navy">Work on any section in any order.</p>
            <p className="text-muted-foreground">
              Not sure where something goes? Use the AI assistant in the lower-right to help sort it out.
            </p>
          </div>
        </div>
      </div>
    </ClientShell>
  );
}
