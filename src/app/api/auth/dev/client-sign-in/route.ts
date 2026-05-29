/**
 * POST /api/auth/dev/client-sign-in — dev-only demo client session.
 *
 * Creates a fake client session so developers can preview the client portal
 * without needing a real client account or a database. Disabled in production.
 */
import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_BYPASS !== "true") {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }

  const session = await getClientSession();
  session.userId = "dev:client:demo@tdo4endo.com";
  session.email = "demo@tdo4endo.com";
  session.name = "Demo Client";
  session.loggedInAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
