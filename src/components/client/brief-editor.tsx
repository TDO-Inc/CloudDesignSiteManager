"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconLoader2, IconPlus, IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BriefField, BriefSection } from "@/lib/db/schema";

interface BriefEditorProps {
  projectId: string;
  section: BriefSection;
  initialContent: Record<string, unknown>;
  initialStatus: string;
  initialRevisionNote?: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function BriefEditor({ projectId, section, initialContent, initialStatus, initialRevisionNote }: BriefEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<Record<string, unknown>>(initialContent ?? {});
  const [status, setStatus] = useState<string>(initialStatus);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialJson = useMemo(() => JSON.stringify(initialContent ?? {}), [initialContent]);

  // Auto-save on debounce.
  useEffect(() => {
    if (JSON.stringify(content) === initialJson) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");
    debounceRef.current = setTimeout(() => {
      void saveDraft();
    }, 800);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  async function saveDraft() {
    try {
      const res = await fetch(`/api/projects/${projectId}/briefs/${section.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("save_failed");
      setSaveState("saved");
      setSavedAt(new Date());
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      console.error(err);
      setSaveState("error");
    }
  }

  async function submit() {
    setSaveState("saving");
    const res = await fetch(`/api/projects/${projectId}/briefs/${section.slug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, status: "submitted" }),
    });
    if (res.ok) {
      setStatus("submitted");
      setSaveState("saved");
      router.refresh();
    } else {
      setSaveState("error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Revision note banner */}
      {status === "needs_revision" && initialRevisionNote && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <IconAlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="mb-1 text-sm font-semibold text-amber-800">
              Your TDO team has requested a revision:
            </p>
            <p className="mb-2 text-sm text-amber-700 whitespace-pre-wrap">{initialRevisionNote}</p>
            <p className="text-xs text-amber-600">
              Update your content below and re-submit when ready.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-brand-navy">{section.label}</h1>
          {section.description && (
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} savedAt={savedAt} />
          <Badge variant={status === "submitted" || status === "complete" ? "success" : "muted"}>
            {prettyStatus(status)}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border bg-white p-6">
        {section.fields.map((field) => (
          <FieldEditor
            key={field.key}
            field={field}
            value={content[field.key]}
            onChange={(v) => setContent((c) => ({ ...c, [field.key]: v }))}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={saveDraft}>
          Save draft
        </Button>
        <Button onClick={submit} disabled={status === "submitted" || status === "complete"}>
          {status === "submitted" || status === "complete" ? "Submitted" : "Mark complete"}
        </Button>
      </div>
    </div>
  );
}

function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: Date | null }) {
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <IconLoader2 size={14} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-brand-green">
        <IconCheck size={14} /> Saved
      </span>
    );
  }
  if (state === "error") {
    return <span className="text-xs text-brand-coral">Save failed</span>;
  }
  if (savedAt) {
    return (
      <span className="text-xs text-muted-foreground">
        Saved {savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </span>
    );
  }
  return null;
}

function prettyStatus(s: string) {
  switch (s) {
    case "not_started":
      return "To do";
    case "in_progress":
      return "In progress";
    case "submitted":
      return "Submitted";
    case "complete":
      return "Done";
    case "needs_revision":
      return "Needs revision";
    default:
      return s;
  }
}

interface FieldEditorProps {
  field: BriefField;
  value: unknown;
  onChange: (v: unknown) => void;
}

function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  switch (field.type) {
    case "short_text":
    case "url":
    case "email":
    case "phone":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="ml-1 text-brand-coral">*</span>}
          </Label>
          <Input
            id={field.key}
            type={field.type === "email" ? "email" : field.type === "url" ? "url" : field.type === "phone" ? "tel" : "text"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      );

    case "long_text":
    case "rich_text":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="ml-1 text-brand-coral">*</span>}
          </Label>
          <Textarea
            id={field.key}
            rows={4}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      );

    case "checkbox_list":
      return (
        <div className="space-y-1.5">
          <Label>{field.label}</Label>
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((opt) => {
              const list = Array.isArray(value) ? (value as string[]) : [];
              const checked = list.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm hover:border-brand-green"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked ? [...list, opt] : list.filter((v) => v !== opt);
                      onChange(next);
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      );

    case "select":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={field.key}>{field.label}</Label>
          <select
            id={field.key}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case "structured_list":
      return <StructuredListEditor field={field} value={value} onChange={onChange} />;

    case "image":
    case "file":
      return (
        <div className="space-y-1.5">
          <Label>{field.label}</Label>
          <p className="text-xs text-muted-foreground">
            Upload files in <a href="/dashboard/files" className="text-brand-green hover:underline">Photos & Files</a>.
          </p>
        </div>
      );

    default:
      return null;
  }
}

function StructuredListEditor({ field, value, onChange }: FieldEditorProps) {
  const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
  const schema = field.itemSchema ?? [];

  function update(idx: number, key: string, v: unknown) {
    const next = items.slice();
    next[idx] = { ...(next[idx] ?? {}), [key]: v };
    onChange(next);
  }
  function add() {
    onChange([...items, {}]);
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <Label>{field.label}</Label>
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-md border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                #{idx + 1}
              </span>
              <Button variant="ghost" size="sm" onClick={() => remove(idx)} aria-label="Remove">
                <IconTrash size={14} /> Remove
              </Button>
            </div>
            <div className="grid gap-3">
              {schema.map((sub) => (
                <FieldEditor
                  key={sub.key}
                  field={sub}
                  value={item[sub.key]}
                  onChange={(v) => update(idx, sub.key, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={add}>
        <IconPlus size={14} /> Add
      </Button>
    </div>
  );
}
