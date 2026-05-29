import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function POST() {
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  const user = client ?? staff;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  return NextResponse.json({ ok: true });
}
