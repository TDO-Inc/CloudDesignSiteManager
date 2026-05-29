/**
 * PATCH — update a staff user (rename, toggle admin, deactivate/reactivate).
 * DELETE — currently not implemented (we soft-deactivate instead).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { requireStaffAdmin } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  isAdmin: z.boolean().optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await requireStaffAdmin();
  const { userId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target || target.userType !== "staff") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Don't let an admin demote / deactivate themselves into a lockout.
  if (target.id === admin.id) {
    if (parsed.data.isAdmin === false) {
      return NextResponse.json({ error: "cannot_demote_self" }, { status: 400 });
    }
    if (parsed.data.active === false) {
      return NextResponse.json({ error: "cannot_deactivate_self" }, { status: 400 });
    }
  }

  const update: Partial<typeof users.$inferInsert> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.isAdmin !== undefined) update.isAdmin = parsed.data.isAdmin;
  if (parsed.data.active !== undefined) {
    update.deactivatedAt = parsed.data.active ? null : new Date();
  }
  if (parsed.data.password !== undefined) {
    update.passwordHash = await hashPassword(parsed.data.password);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, noop: true });
  }

  await db.update(users).set(update).where(eq(users.id, userId));

  await db.insert(auditLog).values({
    userId: admin.id,
    action: "staff_user.updated",
    targetType: "user",
    targetId: userId,
    metadata: {
      changes: {
        ...(parsed.data.name !== undefined ? { name: true } : {}),
        ...(parsed.data.isAdmin !== undefined ? { isAdmin: parsed.data.isAdmin } : {}),
        ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
        ...(parsed.data.password !== undefined ? { passwordReset: true } : {}),
      },
    },
  });

  return NextResponse.json({ ok: true });
}
