import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { getStaffAuthProvider } from "@/lib/auth/providers";
import { getStaffSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = getStaffAuthProvider();

  try {
    const { profile, returnTo } = await provider.completeSignIn({ request: req });

    // Upsert staff user record by email.
    const email = profile.email.toLowerCase();
    let user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          email,
          name: profile.name,
          userType: "staff",
          lastLoginAt: new Date(),
        })
        .returning();
      user = created;
    } else {
      await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
      if (user.userType !== "staff") {
        // Existing record is a client — refuse to mix.
        return NextResponse.redirect(new URL("/sign-in?role=staff&error=not_staff", url.origin));
      }
    }

    const session = await getStaffSession();
    session.userId = user.id;
    session.email = user.email;
    session.name = user.name;
    session.externalId = profile.externalId;
    session.loggedInAt = Date.now();
    await session.save();

    await db.insert(auditLog).values({
      userId: user.id,
      action: "staff.sign_in",
      targetType: "user",
      targetId: user.id,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
      metadata: { provider: provider.name },
    });

    return NextResponse.redirect(new URL(returnTo, url.origin));
  } catch (err) {
    console.error("[staff/callback]", err);
    return NextResponse.redirect(new URL("/sign-in?role=staff&error=sign_in_failed", url.origin));
  }
}
