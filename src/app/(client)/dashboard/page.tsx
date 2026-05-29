import Link from "next/link";
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
import { requireClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject, sectionStatusBadge, computeProjectProgress } from "@/lib/projects/queries";
import { Badge } from "@/components/ui/badge";
import { MilestoneBar } from "@/components/client/milestone-bar";

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

export default async function DashboardPage() {
  const user = await requireClient();
  const project = await getPrimaryClientProject(user.id).catch(() => null);
  if (!project) return null;

  const sections = project.templateSnapshot.briefStructure.sections;
  const progress = computeProjectProgress({
    templateSnapshot: project.templateSnapshot,
    briefs: project.briefs,
    currentMilestoneSlug: project.currentMilestoneSlug,
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl text-brand-navy">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Work on any section in any order.</p>
      </header>

      <div className="mb-8">
        <MilestoneBar
          milestones={project.templateSnapshot.milestoneConfig.milestones}
          currentIndex={progress.currentMilestoneIndex}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Content sections
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = iconMap[section.icon ?? "file-text"] ?? IconFileText;
          const status = sectionStatusBadge(section, project.briefs as any);
          return (
            <Link
              key={section.slug}
              href={`/dashboard/briefs/${section.slug}` as never}
              className="group rounded-lg border bg-white p-5 transition hover:border-brand-green hover:shadow"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-green/10 text-brand-green">
                  <Icon size={20} />
                </div>
                <Badge variant={status.tone === "success" ? "success" : status.tone === "warning" ? "warning" : "muted"}>
                  {status.label}
                </Badge>
              </div>
              <h3 className="mb-1 text-base text-brand-navy">{section.label}</h3>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </Link>
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
  );
}
