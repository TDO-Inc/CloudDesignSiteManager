/**
 * Magic-link authentication for client contacts.
 *
 * Flow:
 *   1. Client enters their email at /sign-in.
 *   2. Server checks the user exists with user_type=client (we only invite
 *      known client contacts — open registration is intentionally not allowed).
 *   3. Server generates a random token, stores SHA-256 of it in magic_links,
 *      and emails the raw token (in a one-tap URL) via Resend.
 *   4. Client clicks the link; server hashes the token, finds the row, marks
 *      it used, and creates an iron-session cookie.
 *
 * Rate-limited to one link per email per 60s (per spec section 5 — auth).
 */

import { randomBytes, createHash } from "node:crypto";
import { eq, and, gt, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { magicLinks, users, auditLog } from "@/lib/db/schema";

const TTL_MINUTES = Number(process.env.MAGIC_LINK_TTL_MINUTES ?? 15);
const RATE_LIMIT_SECONDS = 60;

export class MagicLinkError extends Error {
  constructor(public code: "rate_limited" | "unknown_user" | "invalid_token" | "expired" | "already_used", message?: string) {
    super(message ?? code);
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export interface RequestMagicLinkInput {
  email: string;
  ip?: string;
  userAgent?: string;
}

export interface RequestMagicLinkResult {
  userId: string;
  rawToken: string;
  expiresAt: Date;
}

/**
 * Request a magic link for a known client. Returns the raw token (so the
 * caller can email it) and the corresponding expiry. NEVER persists the raw
 * token — only the SHA-256 hash.
 */
export async function requestMagicLink(input: RequestMagicLinkInput): Promise<RequestMagicLinkResult> {
  const email = input.email.trim().toLowerCase();

  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), eq(users.userType, "client")),
  });
  if (!user) {
    // Surface unknown user to caller so it can decide whether to silently no-op
    // (recommended to avoid leaking which emails are clients).
    throw new MagicLinkError("unknown_user");
  }

  // Rate-limit: don't issue another link within RATE_LIMIT_SECONDS.
  const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000);
  const recent = await db.query.magicLinks.findFirst({
    where: and(eq(magicLinks.userId, user.id), gt(magicLinks.createdAt, cutoff)),
    orderBy: [desc(magicLinks.createdAt)],
  });
  if (recent) {
    throw new MagicLinkError("rate_limited");
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  await db.insert(magicLinks).values({
    userId: user.id,
    tokenHash,
    expiresAt,
    requestedIp: input.ip,
    userAgent: input.userAgent,
  });

  await db.insert(auditLog).values({
    userId: user.id,
    action: "magic_link.requested",
    targetType: "user",
    targetId: user.id,
    ipAddress: input.ip,
    userAgent: input.userAgent,
  });

  return { userId: user.id, rawToken, expiresAt };
}

export interface ConsumeMagicLinkResult {
  userId: string;
  email: string;
  name: string;
}

/**
 * Verify and consume a magic-link token. Throws MagicLinkError on any
 * failure (invalid, expired, already used).
 */
export async function consumeMagicLink(rawToken: string, ctx?: { ip?: string; userAgent?: string }): Promise<ConsumeMagicLinkResult> {
  const tokenHash = hashToken(rawToken);

  const link = await db.query.magicLinks.findFirst({
    where: eq(magicLinks.tokenHash, tokenHash),
  });
  if (!link) throw new MagicLinkError("invalid_token");
  if (link.usedAt) throw new MagicLinkError("already_used");
  if (link.expiresAt.getTime() < Date.now()) throw new MagicLinkError("expired");

  await db.update(magicLinks).set({ usedAt: new Date() }).where(eq(magicLinks.id, link.id));
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, link.userId));

  const user = await db.query.users.findFirst({ where: eq(users.id, link.userId) });
  if (!user) throw new MagicLinkError("invalid_token");

  await db.insert(auditLog).values({
    userId: user.id,
    action: "magic_link.consumed",
    targetType: "user",
    targetId: user.id,
    ipAddress: ctx?.ip,
    userAgent: ctx?.userAgent,
  });

  return { userId: user.id, email: user.email, name: user.name };
}
