"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const WEBSITE_THEMES = [
  "Pacific Beach",
  "Imperial Beach",
  "Bayside",
  "Del Mar",
  "Laguna Beach",
  "Sunset",
] as const;

interface Props {
  serviceTypes: Array<{ id: string; name: string; slug: string }>;
  templates: Array<{ id: string; name: string; description: string; serviceTypeId: string; version: number }>;
  offices: Array<{ id: string; name: string }>;
}

export function NewProjectForm({ serviceTypes, templates, offices }: Props) {
  const router = useRouter();
  const [serviceTypeId, setServiceTypeId] = useState(serviceTypes[0]?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [websiteTheme, setWebsiteTheme] = useState("");
  const [officeId, setOfficeId] = useState(offices[0]?.id ?? "");
  const [organizationName, setOrganizationName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.serviceTypeId === serviceTypeId),
    [templates, serviceTypeId],
  );

  const isWebsiteDesign = useMemo(
    () => serviceTypes.find((s) => s.id === serviceTypeId)?.slug === "website-design",
    [serviceTypes, serviceTypeId],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceTypeId,
          templateId,
          officeId,
          organizationName,
          projectName,
          clientName,
          clientEmail,
          sendInvite,
          websiteTheme: websiteTheme || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to create project");
        return;
      }
      const { projectId } = (await res.json()) as { projectId: string };
      router.push(`/staff/projects/${projectId}` as never);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-lg border bg-white p-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="service">Service type</Label>
          <select
            id="service"
            value={serviceTypeId}
            onChange={(e) => {
              setServiceTypeId(e.target.value);
              setTemplateId("");
            }}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {serviceTypes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="template">Template</Label>
          <select
            id="template"
            required
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select template…</option>
            {filteredTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
            ))}
          </select>
        </div>
      </section>

      {isWebsiteDesign && (
        <div>
          <Label htmlFor="website-theme">Website theme</Label>
          <select
            id="website-theme"
            value={websiteTheme}
            onChange={(e) => setWebsiteTheme(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select theme…</option>
            {WEBSITE_THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="organization">Client organization</Label>
          <Input id="organization" required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Roberts Endodontics" />
        </div>
        <div>
          <Label htmlFor="office">TDO office</Label>
          <select
            id="office"
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      </section>

      <div>
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Roberts Endodontics — website refresh" />
      </div>

      <div className="rounded-md border bg-muted/30 p-4">
        <h3 className="mb-3 text-sm">Primary client contact</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="client-name">Name</Label>
            <Input id="client-name" required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Dr. Jane Roberts" />
          </div>
          <div>
            <Label htmlFor="client-email">Email</Label>
            <Input id="client-email" type="email" required value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="dr.roberts@example.com" />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
          Send magic-link sign-in email now
        </label>
      </div>

      {error && <p className="text-sm text-brand-coral">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
