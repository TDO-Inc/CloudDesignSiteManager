/**
 * POST /api/auth/client/set-password — let a signed-in client set or change
 * their password.
 *
 * - First-time set (the client has no password yet): `newPassword` only.
 * - Change (the client already has a password): `currentPassword` is required
 *   and must verify before the new one is written.
 *
 * Clients reach this from the account page after signing in (typically via a
 * magic link the first time). Dev-bypass client sessions aren't backed by a
 * real user row, so they can't set a password.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getCurrentClient } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
});

export async function POST(req: Request) {
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  // Dev-bypass sessions aren't real users — nothing to update.
  if (client.id.startsWith("dev:client:")) {
    return NextResponse.json({ error: "dev_session" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "invalid_body";
    return NextResponse.json({ error: "invalid_body", message: msg }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, client.id) });
  if (!user || user.userType !== "client") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // If a password is already set, require and verify the current one.
  if (user.passwordHash) {
    const ok = parsed.data.currentPassword
      ? await verifyPassword(parsed.data.currentPassword, user.passwordHash)
      : false;
    if (!ok) {
      return NextResponse.json({ error: "current_password_incorrect" }, { status: 400 });
    }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  await db.insert(auditLog).values({
    userId: user.id,
    action: user.passwordHash ? "client.password_changed" : "client.password_set",
    targetType: "user",
    targetId: user.id,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ ok: true });
}
