import { NextResponse } from "next/server";
import { getStaffAuthProvider } from "@/lib/auth/providers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/staff";
  const provider = getStaffAuthProvider();
  const { redirectUrl } = await provider.beginSignIn({ returnTo });
  return NextResponse.redirect(new URL(redirectUrl, url.origin));
}
