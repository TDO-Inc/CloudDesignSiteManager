import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Tests for the staff auth provider selection + production safety net.
 *
 * `getStaffAuthProvider()` memoizes its result in a module-level `cached`
 * variable and reads `process.env` at call time, so each case resets the module
 * registry (to clear `cached`) and restores the env vars it touches.
 */

// NODE_ENV is read-only in @types/node, so it's set via vi.stubEnv (which also
// gets restored by vi.unstubAllEnvs). The other two are plain mutable env vars.
const ENV_KEYS = ["STAFF_AUTH_PROVIDER", "ALLOW_ADMIN_BYPASS"] as const;

async function loadProvider() {
  vi.resetModules();
  const mod = await import("./index");
  return mod.getStaffAuthProvider;
}

describe("getStaffAuthProvider", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) saved[k] = process.env[k];
    // Start each test from a clean slate.
    delete process.env.STAFF_AUTH_PROVIDER;
    delete process.env.ALLOW_ADMIN_BYPASS;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns the dev provider by default outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const getStaffAuthProvider = await loadProvider();
    expect(getStaffAuthProvider().name).toBe("dev");
  });

  it("returns the dev provider when explicitly selected outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    process.env.STAFF_AUTH_PROVIDER = "dev";
    const getStaffAuthProvider = await loadProvider();
    expect(getStaffAuthProvider().name).toBe("dev");
  });

  it("falls back to the dev provider for an unknown value outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.STAFF_AUTH_PROVIDER = "totally-made-up";
    const getStaffAuthProvider = await loadProvider();
    expect(getStaffAuthProvider().name).toBe("dev");
  });

  it("throws in production when the provider is unset (would resolve to dev)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const getStaffAuthProvider = await loadProvider();
    expect(() => getStaffAuthProvider()).toThrow(/dev staff auth provider in production/);
  });

  it("throws in production when dev is selected explicitly", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.STAFF_AUTH_PROVIDER = "dev";
    const getStaffAuthProvider = await loadProvider();
    expect(() => getStaffAuthProvider()).toThrow(/dev staff auth provider in production/);
  });

  it("throws in production for an unknown provider (the dangerous fallback)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.STAFF_AUTH_PROVIDER = "oidc-typo";
    const getStaffAuthProvider = await loadProvider();
    expect(() => getStaffAuthProvider()).toThrow(/dev staff auth provider in production/);
  });

  it("allows the dev provider in production only when explicitly opted in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.ALLOW_ADMIN_BYPASS = "true";
    const getStaffAuthProvider = await loadProvider();
    expect(getStaffAuthProvider().name).toBe("dev");
  });
});
