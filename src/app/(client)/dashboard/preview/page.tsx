import { IconExternalLink, IconClockHour4 } from "@tabler/icons-react";
import { requireClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject } from "@/lib/projects/queries";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Preview site · TDO Client Portal",
};

export default async function PreviewPage() {
  const user = await requireClient();
  const project = await getPrimaryClientProject(user.id).catch(() => null);
  const links = (project?.links ?? {}) as Record<string, string>;
  const previewUrl = links.preview_site ?? "";

  if (!previewUrl) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-green/10 text-brand-green">
          <IconClockHour4 size={32} />
        </div>
        <h1 className="mb-2 text-xl text-brand-navy">Your preview is on its way</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your TDO team will share a preview link here once your site is ready to review.
          Keep filling in your content sections in the meantime — the more you provide,
          the faster we can build!
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <h1 className="mb-1 text-2xl text-brand-navy">Preview your site</h1>
        <p className="text-sm text-muted-foreground">
          This is your work-in-progress site. It updates as your TDO team builds it out.
        </p>
      </header>

      <div className="flex flex-col items-center gap-5 rounded-lg border bg-white p-8 text-center shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-green/10 text-brand-green">
          <IconExternalLink size={28} />
        </div>
        <div>
          <p className="mb-1 text-base font-semibold text-brand-navy">Your preview site is ready</p>
          <p className="break-all text-sm text-muted-foreground">{previewUrl}</p>
        </div>
        <Button asChild size="lg">
          <a href={previewUrl} target="_blank" rel="noopener noreferrer">
            Open preview site
          </a>
        </Button>
        <p className="text-xs text-muted-foreground">Opens in a new tab</p>
      </div>

      <div className="mt-6 rounded-md border bg-muted/30 p-4 text-sm">
        <p className="mb-1 font-medium text-brand-navy">Reviewing your site?</p>
        <p className="text-muted-foreground">
          Note anything you&apos;d like to change and add it to the relevant content section,
          or ask the AI assistant in the top bar to help you draft revisions. Your TDO team
          reviews all submitted sections.
        </p>
      </div>
    </div>
  );
}
