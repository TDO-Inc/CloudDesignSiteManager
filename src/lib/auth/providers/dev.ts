import type { AuthProvider, StaffProfile } from "./types";

/**
 * DevAuthProvider — auto-authenticates a single configured staff user.
 *
 * Selected when STAFF_AUTH_PROVIDER=dev (the default for local development).
 * Never enable in production — there is no real authentication.
 */
export class DevAuthProvider implements AuthProvider {
  readonly name = "dev";

  private profile(): StaffProfile {
    const email = process.env.DEV_STAFF_EMAIL ?? "dev-staff@tdo4endo.com";
    const name = process.env.DEV_STAFF_NAME ?? "Dev Staff";
    return { externalId: `dev:${email}`, email, name };
  }

  async beginSignIn({ returnTo }: { returnTo: string }) {
    // Dev provider has nothing to redirect to — just hand the user back to
    // the callback route which will complete the sign-in.
    const url = `/api/auth/staff/callback?returnTo=${encodeURIComponent(returnTo)}`;
    return { redirectUrl: url };
  }

  async completeSignIn({ request }: { request: Request }) {
    const url = new URL(request.url);
    const returnTo = url.searchParams.get("returnTo") ?? "/staff";
    return { profile: this.profile(), returnTo };
  }

  async signOut({ returnTo }: { returnTo: string }) {
    return { redirectUrl: returnTo };
  }
}
