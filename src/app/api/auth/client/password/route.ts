/**
 * POST /api/auth/client/password — email + password sign-in for clients.
 *
 * Clients can sign in either with a magic link (see lib/auth/magic-link.ts) or,
 * if they've set one, a password. A client only has a password once they set it
 * from the account page after signing in — there's no open registration, so a
 * client with no `passwordHash` simply can't use this route and should use the
 * magic-link flow (which also doubles as "forgot password / first-time access").
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { getClientSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  // Enumeration-safe: always run a hash compare, even when there's no user or
  // no password set, so response timing doesn't reveal which emails exist.
  const hash = user?.passwordHash ?? "scrypt:16384:8:1:00:00";
  const ok = await verifyPassword(parsed.data.password, hash);

  if (!user || user.userType !== "client" || !user.passwordHash || !ok) {
    if (user) {
      await db.insert(auditLog).values({
        userId: user.id,
        action: "client.sign_in.password_failure",
        targetType: "user",
        targetId: user.id,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      });
    }
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const session = await getClientSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.loggedInAt = Date.now();
  await session.save();

  await db.insert(auditLog).values({
    userId: user.id,
    action: "client.sign_in.password",
    targetType: "user",
    targetId: user.id,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
