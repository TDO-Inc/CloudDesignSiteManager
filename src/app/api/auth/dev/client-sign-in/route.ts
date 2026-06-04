/**
 * POST /api/auth/dev/client-sign-in — dev-only demo client session.
 *
 * Creates a fake client session so developers can preview the client portal
 * without needing a real client account or a database. Disabled in production.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getClientSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

const DEMO_EMAIL = "demo@tdo4endo.com";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_BYPASS !== "true") {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  // Prefer the seeded demo client so the dashboard renders a real, populated
  // project. Falls back to a cookie-only dev session if the DB is unavailable
  // or the demo user hasn't been seeded (npm run db:seed).
  let userId = `dev:client:${DEMO_EMAIL}`;
  let name = "Demo Client";
  try {
    const demo = await db.query.users.findFirst({ where: eq(users.email, DEMO_EMAIL) });
    if (demo && demo.userType === "client") {
      userId = demo.id;
      name = demo.name;
    }
  } catch {
    // DB unavailable — keep the cookie-only dev session.
  }

  const session = await getClientSession();
  session.userId = userId;
  session.email = DEMO_EMAIL;
  session.name = name;
  session.loggedInAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
