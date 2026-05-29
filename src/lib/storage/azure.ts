/**
 * Azure Blob Storage helpers.
 *
 * Files are uploaded directly from the browser to Azure using a short-lived
 * SAS URL. Reads from staff/clients go through download SAS URLs as well —
 * the server never proxies file bytes.
 *
 * In dev, if AZURE_STORAGE_ACCOUNT is empty, we throw a clear error rather
 * than try to operate against a broken config.
 */

import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { nanoid } from "nanoid";

const ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT ?? "";
const KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY ?? "";
const CONTAINER = process.env.AZURE_STORAGE_CONTAINER ?? "tdo-portal-files";

function ensureConfigured() {
  if (!ACCOUNT || !KEY) {
    throw new Error(
      "Azure Blob Storage is not configured. Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCOUNT_KEY in your environment.",
    );
  }
}

function getCredential() {
  ensureConfigured();
  return new StorageSharedKeyCredential(ACCOUNT, KEY);
}

function getBlobServiceClient() {
  return new BlobServiceClient(
    `https://${ACCOUNT}.blob.core.windows.net`,
    getCredential(),
  );
}

/** Build a per-project storage key. */
export function buildStorageKey(projectId: string, category: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `projects/${projectId}/${category}/${nanoid(10)}-${safeName}`;
}

export interface CreateUploadUrlOptions {
  storageKey: string;
  contentType: string;
  expiresInMinutes?: number; // default 15
}

/** Returns a short-lived SAS URL the browser uses to PUT the file directly. */
export function createUploadUrl(opts: CreateUploadUrlOptions): { url: string; expiresAt: Date } {
  const credential = getCredential();
  const expiresInMinutes = opts.expiresInMinutes ?? 15;
  const startsOn = new Date(Date.now() - 60_000); // 1m clock skew tolerance
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60_000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER,
      blobName: opts.storageKey,
      permissions: BlobSASPermissions.parse("cw"), // create + write
      startsOn,
      expiresOn,
      contentType: opts.contentType,
      protocol: "https" as never,
    },
    credential,
  );

  const url = `https://${ACCOUNT}.blob.core.windows.net/${CONTAINER}/${encodeURI(opts.storageKey)}?${sas.toString()}`;
  return { url, expiresAt: expiresOn };
}

export interface CreateDownloadUrlOptions {
  storageKey: string;
  filename?: string;
  expiresInMinutes?: number; // default 10
}

/** Short-lived SAS URL for downloading. Honors filename via content-disposition. */
export function createDownloadUrl(opts: CreateDownloadUrlOptions): { url: string; expiresAt: Date } {
  const credential = getCredential();
  const expiresInMinutes = opts.expiresInMinutes ?? 10;
  const startsOn = new Date(Date.now() - 60_000);
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60_000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINER,
      blobName: opts.storageKey,
      permissions: BlobSASPermissions.parse("r"),
      startsOn,
      expiresOn,
      contentDisposition: opts.filename
        ? `attachment; filename="${opts.filename.replace(/"/g, "")}"`
        : undefined,
      protocol: "https" as never,
    },
    credential,
  );

  const url = `https://${ACCOUNT}.blob.core.windows.net/${CONTAINER}/${encodeURI(opts.storageKey)}?${sas.toString()}`;
  return { url, expiresAt: expiresOn };
}

/** Server-side delete (used for hard-delete / scrub). */
export async function deleteBlob(storageKey: string): Promise<void> {
  ensureConfigured();
  const blob = getBlobServiceClient().getContainerClient(CONTAINER).getBlobClient(storageKey);
  await blob.deleteIfExists();
}

/** Server-side stream read (used for export zip). */
export async function getBlobStream(storageKey: string) {
  ensureConfigured();
  const blob = getBlobServiceClient().getContainerClient(CONTAINER).getBlobClient(storageKey);
  const download = await blob.download();
  if (!download.readableStreamBody) {
    throw new Error(`No body returned for blob ${storageKey}`);
  }
  return download.readableStreamBody;
}
