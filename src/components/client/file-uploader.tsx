"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { IconUpload, IconFile, IconCheck, IconAlertCircle, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";

interface FileUploaderProps {
  projectId: string;
  category: string;
  accept?: string[];
  multiple?: boolean;
}

type UploadState = {
  file: File;
  progress: number;
  status: "uploading" | "registering" | "scanning" | "done" | "error";
  error?: string;
};

export function FileUploader({ projectId, category, accept, multiple = true }: FileUploaderProps) {
  const router = useRouter();
  const [uploads, setUploads] = useState<UploadState[]>([]);

  const onDrop = useCallback(
    async (files: File[]) => {
      const initial = files.map<UploadState>((f) => ({ file: f, progress: 0, status: "uploading" }));
      setUploads((u) => [...u, ...initial]);
      // Upload each in parallel.
      await Promise.all(
        initial.map(async (entry, idx) => {
          await uploadOne(entry, uploads.length + idx);
        }),
      );
      router.refresh();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, category],
  );

  async function uploadOne(entry: UploadState, indexInList: number) {
    const setEntry = (patch: Partial<UploadState>) =>
      setUploads((u) => u.map((e, i) => (i === indexInList ? { ...e, ...patch } : e)));

    try {
      // 1. Ask the server for a SAS URL.
      const urlRes = await fetch(`/api/projects/${projectId}/files/upload-url`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: entry.file.name,
          contentType: entry.file.type || "application/octet-stream",
          sizeBytes: entry.file.size,
          category,
        }),
      });
      if (!urlRes.ok) {
        const body = await urlRes.json().catch(() => null);
        throw new Error(body?.message ?? body?.error ?? "Couldn't get upload URL");
      }
      const { uploadUrl, storageKey } = (await urlRes.json()) as {
        uploadUrl: string;
        storageKey: string;
      };

      // 2. PUT the file directly to Azure with a progress XHR.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.setRequestHeader("content-type", entry.file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setEntry({ progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(entry.file);
      });

      setEntry({ status: "registering", progress: 100 });

      // 3. Register the file server-side.
      const regRes = await fetch(`/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: entry.file.name,
          storageKey,
          contentType: entry.file.type || "application/octet-stream",
          sizeBytes: entry.file.size,
          category,
        }),
      });
      if (!regRes.ok) throw new Error("Couldn't register file");
      const reg = (await regRes.json()) as { scanStatus: string };
      setEntry({
        status: reg.scanStatus === "clean" ? "done" : reg.scanStatus === "infected" ? "error" : "scanning",
        error: reg.scanStatus === "infected" ? "File flagged by virus scan" : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setEntry({ status: "error", error: message });
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept: accept
      ? Object.fromEntries(accept.map((a) => [a.startsWith(".") ? "application/octet-stream" : a, a.startsWith(".") ? [a] : []]))
      : undefined,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragActive ? "border-brand-green bg-brand-green/5" : "border-muted hover:border-brand-green hover:bg-brand-green/5",
        )}
      >
        <input {...getInputProps()} />
        <IconUpload size={28} className="mx-auto mb-2 text-brand-green" />
        <p className="text-sm font-medium text-brand-navy">
          {isDragActive ? "Drop files here" : "Drag files here, or click to choose"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {multiple ? "You can select multiple files at once." : "One file at a time."}
        </p>
      </div>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploads.map((u, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 text-sm">
              <IconFile size={16} className="text-muted-foreground" />
              <span className="flex-1 truncate">{u.file.name}</span>
              {u.status === "uploading" && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconLoader2 size={12} className="animate-spin" /> {u.progress}%
                </span>
              )}
              {u.status === "registering" && (
                <span className="text-xs text-muted-foreground">Registering…</span>
              )}
              {u.status === "scanning" && (
                <span className="text-xs text-muted-foreground">Scanning…</span>
              )}
              {u.status === "done" && (
                <span className="flex items-center gap-1 text-xs text-brand-green">
                  <IconCheck size={14} /> Done
                </span>
              )}
              {u.status === "error" && (
                <span className="flex items-center gap-1 text-xs text-brand-coral">
                  <IconAlertCircle size={14} /> {u.error ?? "Failed"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
