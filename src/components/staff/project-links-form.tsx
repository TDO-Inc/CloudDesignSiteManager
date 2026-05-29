"use client";

import { useState } from "react";
import { IconExternalLink, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ProjectLinksFormProps {
  projectId: string;
  initialLinks: Record<string, string>;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type DomainStatus = "purchased" | "needs_purchase" | "";
type DomainOwnership = "client" | "tdo" | "";

export function ProjectLinksForm({ projectId, initialLinks }: ProjectLinksFormProps) {
  const [previewUrl, setPreviewUrl] = useState(initialLinks.preview_site ?? "");
  const [googleDrive, setGoogleDrive] = useState(initialLinks.google_drive ?? "");
  const [domain, setDomain] = useState(initialLinks.domain ?? "");
  const [domainStatus, setDomainStatus] = useState<DomainStatus>(
    (initialLinks.domain_status as DomainStatus) ?? "",
  );
  const [domainOwnership, setDomainOwnership] = useState<DomainOwnership>(
    (initialLinks.domain_ownership as DomainOwnership) ?? "",
  );
  const [domainProvider, setDomainProvider] = useState(initialLinks.domain_provider ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function save() {
    if (saveState === "saving") return;
    setSaveState("saving");
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          links: {
            preview_site: previewUrl,
            google_drive: googleDrive,
            domain,
            domain_status: domainStatus,
            domain_ownership: domainOwnership,
            domain_provider: domainOwnership === "client" ? domainProvider : "",
          },
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  return (
    <div className="space-y-5 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-brand-navy">Project links</h3>

      {/* Preview site + Google Drive */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="preview-url" className="mb-1 block text-xs text-muted-foreground">
            Preview site URL
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="preview-url"
              type="url"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void save()}
              placeholder="https://preview.example.com/site"
            />
            {previewUrl && (
              <ExternalLink href={previewUrl} />
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="google-drive" className="mb-1 block text-xs text-muted-foreground">
            Google Drive folder
          </Label>
          <div className="flex items-center gap-1.5">
            <Input
              id="google-drive"
              type="url"
              value={googleDrive}
              onChange={(e) => setGoogleDrive(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void save()}
              placeholder="https://drive.google.com/drive/folders/…"
            />
            {googleDrive && (
              <ExternalLink href={googleDrive} />
            )}
          </div>
        </div>
      </div>

      {/* Domain */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Domain</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="domain" className="mb-1 block text-xs text-muted-foreground">
              Domain name
            </Label>
            <Input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
            />
          </div>

          <div>
            <Label
              htmlFor="domain-provider"
              className={cn(
                "mb-1 block text-xs transition-colors",
                domainOwnership === "client" ? "text-muted-foreground" : "text-muted-foreground/40",
              )}
            >
              Domain provider
            </Label>
            <Input
              id="domain-provider"
              type="text"
              value={domainProvider}
              onChange={(e) => setDomainProvider(e.target.value)}
              placeholder="GoDaddy, Namecheap, Google Domains…"
              disabled={domainOwnership !== "client"}
              className={domainOwnership !== "client" ? "opacity-40" : ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Purchase status</Label>
            <ToggleGroup
              options={[
                { value: "purchased", label: "Purchased" },
                { value: "needs_purchase", label: "Needs purchase" },
              ]}
              value={domainStatus}
              onChange={(v) => setDomainStatus(v as DomainStatus)}
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Owned by</Label>
            <ToggleGroup
              options={[
                { value: "client", label: "Client" },
                { value: "tdo", label: "TDO" },
              ]}
              value={domainOwnership}
              onChange={(v) => {
                setDomainOwnership(v as DomainOwnership);
                if (v !== "client") setDomainProvider("");
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => void save()}
          disabled={saveState === "saving"}
          variant="outline"
          className="gap-1.5"
        >
          {saveState === "saving" && <IconLoader2 size={13} className="animate-spin" />}
          {saveState === "saved" && <IconCheck size={13} className="text-brand-green" />}
          {saveState === "saved" ? "Saved" : saveState === "error" ? "Error — retry" : "Save links"}
        </Button>
      </div>
    </div>
  );
}

function ExternalLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:border-brand-green hover:text-brand-green"
      title="Open in new tab"
    >
      <IconExternalLink size={15} />
    </a>
  );
}

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-9 overflow-hidden rounded-md border">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          className={cn(
            "flex-1 px-3 text-xs transition-colors",
            i > 0 && "border-l",
            value === opt.value
              ? "bg-brand-navy text-white"
              : "bg-white text-muted-foreground hover:bg-muted/50",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
