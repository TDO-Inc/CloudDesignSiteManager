/**
 * Staff user management endpoints.
 *
 * GET — list all staff users (admin-only).
 * POST — create a new staff user with email/name/password (admin-only).
 *
 * The first staff user can be bootstrapped via `npm run staff:add` (see
 * src/scripts/add-staff.ts) so an admin exists before the UI is reachable.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { requireStaffAdmin } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
  isAdmin: z.boolean().default(false),
});

export async function GET() {
  await requireStaffAdmin();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      deactivatedAt: users.deactivatedAt,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      hasPassword: users.passwordHash,
    })
    .from(users)
    .where(eq(users.userType, "staff"))
    .orderBy(asc(users.createdAt));

  return NextResponse.json({
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      isAdmin: r.isAdmin,
      active: r.deactivatedAt === null,
      hasPassword: !!r.hasPassword,
      lastLoginAt: r.lastLoginAt,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await requireStaffAdmin();

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return NextResponse.json({ error: "email_exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const [created] = await db
    .insert(users)
    .output()
    .values({
      email,
      name: parsed.data.name,
      userType: "staff",
      passwordHash,
      isAdmin: parsed.data.isAdmin,
    });
  if (!created) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  await db.insert(auditLog).values({
    userId: admin.id,
    action: "staff_user.created",
    targetType: "user",
    targetId: created.id,
    metadata: { email: created.email, isAdmin: created.isAdmin },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: created.id,
      email: created.email,
      name: created.name,
      isAdmin: created.isAdmin,
    },
  });
}
