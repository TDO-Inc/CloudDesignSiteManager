/**
 * Session helper — iron-session cookies hold a tiny session payload pointing
 * at a user record in the DB. Two session cookies, one per portal:
 *   - `tdo_client_session` for magic-link clients
 *   - `tdo_staff_session`  for SSO-authenticated staff
 *
 * Keeping them separate makes it impossible for a client session to accidentally
 * grant staff access if some future code path mixes them up.
 */

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours, sliding

let warnedAboutDevSecret = false;
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV !== "production") {
      if (!warnedAboutDevSecret) {
        warnedAboutDevSecret = true;
        console.warn(
          "[session] SESSION_SECRET is not set (or shorter than 32 chars). " +
            "Using an ephemeral dev fallback so the dev server can boot. " +
            "DO NOT deploy without setting SESSION_SECRET in your environment.",
        );
      }
      return "dev-only-fallback-secret-do-not-use-in-production-0123";
    }
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters long.",
    );
  }
  return secret;
}

export type ClientSessionData = {
  userId?: string;
  email?: string;
  name?: string;
  loggedInAt?: number;
};

export type StaffSessionData = {
  userId?: string;
  email?: string;
  name?: string;
  externalId?: string;
  loggedInAt?: number;
};

const clientOpts = (): SessionOptions => ({
  cookieName: "tdo_client_session",
  password: getSecret(),
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  },
});

const staffOpts = (): SessionOptions => ({
  cookieName: "tdo_staff_session",
  password: getSecret(),
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  },
});

export async function getClientSession() {
  const store = await cookies();
  return getIronSession<ClientSessionData>(store, clientOpts());
}

export async function getStaffSession() {
  const store = await cookies();
  return getIronSession<StaffSessionData>(store, staffOpts());
}
