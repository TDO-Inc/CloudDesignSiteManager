import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMagicLink, MagicLinkError } from "@/lib/auth/magic-link";
import { sendEmail } from "@/lib/email/sendgrid";
import { magicLinkEmail } from "@/lib/email/templates/magic-link";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export const runtime = "nodejs";

const inputSchema = z.object({
  email: z.string().email(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TTL = Number(process.env.MAGIC_LINK_TTL_MINUTES ?? 15);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    const result = await requestMagicLink({
      email: parsed.data.email,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    });

    const user = await db.query.users.findFirst({ where: eq(users.id, result.userId) });
    const signInUrl = `${APP_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(result.rawToken)}`;

    const { subject, html, text } = magicLinkEmail({
      recipientName: user?.name ?? "there",
      signInUrl,
      expiresInMinutes: TTL,
    });

    await sendEmail({
      to: parsed.data.email,
      subject,
      html,
      text,
      template: "magic_link",
      userId: result.userId,
    });

    // Always return success to avoid leaking whether the email is a known client.
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof MagicLinkError) {
      if (err.code === "unknown_user") {
        // Silent no-op — same response as success.
        return NextResponse.json({ ok: true });
      }
      if (err.code === "rate_limited") {
        return NextResponse.json({ error: "rate_limited" }, { status: 429 });
      }
    }
    console.error("[magic-link/request]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
