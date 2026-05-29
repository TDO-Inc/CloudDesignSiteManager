import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";
import { isMemberOfProject } from "@/lib/projects/queries";
import { createDownloadUrl } from "@/lib/storage/azure";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; fileId: string }> },
) {
  const { projectId, fileId } = await params;
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  if (!client && !staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (client && !(await isMemberOfProject(client.id, projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.projectId, projectId)),
  });
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (file.scanStatus !== "clean") {
    return NextResponse.json({ error: "not_ready", scanStatus: file.scanStatus }, { status: 409 });
  }

  try {
    const { url } = createDownloadUrl({ storageKey: file.storageKey, filename: file.filename });
    return NextResponse.redirect(url, 302);
  } catch (err) {
    return NextResponse.json({ error: "storage_not_configured", message: (err as Error).message }, { status: 503 });
  }
}
