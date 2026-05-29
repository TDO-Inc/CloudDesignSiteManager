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
