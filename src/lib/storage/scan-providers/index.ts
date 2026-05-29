import type { ScanProvider } from "./types";
import { NoOpScanProvider } from "./noop";

export type { ScanProvider, ScanRequest, ScanResult } from "./types";
export { NoOpScanProvider };

/**
 * Returns the configured scan provider. Selection is driven by the
 * SCAN_PROVIDER env var so the services manager can wire in a real provider
 * (Microsoft Defender for Storage, ClamAV, etc.) without touching app code.
 */
export function getScanProvider(): ScanProvider {
  const provider = (process.env.SCAN_PROVIDER ?? "noop").toLowerCase();
  switch (provider) {
    case "noop":
      return new NoOpScanProvider();
    // case "defender": return new DefenderScanProvider(...);
    // case "clamav":   return new ClamAvScanProvider(...);
    default:
      console.warn(
        `[scan-providers] Unknown SCAN_PROVIDER="${provider}" — falling back to noop. ` +
          `DO NOT DEPLOY TO PRODUCTION until a real provider is wired up.`,
      );
      return new NoOpScanProvider();
  }
}
