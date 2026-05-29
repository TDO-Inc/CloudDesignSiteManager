/**
 * AuthProvider — pluggable staff authentication interface.
 *
 * Clients use magic-link auth (see lib/auth/magic-link.ts). Staff authenticate
 * through the company intranet. The actual protocol (OIDC / SAML / proprietary)
 * is decided by the services manager and wired up behind this interface.
 *
 * For local development we ship `DevAuthProvider` which auto-authenticates a
 * test staff user — no intranet wiring required.
 */

export interface StaffProfile {
  /** Stable external identifier from the intranet (sub claim, NameID, etc.) */
  externalId: string;
  email: string;
  name: string;
  /** Optional groups / claims the intranet supplies. Used by future role mapping. */
  groups?: string[];
}

export interface AuthProvider {
  readonly name: string;

  /**
   * Begin the sign-in flow. Returns the URL the browser should navigate to.
   * For OIDC/SAML this is the IdP redirect. For DevAuthProvider this is just
   * a server route that completes the dev sign-in.
   */
  beginSignIn(opts: { returnTo: string }): Promise<{ redirectUrl: string }>;

  /**
   * Complete the sign-in callback. Called from the route the IdP redirects
   * back to. Should validate the response and return the resolved profile.
   */
  completeSignIn(opts: {
    request: Request;
  }): Promise<{ profile: StaffProfile; returnTo: string }>;

  /** Optional — sign the user out of the IdP (single sign-out). */
  signOut?(opts: { returnTo: string }): Promise<{ redirectUrl: string }>;
}
