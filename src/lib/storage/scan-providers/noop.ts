import type { ScanProvider, ScanRequest, ScanResult } from "./types";

/**
 * Always returns "clean". Use ONLY in dev / internal testing.
 * Set SCAN_PROVIDER to a real provider before any production deploy.
 */
export class NoOpScanProvider implements ScanProvider {
  readonly name = "noop";
  async scan(_req: ScanRequest): Promise<ScanResult> {
    return { status: "clean", details: { provider: "noop" } };
  }
}
