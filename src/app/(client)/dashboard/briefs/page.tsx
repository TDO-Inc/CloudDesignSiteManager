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
  IconFileText,
  IconChevronRight,
} from "@tabler/icons-react";
import { requireClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject, sectionStatusBadge, computeProjectProgress } from "@/lib/projects/queries";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

export default async function BriefsIndexPage() {
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
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl text-brand-navy">Content briefs</h1>
        <p className="text-sm text-muted-foreground">
          Tell us about your practice, one section at a time. Work on any section in any order — your answers save
          automatically.
        </p>
      </header>

      <div className="mb-8 rounded-lg border bg-white p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-brand-navy">
            {progress.sectionsCompleted} of {progress.sectionsTotal} sections done
          </span>
          <span className="text-sm font-semibold text-brand-green">{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} className="h-1.5" />
      </div>

      <ul className="flex flex-col gap-3">
        {sections.map((section) => {
          const Icon = iconMap[section.icon ?? "file-text"] ?? IconFileText;
          const status = sectionStatusBadge(section, project.briefs as any);
          return (
            <li key={section.slug}>
              <Link
                href={`/dashboard/briefs/${section.slug}` as never}
                className="group flex items-center gap-4 rounded-lg border bg-white p-4 transition hover:border-brand-green hover:shadow"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-green/10 text-brand-green">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base text-brand-navy">{section.label}</h2>
                    {section.required && (
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Required
                      </span>
                    )}
                  </div>
                  {section.description && (
                    <p className="truncate text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                <Badge
                  variant={status.tone === "success" ? "success" : status.tone === "warning" ? "warning" : "muted"}
                >
                  {status.label}
                </Badge>
                <IconChevronRight
                  size={18}
                  className="shrink-0 text-muted-foreground transition group-hover:text-brand-green"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
