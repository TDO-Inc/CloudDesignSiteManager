/**
 * POST /api/projects/:projectId/files/upload-url
 *
 * Issues a short-lived Azure Blob Storage SAS URL the browser uses to PUT a
 * single file directly. After upload the client calls
 * POST /api/projects/:projectId/files to register the file and kick off the
 * virus scan.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";
import { isMemberOfProject } from "@/lib/projects/queries";
import { buildStorageKey, createUploadUrl } from "@/lib/storage/azure";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

const schema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_SIZE),
  category: z.string().min(1).max(60),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  if (!client && !staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (client && !(await isMemberOfProject(client.id, projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body", issues: parsed.error.flatten() }, { status: 400 });

  // Validate that the category is one of the template-defined categories.
  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const allowed = project.templateSnapshot.fileCategories.categories.map((c) => c.slug);
  if (!allowed.includes(parsed.data.category)) {
    return NextResponse.json({ error: "invalid_category" }, { status: 400 });
  }

  const storageKey = buildStorageKey(projectId, parsed.data.category, parsed.data.filename);

  try {
    const { url, expiresAt } = createUploadUrl({
      storageKey,
      contentType: parsed.data.contentType,
    });
    return NextResponse.json({ uploadUrl: url, storageKey, expiresAt });
  } catch (err) {
    console.error("[upload-url]", err);
    return NextResponse.json({ error: "storage_not_configured", message: (err as Error).message }, { status: 503 });
  }
}
