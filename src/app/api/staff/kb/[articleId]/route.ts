/**
 * PATCH  /api/staff/kb/:articleId — update a KB article
 * DELETE /api/staff/kb/:articleId — delete a KB article
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { kbArticles } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.enum(["process", "content_requirements", "photo_guidelines", "faq", "general"]).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const { articleId } = await params;
  await requireStaff();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) update.title = parsed.data.title;
  if (parsed.data.content !== undefined) update.content = parsed.data.content;
  if (parsed.data.category !== undefined) update.category = parsed.data.category;
  if (parsed.data.tags !== undefined) update.tags = parsed.data.tags;
  if (parsed.data.active !== undefined) update.active = parsed.data.active;

  await db.update(kbArticles).set(update).where(eq(kbArticles.id, articleId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ articleId: string }> },
) {
  const { articleId } = await params;
  await requireStaff();

  await db.delete(kbArticles).where(eq(kbArticles.id, articleId));

  return NextResponse.json({ ok: true });
}
