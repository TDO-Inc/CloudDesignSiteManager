/**
 * ScanProvider — pluggable virus / malware scanning interface.
 *
 * The portal never serves a file to a client until its scan_status is "clean".
 * Implementations may run synchronously (small buffers) or hand off to an
 * asynchronous service that calls back into the portal via a webhook.
 *
 * For V1 we ship a NoOpScanProvider that returns "clean" immediately so local
 * dev works without any infrastructure. Services manager will plug in a real
 * provider (Microsoft Defender for Storage, ClamAV, etc.) for production.
 */

export type ScanResult =
  | { status: "clean"; details?: Record<string, unknown> }
  | { status: "infected"; threat?: string; details?: Record<string, unknown> }
  | { status: "error"; message: string; details?: Record<string, unknown> }
  | { status: "pending"; details?: Record<string, unknown> };

export interface ScanRequest {
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ScanProvider {
  readonly name: string;
  /**
   * Submit a file for scanning. May return immediately ("clean" / "infected" /
   * "error") or "pending" if the actual scan happens asynchronously.
   */
  scan(req: ScanRequest): Promise<ScanResult>;
}
