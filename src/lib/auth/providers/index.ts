import type { AuthProvider } from "./types";
import { DevAuthProvider } from "./dev";

export type { AuthProvider, StaffProfile } from "./types";
export { DevAuthProvider };

let cached: AuthProvider | null = null;

/**
 * Returns the configured staff auth provider. Selection is driven by the
 * STAFF_AUTH_PROVIDER env var. Add new provider modules (oidc, saml, etc.)
 * and switch them in here — the rest of the app talks only to AuthProvider.
 */
export function getStaffAuthProvider(): AuthProvider {
  if (cached) return cached;
  const provider = (process.env.STAFF_AUTH_PROVIDER ?? "dev").toLowerCase();

  // The set of real providers that are actually wired up. Anything not in here
  // resolves to the dev provider via the switch below.
  const REAL_PROVIDERS: string[] = []; // add "oidc", "saml", etc. as implemented

  // Safety net: the dev provider auto-authenticates an admin staff user with no
  // real credentials. Refuse to hand it out in production (whether selected
  // explicitly or via the unknown-provider fallback), unless an operator has
  // deliberately opted in with ALLOW_ADMIN_BYPASS=true. This guards against a
  // deploy that forgets to set STAFF_AUTH_PROVIDER, which would otherwise grant
  // admin access to anyone hitting /api/auth/staff/begin.
  const wouldUseDev = !REAL_PROVIDERS.includes(provider);
  if (
    wouldUseDev &&
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_ADMIN_BYPASS !== "true"
  ) {
    throw new Error(
      `Refusing to use the dev staff auth provider in production. ` +
        `Set STAFF_AUTH_PROVIDER to a real provider (e.g. oidc/saml) before deploying.`,
    );
  }

  switch (provider) {
    case "dev":
      cached = new DevAuthProvider();
      break;
    // case "oidc": cached = new OidcAuthProvider({ ... }); break;
    // case "saml": cached = new SamlAuthProvider({ ... }); break;
    default:
      console.warn(
        `[auth-providers] Unknown STAFF_AUTH_PROVIDER="${provider}" — falling back to dev. ` +
          `DO NOT DEPLOY TO PRODUCTION until a real provider is wired up.`,
      );
      cached = new DevAuthProvider();
  }
  return cached;
}
