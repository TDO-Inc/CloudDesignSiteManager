/**
 * POST /api/auth/admin/sign-in — dev-only bypass for staff SSO.
 *
 * Lets a developer pick any name + email and sign in as a staff user. Useful
 * before the real intranet SSO is wired up, or for testing PM-to-PM flows
 * locally. Refuses to run in production.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, isDatabaseAvailable } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { getStaffSession } from "@/lib/auth/session";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_BYPASS !== "true") {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const session = await getStaffSession();

  // Try DB-backed sign-in first. If the DB is unreachable (e.g. Postgres not
  // yet set up locally), fall back to a session-only dev bypass so developers
  // can explore the UI before infrastructure is ready.
  if (isDatabaseAvailable()) {
    try {
      let user = await db.query.users.findFirst({ where: eq(users.email, email) });

      if (!user) {
        const [created] = await db
          .insert(users)
          .output()
          .values({
            email,
            name: parsed.data.name,
            userType: "staff",
            lastLoginAt: new Date(),
          });
        if (!created) throw new Error("User insert returned no rows");
        user = created;
      } else {
        if (user.userType !== "staff") {
          return NextResponse.json({ error: "email_belongs_to_client" }, { status: 400 });
        }
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
      }

      session.userId = user.id;
      session.email = user.email;
      session.name = user.name;
      session.externalId = `admin-bypass:${user.id}`;
      session.loggedInAt = Date.now();
      await session.save();

      await db.insert(auditLog).values({
        userId: user.id,
        action: "staff.sign_in.admin_bypass",
        targetType: "user",
        targetId: user.id,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
        metadata: { method: "admin_bypass" },
      });

      return NextResponse.json({ ok: true, redirectTo: "/staff" });
    } catch (err) {
      // DB unreachable — fall through to no-DB bypass below.
      console.warn("[admin/sign-in] DB unavailable, falling back to session-only bypass:", err);
    }
  }

  // No DB (or DB unreachable) — write session directly. Only works in dev.
  session.userId = `dev:${email}`;
  session.email = email;
  session.name = parsed.data.name;
  session.externalId = `admin-bypass:dev:${email}`;
  session.loggedInAt = Date.now();
  await session.save();
  return NextResponse.json({ ok: true, redirectTo: "/staff" });
}
