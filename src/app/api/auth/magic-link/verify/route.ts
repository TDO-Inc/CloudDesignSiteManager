import { NextResponse } from "next/server";
import { consumeMagicLink, MagicLinkError } from "@/lib/auth/magic-link";
import { getClientSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_token", url.origin));
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  try {
    const result = await consumeMagicLink(token, { ip, userAgent });
    const session = await getClientSession();
    session.userId = result.userId;
    session.email = result.email;
    session.name = result.name;
    session.loggedInAt = Date.now();
    await session.save();
    return NextResponse.redirect(new URL("/dashboard", url.origin));
  } catch (err) {
    const code = err instanceof MagicLinkError ? err.code : "internal";
    return NextResponse.redirect(new URL(`/sign-in?error=${code}`, url.origin));
  }
}
