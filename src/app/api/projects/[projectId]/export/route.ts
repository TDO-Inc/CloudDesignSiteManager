/**
 * GET /api/projects/:projectId/export
 *
 * Streams a zip of the project: briefs as a single JSON file, files in
 * category subfolders, and a README summarizing the project.
 */

import { Readable } from "node:stream";
import archiver from "archiver";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";
import { getProjectDetail } from "@/lib/projects/queries";
import { getBlobStream } from "@/lib/storage/azure";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  await requireStaff();

  const project = await getProjectDetail(projectId);
  if (!project) return new Response("Not found", { status: 404 });

  const projectFiles = await db.select().from(files).where(eq(files.projectId, projectId));

  const archive = archiver("zip", { zlib: { level: 9 } });

  // Catch archiver errors so they propagate to the client connection.
  archive.on("error", (err) => {
    console.error("[export]", err);
  });

  // README
  const readme = [
    `# ${project.name}`,
    ``,
    `**Organization:** ${project.organization.name}`,
    `**Office:** ${project.office.name}`,
    `**Template:** ${project.templateSnapshot.templateName} (v${project.templateSnapshot.templateVersion})`,
    `**Status:** ${project.status}`,
    `**Created:** ${project.createdAt.toISOString()}`,
    `**Current milestone:** ${project.currentMilestoneSlug ?? "—"}`,
    ``,
    `## Contents`,
    `- briefs.json — every content brief and its current values`,
    `- files/<category>/<filename> — uploaded files, grouped by category`,
    ``,
  ].join("\n");
  archive.append(readme, { name: "README.md" });

  // briefs.json
  archive.append(
    JSON.stringify(
      {
        project: {
          id: project.id,
          name: project.name,
          templateSnapshot: project.templateSnapshot,
          currentMilestoneSlug: project.currentMilestoneSlug,
        },
        briefs: project.briefs.map((b) => ({
          sectionSlug: b.sectionSlug,
          status: b.status,
          content: b.content,
          submittedAt: b.submittedAt,
          updatedAt: b.updatedAt,
        })),
      },
      null,
      2,
    ),
    { name: "briefs.json" },
  );

  // Files (only clean ones).
  for (const f of projectFiles) {
    if (f.scanStatus !== "clean") continue;
    try {
      const stream = await getBlobStream(f.storageKey);
      archive.append(stream as never, { name: `files/${f.category}/${f.filename}` });
    } catch (err) {
      console.warn(`[export] couldn't fetch ${f.storageKey}`, err);
      archive.append(`Couldn't fetch ${f.filename}: ${(err as Error).message}\n`, {
        name: `files/${f.category}/${f.filename}.ERROR.txt`,
      });
    }
  }

  archive.finalize();

  return new Response(Readable.toWeb(archive) as unknown as ReadableStream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}-export.zip"`,
      "cache-control": "no-store",
    },
  });
}
