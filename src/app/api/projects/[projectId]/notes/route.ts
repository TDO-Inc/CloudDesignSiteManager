import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { internalNotes, activityLog } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({ body: z.string().min(1).max(5000) });

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireStaff();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const [note] = await db
    .insert(internalNotes)
    .values({ projectId, authorUserId: user.id, body: parsed.data.body })
    .returning();

  await db.insert(activityLog).values({
    projectId,
    userId: user.id,
    action: "note.added",
    metadata: { noteId: note.id },
  });

  return NextResponse.json({ ok: true, id: note.id });
}
