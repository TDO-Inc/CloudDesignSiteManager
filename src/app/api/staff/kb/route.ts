/**
 * GET  /api/staff/kb — list all KB articles (staff only)
 * POST /api/staff/kb — create a new KB article
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { kbArticles } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  category: z.enum(["process", "content_requirements", "photo_guidelines", "faq", "general"]),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const articles = await db
    .select()
    .from(kbArticles)
    .orderBy(desc(kbArticles.updatedAt));

  return NextResponse.json({ articles });
}

export async function POST(req: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const [article] = await db
    .insert(kbArticles)
    .output()
    .values({
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category,
      tags: parsed.data.tags ?? [],
      active: true,
      createdByUserId: staff.id,
    });
  if (!article) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, article });
}
