"use client";

import { useState } from "react";
import { IconBrandMonday, IconExternalLink } from "@tabler/icons-react";
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

const MONDAY_BOARD_ID = "1780036005";

interface Props {
  projectId: string;
  initialTheme: string | null;
  initialMondayItemId: string | null;
}

export function ProjectMetaForm({ projectId, initialTheme, initialMondayItemId }: Props) {
  const [theme, setTheme] = useState(initialTheme ?? "");
  const [mondayItemId, setMondayItemId] = useState(initialMondayItemId ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = theme !== (initialTheme ?? "") || mondayItemId !== (initialMondayItemId ?? "");

  const mondayUrl = mondayItemId
    ? `https://monday.com/boards/${MONDAY_BOARD_ID}/pulses/${mondayItemId}`
    : null;

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          websiteTheme: theme || null,
          mondayItemId: mondayItemId || null,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <Label htmlFor="meta-theme" className="text-xs text-muted-foreground">Website theme</Label>
          <select
            id="meta-theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">— not set —</option>
            {WEBSITE_THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[200px] flex-1">
          <Label htmlFor="meta-monday" className="text-xs text-muted-foreground">
            <IconBrandMonday size={12} className="mr-1 inline-block" />
            Monday.com item ID
          </Label>
          <div className="mt-1 flex gap-1">
            <Input
              id="meta-monday"
              value={mondayItemId}
              onChange={(e) => setMondayItemId(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 10950096722"
              className="h-8 text-sm"
            />
            {mondayUrl && (
              <a
                href={mondayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground hover:text-brand-green"
                title="Open in Monday.com"
              >
                <IconExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant={saved ? "outline" : "default"}
          disabled={!isDirty || saving}
          onClick={save}
          className="h-8 shrink-0"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}
