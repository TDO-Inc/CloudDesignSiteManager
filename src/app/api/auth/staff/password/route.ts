/**
 * POST /api/auth/staff/password — username/password staff sign-in.
 *
 * The PRIMARY staff sign-in method. Intranet SSO at /api/auth/staff/begin is
 * retained as a secondary option for offices that want to wire it up later.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { getStaffSession } from "@/lib/auth/session";

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

  // Constant-ish behavior to avoid leaking which emails exist: always run the
  // hash compare against a dummy value if no user / no password set.
  const hash = user?.passwordHash ?? "scrypt:16384:8:1:00:00";
  const ok = await verifyPassword(parsed.data.password, hash);

  if (!user || user.userType !== "staff" || !user.passwordHash || user.deactivatedAt || !ok) {
    // Log failure (without ip leakage of valid users) for ops visibility.
    if (user) {
      await db.insert(auditLog).values({
        userId: user.id,
        action: "staff.sign_in.password_failure",
        targetType: "user",
        targetId: user.id,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
      });
    }
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const session = await getStaffSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name;
  session.externalId = `password:${user.id}`;
  session.loggedInAt = Date.now();
  await session.save();

  await db.insert(auditLog).values({
    userId: user.id,
    action: "staff.sign_in.password",
    targetType: "user",
    targetId: user.id,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ ok: true, redirectTo: "/staff" });
}
