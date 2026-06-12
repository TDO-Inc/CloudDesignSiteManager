import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { IconArrowLeft } from "@tabler/icons-react";
import { requireClient } from "@/lib/auth/current-user";
import { getPrimaryClientProject } from "@/lib/projects/queries";
import { BriefEditor } from "@/components/client/brief-editor";
import { db } from "@/lib/db";
import { contentBriefs } from "@/lib/db/schema";

interface PageProps {
  params: Promise<{ sectionSlug: string }>;
}

export default async function BriefPage({ params }: PageProps) {
  const { sectionSlug } = await params;
  const user = await requireClient();
  const project = await getPrimaryClientProject(user.id).catch(() => null);
  if (!project) notFound();

  const section = project.templateSnapshot.briefStructure.sections.find(
    (s) => s.slug === sectionSlug,
  );
  if (!section) notFound();

  let briefContent: Record<string, unknown> = {};
  let briefStatus = "not_started";
  let briefRevisionNote: string | null = null;
  try {
    let brief = await db.query.contentBriefs.findFirst({
      where: and(eq(contentBriefs.projectId, project.id), eq(contentBriefs.sectionSlug, sectionSlug)),
    });
    if (!brief) {
      const [created] = await db
        .insert(contentBriefs)
        .output()
        .values({ projectId: project.id, sectionSlug, status: "not_started", content: {} });
      brief = created;
    }
    if (!brief) throw new Error("Brief insert returned no rows");
    briefContent = (brief.content as Record<string, unknown>) ?? {};
    briefStatus = brief.status;
    briefRevisionNote = brief.revisionNote ?? null;
  } catch {
    // DB unavailable — render editor with empty content
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-green"
      >
        <IconArrowLeft size={16} /> Back to dashboard
      </Link>

      <BriefEditor
        projectId={project.id}
        section={section}
        initialContent={briefContent}
        initialStatus={briefStatus}
        initialRevisionNote={briefRevisionNote}
      />
    </div>
  );
}
