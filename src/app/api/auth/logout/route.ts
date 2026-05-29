import { NextResponse } from "next/server";
import { getClientSession, getStaffSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const audience = url.searchParams.get("audience") ?? "client";

  if (audience === "staff") {
    const session = await getStaffSession();
    const userId = session.userId;
    session.destroy();
    if (userId) {
      await db.insert(auditLog).values({
        userId,
        action: "staff.sign_out",
        targetType: "user",
        targetId: userId,
      });
    }
    return NextResponse.json({ ok: true });
  }

  const session = await getClientSession();
  const userId = session.userId;
  session.destroy();
  if (userId) {
    await db.insert(auditLog).values({
      userId,
      action: "client.sign_out",
      targetType: "user",
      targetId: userId,
    });
  }
  return NextResponse.json({ ok: true });
}
